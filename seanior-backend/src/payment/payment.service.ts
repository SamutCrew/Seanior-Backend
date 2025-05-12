// src/payment/payment.service.ts
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  NotFoundException, // เพิ่ม NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service'; // <--- เพิ่ม Import PrismaService
import { BookingStatus } from '@prisma/client'; // <--- เพิ่ม Import BookingStatus จาก Prisma

// Mock Course Data (ควรย้าย หรือ ดึงจาก DB จริงผ่าน Prisma)
// เราจะยังใช้ mock นี้ไปก่อน แต่ในอนาคตควรเปลี่ยนไปดึงจาก DB จริง
const mockCourses = {
  'COURSE_001': { name: 'คอร์สว่ายน้ำพื้นฐาน', price: 50000 }, // 500.00 THB
  'COURSE_002': { name: 'คอร์สว่ายน้ำขั้นสูง', price: 80000 }, // 800.00 THB
};

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private webhookSecret: string; // <--- เพิ่มสำหรับเก็บ Webhook Secret
  private successUrl: string;    // <--- เพิ่มสำหรับเก็บ Success URL
  private cancelUrl: string;     // <--- เพิ่มสำหรับเก็บ Cancel URL
  private readonly logger = new Logger(PaymentService.name); // <--- เพิ่ม Logger

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService, // <--- Inject PrismaService ที่นี่
  ) {
    // --- อ่านค่า Config ทั้งหมด ---
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const webhookSecretValue = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    const successUrlValue = this.configService.get<string>('SUCCESS_URL');
    const cancelUrlValue = this.configService.get<string>('CANCEL_URL');

    // --- ตรวจสอบว่าได้ค่า Config ครบ ---
    if (!secretKey || !webhookSecretValue || !successUrlValue || !cancelUrlValue) {
      this.logger.error('Missing Stripe configuration in environment variables!');
      throw new Error('Missing Stripe configuration in environment variables');
    }

    this.webhookSecret = webhookSecretValue;
    this.successUrl = successUrlValue;
    this.cancelUrl = cancelUrlValue;

    this.stripe = new Stripe(secretKey);

    this.logger.log('Stripe Service Initialized');
  }

  // --- Method สร้าง Checkout Session (แก้ไขใหม่ทั้งหมด) ---
  async createCourseCheckoutSession(courseId: string, userId?: string) {
    // 1. ดึงข้อมูลคอร์ส (ควรดึงจาก DB จริงๆ แทน mock)
    const course = await this.prisma.swimming_course.findUnique({ where: { course_id: courseId } });
    if (!course) {
      throw new BadRequestException(`Course with ID ${courseId} not found.`);
    }

    let booking;
    try {
      // 2. สร้าง Booking record ใน Database ก่อน (สถานะ PENDING_PAYMENT)
      booking = await this.prisma.booking.create({
        data: {
          courseId: courseId,
          userId: userId, // ใส่ userId ถ้ามี
          amount: course.price,
          currency: 'thb',
          status: BookingStatus.PENDING_PAYMENT, // ใช้ Enum ที่ Import มา
        },
      });
      this.logger.log(`Created booking ${booking.id} for course ${courseId}`);
    } catch (error) {
      this.logger.error(
        `Failed to create booking record for course ${courseId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not initiate booking process.');
    }

    try {
      // 3. สร้าง Stripe Checkout Session โดยใส่ booking.id ใน metadata
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['promptpay', 'card'], // เพิ่ม 'card' ด้วยก็ได้
        line_items: [
          {
            price_data: {
              currency: 'thb',
              product_data: {
                name: course.course_name,
              },
              unit_amount: course.price,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        // --- ใช้ URL จาก Config ---
        success_url: `${this.successUrl}?booking_id=${booking.id}`,
        cancel_url: this.cancelUrl,
        metadata: {
          bookingId: booking.id, // *** ใส่ booking.id ที่ได้จาก Prisma ***
        },
      });

      this.logger.log(
        `Created Stripe session ${session.id} for booking ${booking.id}`,
      );

      // 4. (Optional but Recommended) Update Booking ด้วย Stripe Session ID
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { stripeCheckoutSessionId: session.id },
      });

      return { url: session.url, sessionId: session.id, bookingId: booking.id };
    } catch (error) {
      this.logger.error(
        `Failed to create Stripe checkout session for booking ${booking.id}: ${error.message}`,
        error.stack,
      );
      // ถ้าสร้าง Stripe Session ล้มเหลว อาจจะ Rollback หรือเปลี่ยนสถานะ Booking เป็น FAILED
      try {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.FAILED },
        });
      } catch (updateError) {
        this.logger.error(
          `Failed to update booking ${booking.id} status to FAILED after Stripe error: ${updateError.message}`,
        );
      }
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
    if (!bookingId) {
      this.logger.error(
        `Webhook Error: Missing bookingId in metadata for session ${session.id}`,
      );
      return; // ออกจากการทำงานถ้าไม่มี bookingId
    }

    // ตรวจสอบสถานะการชำระเงินจาก Stripe อีกครั้ง
    if (session.payment_status === 'paid') {
      this.logger.log(`Webhook: Payment successful for booking ${bookingId}`);
      try {
        // *** อัปเดตสถานะ Booking ใน DB เป็น CONFIRMED โดยใช้ Prisma ***
        const updatedBooking = await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.CONFIRMED, // ใช้ Enum
            stripeCheckoutSessionId: session.id, // อัปเดต session id ด้วยเผื่อๆ
          },
        });
        this.logger.log(
          `Updated booking ${updatedBooking.id} status to CONFIRMED`,
        );
        // *** TODO: ส่ง Email ยืนยัน ***
        console.log(`TODO: Send confirmation email for booking ${bookingId}`);
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