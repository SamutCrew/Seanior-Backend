// src/course-request/course-request.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException, // <<<--- ตรวจสอบว่า Import มาแล้ว
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// ตรวจสอบ Path ของ DTO ให้ถูกต้อง อาจจะเป็น './dto/create-course-request.dto'
import { CreateCourseRequestDto } from '../schemas/course-request'; // <<<--- สมมติว่า DTO อยู่ในโฟลเดอร์ dto
import { RequestStatus, Prisma } from '@prisma/client';

@Injectable()
export class CourseRequestService {
  private readonly logger = new Logger(CourseRequestService.name);

  constructor(private prisma: PrismaService) {}

  async createRequest(createDto: CreateCourseRequestDto, studentId: string) {
    // ---> ADD: ดึงค่าใหม่จาก DTO (ตามที่เราออกแบบไว้ในคำตอบ #46) <---
    const { courseId, startDate, selectedSchedule } = createDto;

    // ---> ADD: Parse selectedSchedule เพื่อแยกวันและช่วงเวลา <---
    const scheduleParts = selectedSchedule.split(':');
    if (scheduleParts.length < 2 || !scheduleParts[0] || !scheduleParts[1]) {
      this.logger.warn(`Invalid selectedSchedule format: ${selectedSchedule}`);
      throw new BadRequestException(
        `Invalid selectedSchedule format. Expected "dayname:HH:MM-HH:MM".`,
      );
    }
    const parsedDayOfWeek = scheduleParts[0].toLowerCase(); // e.g., "wednesday"
    const parsedTimeSlotString = scheduleParts.slice(1).join(':'); // e.g., "19:00-20:00"

    // ---> ADD: ดึงเวลาเริ่มต้น (HH:MM) จาก parsedTimeSlotString <---
    const parsedStartTime = parsedTimeSlotString.split('-')[0];
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(parsedStartTime)) {
      this.logger.warn(
        `Invalid start time parsed from selectedSchedule: ${parsedStartTime}`,
      );
      throw new BadRequestException(
        `Invalid time format in selectedSchedule. Start time should be HH:MM.`,
      );
    }

    // 1. ตรวจสอบว่า Course ID ที่ส่งมา มีอยู่จริงหรือไม่
    const course = await this.prisma.swimming_course.findUnique({
      where: { course_id: courseId }, // ใช้ courseId จาก DTO
    });

    if (!course) {
      this.logger.warn(
        `Course with ID ${courseId} not found for creating request.`,
      );
      throw new NotFoundException(`Course with ID ${courseId} not found.`);
    }

    // ---> ADD: ตรวจสอบ Schedule ของคอร์ส และ Validate วันเวลาที่นักเรียนเลือก <---
    if (!course.schedule || typeof course.schedule !== 'object') {
      this.logger.error(
        `Course ${courseId} has invalid or missing schedule data.`,
      );
      throw new BadRequestException(
        `Course ${courseId} does not have a valid schedule.`,
      );
    }
    const courseSchedule = course.schedule as Record<string, string>;

    // 2. ตรวจสอบว่า parsedDayOfWeek ที่นักเรียนเลือก มีอยู่ใน Schedule ของคอร์สหรือไม่
    // และตรวจสอบว่า Time Slot ที่นักเรียนส่งมา (parsedTimeSlotString) ตรงกับที่กำหนดใน Schedule หรือไม่
    if (
      !courseSchedule[parsedDayOfWeek] ||
      courseSchedule[parsedDayOfWeek] !== parsedTimeSlotString
    ) {
      this.logger.warn(
        `Selected schedule slot "${parsedDayOfWeek} at ${parsedTimeSlotString}" is not available for course ${courseId}. Available: ${JSON.stringify(course.schedule)}`,
      );
      throw new BadRequestException(
        `The selected schedule slot "${selectedSchedule}" is not available for this course.`,
      );
    }

    // 3. ตรวจสอบว่า startDate ที่นักเรียนเลือก เป็นวันเดียวกับ parsedDayOfWeek จริงๆ
    const startDateObj = new Date(startDate);
    const dayOfStartDate = startDateObj
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
    if (dayOfStartDate !== parsedDayOfWeek) {
      this.logger.warn(
        `The selected start date ${startDate} (${dayOfStartDate}) does not fall on the selected day of week (${parsedDayOfWeek}).`,
      );
      throw new BadRequestException(
        `The selected start date (${startDate}) is a ${dayOfStartDate}, which does not match the selected day of the week (${parsedDayOfWeek}). Please choose a start date that is a ${parsedDayOfWeek}.`,
      );
    }

