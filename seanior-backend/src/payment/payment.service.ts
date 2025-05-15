// src/payment/payment.service.ts
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
   // เพิ่ม NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service'; // <--- เพิ่ม Import PrismaService
import { BookingStatus, RequestStatus, Prisma, EnrollmentStatus   } from '@prisma/client'; // <--- เพิ่ม Import BookingStatus จาก Prisma

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private webhookSecret: string; // <--- เพิ่มสำหรับเก็บ Webhook Secret
  private successUrl: string;    // <--- เพิ่มสำหรับเก็บ Success URL
  private cancelUrl: string;     // <--- เพิ่มสำหรับเก็บ Cancel URL
  private readonly logger = new Logger(PaymentService.name); // <--- เพิ่ม Logger

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const webhookSecretValue = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL'); // <<<--- อ่าน FRONTEND_URL

    // --- ตรวจสอบว่าได้ค่า Config ที่จำเป็นครบ ---
    if (!secretKey || !webhookSecretValue || !frontendUrl) {
      this.logger.error(
        'Missing critical configuration (Stripe Secret, Webhook Secret, or Frontend URL) in environment variables!',
      );
      this.logger.debug(`Loaded secretKey: ${secretKey ? 'OK' : 'MISSING'}`);
      this.logger.debug(`Loaded webhookSecretValue: ${webhookSecretValue ? 'OK' : 'MISSING'}`);
      this.logger.debug(`Loaded frontendUrl: ${frontendUrl ? frontendUrl : 'MISSING'}`);
      throw new Error(
        'Missing critical configuration. Please check environment variables.',
      );
    }

    // --- ประกอบ URL สำหรับ successUrl และ cancelUrl ---
    this.webhookSecret = webhookSecretValue;
    this.successUrl = `${frontendUrl}/payment/success`;
    this.cancelUrl = `${frontendUrl}/payment/cancel`;

    this.stripe = new Stripe(secretKey);

    this.logger.log('Stripe Service Initialized');
    // --- Log ค่าที่ได้ออกมาดูเพื่อตรวจสอบ ---
    this.logger.log(`USING SUCCESS_URL: [${this.successUrl}]`); // ใช้ log ปกติ เผื่อ debug ปิด
    this.logger.log(`USING CANCEL_URL: [${this.cancelUrl}]`);
    this.logger.log(`USING Webhook Secret: [${this.webhookSecret ? 'Loaded' : 'MISSING!'}]`);
  }

  async createCheckoutSessionForRequest(requestId: string, payingStudentId: string) {
    this.logger.log(`Attempting to create checkout session for request ID: ${requestId} by student: ${payingStudentId}`);

    // 1. ดึงข้อมูล Request จาก Database
    const courseRequest = await this.prisma.request.findUnique({
      where: { request_id: requestId },
      include: {
        Course: true, // ดึงข้อมูลคอร์สที่เกี่ยวข้อง
        student: true, // ดึงข้อมูลนักเรียนเจ้าของ Request
      },
    });

    // 2. ตรวจสอบ Request
    if (!courseRequest) {
      this.logger.warn(`Checkout session creation failed: Request ID ${requestId} not found.`);
      throw new NotFoundException(`Course request with ID ${requestId} not found.`);
    }
    if (courseRequest.student_id !== payingStudentId) {
      this.logger.warn(`Checkout session creation failed: Student ${payingStudentId} is not the owner of request ${requestId}.`);
      throw new ForbiddenException('You are not authorized to pay for this request.');
    }
    if (courseRequest.status !== RequestStatus.APPROVED_PENDING_PAYMENT) {
      this.logger.warn(`Checkout session creation failed: Request ${requestId} is not approved for payment. Status: ${courseRequest.status}`);
      throw new BadRequestException(`This course request is not approved for payment (Status: ${courseRequest.status}).`);
    }

    // (Optional) ส่วนตรวจสอบ existingPendingBooking (จากคำแนะนำก่อนหน้า ถ้าคุณใส่ไว้)
    // const existingPendingBooking = await this.prisma.booking.findFirst({ ... });
    // if (existingPendingBooking) { ... throw new ConflictException ... }

    const course = courseRequest.Course; // ข้อมูลคอร์สจาก Request ที่ดึงมา
    if (!course) {
         // ไม่ควรเกิดขึ้นถ้า Foreign Key ถูกต้อง แต่เช็คไว้ก็ดี
        this.logger.error(`Data integrity issue: Course data missing for request ID ${requestId}.`);
        throw new InternalServerErrorException('Associated course data not found for this request.');
    }


    // 3. สร้าง Booking record (เหมือนเดิม แต่เพิ่ม requestId)
    let booking;
    try {
      booking = await this.prisma.booking.create({
        data: {
          courseId: course.course_id, // ID ของคอร์สจาก Request
          userId: payingStudentId,    // ID ของนักเรียนที่จ่ายเงิน
          amount: course.price,       // ราคาจากข้อมูลคอร์ส (หรือ request.request_price)
          currency: 'thb',
          status: BookingStatus.PENDING_PAYMENT,
          requestId: courseRequest.request_id, // <<<--- เชื่อม Booking กับ Request
        },
      });
      this.logger.log(`Created booking ${booking.id} for request ${requestId}`);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          this.logger.error(`Unique constraint failed creating booking, likely duplicate requestId ${requestId}: ${error.message}`, error.stack);
          throw new ConflictException('A booking for this request already exists or is being processed.');
      }
      this.logger.error(`Failed to create booking record for request ${requestId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Could not initiate booking process.');
    }

    if (!booking || !booking.id) {
        this.logger.error('Booking object or Booking ID is missing before creating Stripe session.');
        throw new InternalServerErrorException('Critical data missing for payment session due to booking creation failure.');
    }
    const finalSuccessUrl = `${this.successUrl}?booking_id=${booking.id}&request_id=${requestId}`;
    const finalCancelUrl = `${this.cancelUrl}?request_id=${requestId}`;
    this.logger.debug(`Final successUrl for Stripe: [${finalSuccessUrl}]`);
    this.logger.debug(`Final cancelUrl for Stripe: [${finalCancelUrl}]`);

    // 4. สร้าง Stripe Checkout Session (เหมือนเดิม)
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['promptpay', 'card'],
        line_items: [{
          price_data: {
            currency: 'thb',
            product_data: { name: course.course_name },
            unit_amount: course.price, // หรือ request.request_price
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: finalSuccessUrl,
        cancel_url: finalCancelUrl,
        metadata: {
          bookingId: booking.id, // metadata เดิม
          requestId: requestId,  // เพิ่ม requestId ใน metadata ด้วย
        },
      });

      this.logger.log(`Created Stripe session ${session.id} for booking ${booking.id} (request ${requestId})`);

      // อัปเดต Booking ด้วย Stripe Session ID (เหมือนเดิม)
      await this.prisma.booking.update({
         where: { id: booking.id },
         data: { stripeCheckoutSessionId: session.id }
      });

      return { url: session.url, sessionId: session.id, bookingId: booking.id };
    } catch (error) {
      this.logger.error(`Failed to create Stripe checkout session for booking ${booking.id} (request ${requestId}): ${error.message}`, error.stack);
      // อาจจะ Rollback การสร้าง Booking หรือเปลี่ยนสถานะ Booking เป็น FAILED
      await this.prisma.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.FAILED }
      });
      // อาจจะเปลี่ยนสถานะ Request กลับเป็น APPROVED_PENDING_PAYMENT ถ้าต้องการให้นักเรียนลองจ่ายใหม่ได้
      throw new InternalServerErrorException('Could not create payment session.');
    }
  }

  // --- Method จัดการ Webhook หลัก ---
  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      // ตรวจสอบ Signature และ Parse Event
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret, // ใช้ Webhook Secret จาก Config
      );
    } catch (err) {
      // โยน Error เพื่อให้ Controller ตอบกลับ Bad Request
      throw new BadRequestException(
        `Webhook signature verification failed: ${err.message}`,
      );
    }

    this.logger.log(`Received Stripe event: ${event.type} (${event.id})`);

    // จัดการ Event ประเภทต่างๆ
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': // ใช้ logic เดียวกันได้
        const sessionCompleted = event.data.object as Stripe.Checkout.Session;
        this.logger.log(
          `Webhook processing: ${event.type} for session ${sessionCompleted.id}`,
        );
        await this.handleCheckoutSessionCompleted(sessionCompleted); // เรียก Method ย่อย
        break;
      case 'checkout.session.async_payment_failed':
        const sessionAsyncFailed = event.data.object as Stripe.Checkout.Session;
        this.logger.warn(
          `Webhook processing: ${event.type} for session ${sessionAsyncFailed.id}`,
        );
        await this.handleCheckoutSessionFailed(sessionAsyncFailed); // เรียก Method ย่อย
        break;
      // สามารถเพิ่ม case สำหรับ event อื่นๆ ที่สนใจได้
      default:
        this.logger.log(`Unhandled event type ${event.type}`);
    }
  }

  // --- Method ย่อย จัดการ Webhook กรณีสำเร็จ ---
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    const bookingId = session.metadata?.bookingId;
    const requestId = session.metadata?.requestId;
    if (!bookingId) {
      this.logger.error(
        `Webhook Error: Missing bookingId in metadata for session ${session.id}`,
      );
      return; // ออกจากการทำงานถ้าไม่มี bookingId
    }

    // ตรวจสอบสถานะการชำระเงินจาก Stripe อีกครั้ง
    if (session.payment_status === 'paid') {
    this.logger.log(`Webhook: Payment successful for booking ${bookingId} (Request ID: ${requestId})`);
    try {
      // 1. อัปเดตสถานะ Booking เป็น CONFIRMED (เหมือนเดิม)
      const updatedBooking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          stripeCheckoutSessionId: session.id,
        },
      });
      this.logger.log(`Updated booking ${updatedBooking.id} status to CONFIRMED`);

      // 2. --- ADD: อัปเดตสถานะ Request เป็น PAID_AND_ENROLLED ---
      if (requestId) { // ตรวจสอบว่ามี requestId ใน metadata หรือไม่
        const updatedRequest = await this.prisma.request.update({
          where: { request_id: requestId },
          data: {
            status: RequestStatus.PAID_AND_ENROLLED,
          },
          include: { // <<<--- เพิ่ม include Course ที่นี่ เพื่อเอา course_duration
              Course: {
                  select: { 
                    course_id: true,                 // มีอยู่แล้ว (ถ้าคุณเพิ่มตาม Error ก่อนหน้า)
                    course_duration: true,         // มีอยู่แล้ว
                    number_of_total_sessions: true, // มีอยู่แล้ว
                    allowed_absence_buffer: true   // <<<--- เพิ่มบรรทัดนี้เข้าไป
                  }
                  
              }
          }
        });
        this.logger.log(`Updated request ${updatedRequest.request_id} status to PAID_AND_ENROLLED`);

        // --- 3. สร้าง Enrollment Record โดยตรงที่นี่ ---
        if (updatedRequest && updatedRequest.Course) {
              try {
                const startDate = updatedRequest.request_date;
                const courseData = updatedRequest.Course;

                const targetSessions = courseData.number_of_total_sessions;
                // คำนวณ max_sessions_allowed
                // ถ้ามี allowed_absence_buffer ใน courseData และเป็นตัวเลข ให้ใช้ค่านั้น
                // ถ้าไม่ ให้ default เป็น targetSessions + 2 (หรือค่าที่คุณต้องการ)
                const absenceBuffer = (typeof courseData.allowed_absence_buffer === 'number' && courseData.allowed_absence_buffer >= 0)
                                      ? courseData.allowed_absence_buffer
                                      : 2; // Default เผื่อขาดได้ 2 ครั้ง
                const maxAllowed = targetSessions + absenceBuffer;

                const newEnrollment = await this.prisma.enrollment.create({
                  data: {
                    request_id: requestId,
                    start_date: startDate,
                    status: EnrollmentStatus.ACTIVE, // <<<--- ใช้ Enum (ต้อง Import EnrollmentStatus from '@prisma/client')
                    request_date: startDate,
                    target_sessions_to_complete: targetSessions, // <<<--- เพิ่ม
                    max_sessions_allowed: maxAllowed,          // <<<--- เพิ่ม
                    // actual_sessions_attended จะเป็น 0 โดย Default จาก Schema
                  },
                });
                this.logger.log(`Created enrollment ${newEnrollment.enrollment_id} for request ${requestId} with target ${targetSessions} sessions, max ${maxAllowed} allowed.`);
              } catch (enrollmentError) {
            if (enrollmentError instanceof Prisma.PrismaClientKnownRequestError && enrollmentError.code === 'P2002') {
               this.logger.warn(`Enrollment for request ID ${requestId} already exists or unique constraint failed.`);
            } else {
               this.logger.error(`Failed to create enrollment for request ${requestId}: ${enrollmentError.message}`, enrollmentError.stack);
            }
          }
        } else { // จบ if (updatedRequest)
          this.logger.warn(`Could not find request ${requestId} to create enrollment after payment (it might have been deleted or data is inconsistent).`);
        }
      } else { // จบ if (requestId)
        this.logger.warn(`Webhook for booking ${bookingId} is missing requestId in metadata. Cannot update request or create enrollment.`);
      }
        // *** TODO: ส่ง Email ยืนยันการลงทะเบียนและชำระเงินสำเร็จ ***
      console.log(`TODO: Send enrollment & payment confirmation email for booking ${bookingId}`);

      } catch (error) {
        // จัดการกรณีหา booking ไม่เจอ (อาจถูกลบไปแล้ว?) หรือ DB error
        if (error.code === 'P2025') {
          // Prisma error code for record not found
          this.logger.error(
            `Webhook Error: Booking ${bookingId} not found for update.`,
          );
        } else {
          this.logger.error(
            `Webhook Error: Failed to update booking ${bookingId} to confirmed: ${error.message}`,
            error.stack,
          );
        }
      }
    } else {
      this.logger.warn(
        `Webhook: Checkout session ${session.id} completed but payment status is ${session.payment_status}`,
      );
    }
  }

  // --- Method ย่อย จัดการ Webhook กรณีล้มเหลว ---
  private async handleCheckoutSessionFailed(session: Stripe.Checkout.Session) {
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) {
      this.logger.error(
        `Webhook Error: Missing bookingId in metadata for failed session ${session.id}`,
      );
      return;
    }

    this.logger.warn(`Webhook: Payment failed for booking ${bookingId}.`);
    try {
      // *** อัปเดตสถานะ Booking ใน DB เป็น FAILED โดยใช้ Prisma ***
      const updatedBooking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.FAILED, // ใช้ Enum
          stripeCheckoutSessionId: session.id, // อาจจะเก็บ session id ไว้ด้วย
        },
      });
      this.logger.log(
        `Updated booking ${updatedBooking.id} status to FAILED`,
      );
      // *** TODO: ส่ง Email แจ้งล้มเหลว ***
      console.log(`TODO: Send payment failed email for booking ${bookingId}`);
    } catch (error) {
      if (error.code === 'P2025') {
        this.logger.error(
          `Webhook Error: Booking ${bookingId} not found for update to failed status.`,
        );
      } else {
        this.logger.error(
          `Webhook Error: Failed to update booking ${bookingId} to failed: ${error.message}`,
          error.stack,
        );
      }
    }
  }
}