    // 4. สร้าง DateTime ที่สมบูรณ์สำหรับเซสชันแรก
    const [hours, minutes] = parsedStartTime.split(':').map(Number);
    const firstSessionDateTime = new Date(startDate);
    firstSessionDateTime.setHours(hours, minutes, 0, 0);
    // --- END ADDED/MODIFIED VALIDATION AND PREPARATION LOGIC ---

    // (Optional) 5. ตรวจสอบว่านักเรียนคนนี้เคยส่งคำขอสำหรับคอร์สนี้ที่ยังไม่ถูกจัดการหรือไม่ (เหมือนเดิม)
    const existingRequest = await this.prisma.request.findFirst({
      where: {
        student_id: studentId,
        course_id: courseId, // ใช้ courseId จาก DTO
        status: {
          in: [
            RequestStatus.PENDING_APPROVAL,
            RequestStatus.APPROVED_PENDING_PAYMENT,
          ],
        },
      },
    });

    if (existingRequest) {
      this.logger.warn(
        `Student ${studentId} already has an active request for course ${courseId}`,
      );
      throw new ConflictException(
        'You already have an active request for this course. Please wait for instructor approval or cancel the existing request.',
      );
    }

    // 6. สร้าง Record ใหม่ในตาราง request
    try {
      const newRequest = await this.prisma.request.create({
        data: {
          course_id: courseId, // ใช้ courseId จาก DTO
          student_id: studentId,
          status: RequestStatus.PENDING_APPROVAL,
          request_price: course.price,
          request_location: course.location,
          request_date: firstSessionDateTime, // วันที่และเวลาของเซสชันแรก
          requestDayOfWeek: parsedDayOfWeek, // วันในสัปดาห์ที่เลือก
          requestTimeSlot: parsedStartTime, // เวลาเริ่มที่เลือก (HH:MM)
        },
        include: {
          Course: {
            select: { course_name: true, instructor_id: true },
          },
          student: {
            select: { user_id: true, name: true, email: true },
          },
        },
      });

      this.logger.log(
        `Created new request ${newRequest.request_id} by student ${studentId} for course ${courseId}. Selected slot: ${parsedDayOfWeek} at ${parsedStartTime}, starting ${startDate}. First session: ${firstSessionDateTime.toISOString()}`,
      );

      // *** ขั้นตอนต่อไป (Future): ส่ง Notification ไปหา Instructor ***
      // const instructorId = newRequest.Course.instructor_id;
      // this.notificationService.notifyInstructorNewRequest(instructorId, newRequest.request_id);

      return newRequest;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(
          `Prisma error creating request: ${error.code} - ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Generic error creating request: ${error.message}`,
          error.stack,
        );
      }
      throw new InternalServerErrorException('Could not create course request.');
    }
  }

  // ใน CourseRequestService
  async getPendingRequestsForInstructor(instructorId: string) {
    this.logger.log(`Workspaceing pending requests for instructor ID: ${instructorId}`);
    try {
      const pendingRequests = await this.prisma.request.findMany({
        where: {
          status: RequestStatus.PENDING_APPROVAL, // ดึงเฉพาะคำขอที่รอการอนุมัติ
          Course: { // กรองจากคอร์สที่อาจารย์คนนี้เป็นผู้สอน (เช็คจาก model swimming_course)
            instructor_id: instructorId,
          },
        },
        include: { // ดึงข้อมูลที่เกี่ยวข้องมาแสดงด้วย
          Course: { // ข้อมูลคอร์สที่ถูกขอ
            select: {
              course_id: true,
              course_name: true,
            },
          },
          student: { // ข้อมูลนักเรียนที่ส่งคำขอ
            select: {
              user_id: true,
              name: true,
              email: true,
              profile_img: true,
            },
          },
        },
        orderBy: {
          created_at: 'asc', // เรียงตามวันที่สร้าง (เก่าไปใหม่)
        },
      });
      return pendingRequests;
    } catch (error) {
      this.logger.error(`Failed to fetch pending requests for instructor ${instructorId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Could not fetch pending requests.');
    }
  }

  async getAllPendingRequestsForAdmin() {
    this.logger.log(`Admin fetching all pending requests.`);
    try {
      const allPendingRequests = await this.prisma.request.findMany({
        where: {
          status: RequestStatus.PENDING_APPROVAL, // ดึงเฉพาะคำขอที่รอการอนุมัติ
          // *** ไม่มีการกรองด้วย instructor_id ที่นี่ เพราะ Admin เห็นทั้งหมด ***
        },
        include: {
          Course: {
            select: {
              course_id: true,
              course_name: true,
              instructor: { // เพิ่มข้อมูล instructor ของคอร์ส
                select: {
                  user_id: true,
                  name: true,
                }
              }
            },
          },
          student: {
            select: {
              user_id: true,
              name: true,
              email: true,
              profile_img: true,
            },
          },
        },
        orderBy: {
          created_at: 'asc',
        },
      });
      return allPendingRequests;
    } catch (error) {
      this.logger.error(`Failed to fetch all pending requests for admin: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Could not fetch all pending requests.');
    }
  }

  async approveRequest(requestId: string, actingUserId: string, actingUserType: string) {
    this.logger.log(`User ${actingUserId} (Type: ${actingUserType}) attempting to approve request ID: ${requestId}`);

    // 1. ดึงข้อมูล Request พร้อมข้อมูล Course เพื่อเช็ค Instructor
    const requestToApprove = await this.prisma.request.findUnique({
      where: { request_id: requestId },
      include: {
        Course: { // ดึงข้อมูลคอร์สเพื่อเอา instructor_id
          select: { instructor_id: true, course_name: true },
        },
        student: { // ดึงข้อมูลนักเรียนเผื่อต้องใช้ (เช่น ส่ง notification)
            select: { user_id: true, email: true, name: true }
        }
      },
    });

    // 2. ตรวจสอบว่า Request มีอยู่จริงหรือไม่
    if (!requestToApprove) {
      this.logger.warn(`Approve failed: Request ID ${requestId} not found.`);
      throw new NotFoundException(`Request with ID ${requestId} not found.`);
    }

    // 3. ตรวจสอบว่าสถานะของ Request เป็น PENDING_APPROVAL หรือไม่
    if (requestToApprove.status !== RequestStatus.PENDING_APPROVAL) {
      this.logger.warn(`Approve failed: Request ID ${requestId} is not in PENDING_APPROVAL status. Current status: ${requestToApprove.status}`);
      throw new BadRequestException(`Request is not pending approval. Current status: ${requestToApprove.status}`);
    }

    // 4. ตรวจสอบสิทธิ์: User ที่กด Approve ต้องเป็น Instructor เจ้าของคอร์ส หรือเป็น Admin
    const courseInstructorId = requestToApprove.Course.instructor_id;
    if (actingUserType !== 'admin' && courseInstructorId !== actingUserId) {
      this.logger.warn(`Approve failed: User <span class="math-inline">\{actingUserId\} is not the course instructor \(</span>{courseInstructorId}) nor an admin.`);
      throw new ForbiddenException('You do not have permission to approve this request.');
    }

    // 5. อัปเดตสถานะ Request เป็น APPROVED_PENDING_PAYMENT
    try {
      const approvedRequest = await this.prisma.request.update({
        where: { request_id: requestId },
        data: {
          status: RequestStatus.APPROVED_PENDING_PAYMENT,
        },
      });
      this.logger.log(`Request ID ${requestId} approved by User ${actingUserId}. Status changed to APPROVED_PENDING_PAYMENT.`);

      // *** ขั้นตอนต่อไป (Future): ส่ง Notification ไปหานักเรียนว่าคำขอได้รับการอนุมัติแล้ว ***
      // this.notificationService.notifyStudentRequestApproved(requestToApprove.student.user_id, approvedRequest.request_id);

      return approvedRequest;
    } catch (error) {
      this.logger.error(`Failed to approve request ${requestId}: ${error.message}`, error.stack);
      // ตรวจสอบว่าเป็น Prisma error หรือไม่ (เช่น record not found ถ้ามีการลบ request ไปพร้อมๆกัน)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
         throw new NotFoundException(`Request with ID ${requestId} not found during update.`);
      }
      throw new InternalServerErrorException('Could not approve course request.');
    }
  }

  async rejectRequest(
    requestId: string,
    actingUserId: string,
    actingUserType: string,
    rejectionReason?: string, // Parameter นี้ Optional
  ) {
    this.logger.log(`User ${actingUserId} (Type: ${actingUserType}) attempting to reject request ID: ${requestId}`);

    // 1. ดึงข้อมูล Request พร้อมข้อมูล Course เพื่อเช็ค Instructor
    const requestToReject = await this.prisma.request.findUnique({
      where: { request_id: requestId },
      include: {
        Course: {
          select: { instructor_id: true, course_name: true },
        },
        student: {
            select: { user_id: true, email: true, name: true }
        }
      },
    });

    // 2. ตรวจสอบว่า Request มีอยู่จริงหรือไม่
    if (!requestToReject) {
      this.logger.warn(`Reject failed: Request ID ${requestId} not found.`);
      throw new NotFoundException(`Request with ID ${requestId} not found.`);
    }

    // 3. ตรวจสอบว่าสถานะของ Request เป็น PENDING_APPROVAL หรือไม่
    if (requestToReject.status !== RequestStatus.PENDING_APPROVAL) {
      this.logger.warn(`Reject failed: Request ID ${requestId} is not in PENDING_APPROVAL status. Current status: ${requestToReject.status}`);
      throw new BadRequestException(`Request is not pending approval. Current status: ${requestToReject.status}`);
    }

    // 4. ตรวจสอบสิทธิ์: User ที่กด Reject ต้องเป็น Instructor เจ้าของคอร์ส หรือเป็น Admin
    const courseInstructorId = requestToReject.Course.instructor_id;
    if (actingUserType !== 'admin' && courseInstructorId !== actingUserId) {
      this.logger.warn(`Reject failed: User <span class="math-inline">\{actingUserId\} is not the course instructor \(</span>{courseInstructorId}) nor an admin.`);
      throw new ForbiddenException('You do not have permission to reject this request.');
    }

    // 5. อัปเดตสถานะ Request เป็น REJECTED_BY_INSTRUCTOR
    try {
      const rejectedRequest = await this.prisma.request.update({
        where: { request_id: requestId },
        data: {
          status: RequestStatus.REJECTED_BY_INSTRUCTOR,
          // rejection_reason: rejectionReason, // <--- ถ้าคุณเพิ่ม Field นี้ใน Schema และรับมาจาก DTO
        },
      });
      this.logger.log(`Request ID ${requestId} rejected by User ${actingUserId}. Status changed to REJECTED_BY_INSTRUCTOR.`);

      // *** ขั้นตอนต่อไป (Future): ส่ง Notification ไปหานักเรียนว่าคำขอถูกปฏิเสธแล้ว ***
      // this.notificationService.notifyStudentRequestRejected(requestToReject.student.user_id, rejectedRequest.request_id, rejectionReason);

      return rejectedRequest;
    } catch (error) {
      this.logger.error(`Failed to reject request ${requestId}: ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
         throw new NotFoundException(`Request with ID ${requestId} not found during update.`);
      }
      throw new InternalServerErrorException('Could not reject course request.');
    }
  }

  async getRequestsByStudent(studentId: string) {
    this.logger.log(`Workspaceing requests for student ID: ${studentId}`);
    try {
      const studentRequests = await this.prisma.request.findMany({
        where: {
          student_id: studentId, // ดึงเฉพาะคำขอของนักเรียนคนนี้
        },
        include: {
          Course: { // ดึงข้อมูลคอร์สที่เกี่ยวข้อง
            select: {
              course_id: true,
              course_name: true,
              course_image: true, // เพิ่มรูปภาพคอร์ส (ถ้ามี)
              instructor: { // ดึงข้อมูลอาจารย์ผู้สอน
                select: {
                  user_id: true,
                  name: true,
                },
              },
            },
          },
          // ไม่จำเป็นต้อง include student อีก เพราะเรา query จาก student_id อยู่แล้ว
        },
        orderBy: {
          created_at: 'desc', // เรียงตามวันที่สร้างล่าสุดขึ้นก่อน
        },
      });
      return studentRequests;
    } catch (error) {
      this.logger.error(`Failed to fetch requests for student ${studentId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Could not fetch your course requests.');
    }
  }
}