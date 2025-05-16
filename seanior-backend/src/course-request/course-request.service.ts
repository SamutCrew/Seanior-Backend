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
import { CreateCourseRequestDto, SelectedSlotDto  } from '../schemas/course-request'; // <<<--- สมมติว่า DTO อยู่ในโฟลเดอร์ dto
import { RequestStatus, Prisma } from '@prisma/client';

// Interface เพื่อช่วย TypeScript เข้าใจโครงสร้าง schedule จาก DB
interface CourseScheduleRange {
  start: string;
  end: string;
}
interface CourseDayScheduleData {
  selected: boolean;
  ranges: Array<CourseScheduleRange>;
}
interface CourseScheduleFromDB {
  [day: string]: CourseDayScheduleData; // เช่น "monday", "tuesday"
}


@Injectable()
export class CourseRequestService {
  private readonly logger = new Logger(CourseRequestService.name);

  constructor(private prisma: PrismaService) {}

  private parsePossiblyEscapedJson(jsonStringOrObject: any): CourseScheduleFromDB | null {
    if (typeof jsonStringOrObject === 'object' && jsonStringOrObject !== null) {
      // ถ้ามันเป็น Object อยู่แล้ว ก็คืนค่าไปเลย (อาจจะต้อง Validate โครงสร้างเพิ่มเติมถ้าต้องการ)
      return jsonStringOrObject as CourseScheduleFromDB;
    }
    if (typeof jsonStringOrObject === 'string') {
      try {
        // ลอง Parse ครั้งแรก
        let parsed = JSON.parse(jsonStringOrObject);
        // ถ้าผลลัพธ์จากการ Parse ครั้งแรกยังเป็น String อยู่ (แสดงว่ามันอาจจะถูก Stringify ซ้ำ)
        // ให้ลอง Parse อีกครั้ง
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        // ณ จุดนี้ parsed ควรจะเป็น Object แล้ว
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed as CourseScheduleFromDB;
        }
        return null; // ไม่สามารถ Parse เป็น Object ได้
      } catch (e) {
        this.logger.error(`Failed to parse schedule JSON string: ${jsonStringOrObject}`, e);
        return null; // Parse ไม่สำเร็จ
      }
    }
    return null; // ไม่ใช่ Object หรือ String
  }

  async createRequest(createDto: CreateCourseRequestDto, studentId: string) {
    const { courseId, startDateForFirstWeek, selectedSlots, notes } = createDto;

    // 1. ตรวจสอบ Course และ Schedule ของ Course
    const course = await this.prisma.swimming_course.findUnique({
      where: { course_id: courseId },
    });

    if (!course) {
      this.logger.warn(`Course with ID ${courseId} not found for creating request.`);
      throw new NotFoundException(`Course with ID ${courseId} not found.`);
    }

    // ---> MODIFY: ใช้ฟังก์ชัน Helper ในการ Parse และทำความสะอาด course.schedule <---
    const cleanedSchedule = this.parsePossiblyEscapedJson(course.schedule);

    if (!cleanedSchedule || Object.keys(cleanedSchedule).length === 0) {
      this.logger.error(
        `Course ${courseId} has invalid or missing schedule data after parsing. Original data: ${JSON.stringify(course.schedule)}`,
      );
      throw new BadRequestException(
        `Course ${courseId} does not have a valid schedule configured.`,
      );
    }
    const courseSchedule = cleanedSchedule as CourseScheduleFromDB; // ตอนนี้ courseSchedule ควรจะเป็น Object ที่ถูกต้อง
    // --- END MODIFY ---

    // if (!course.schedule || typeof course.schedule !== 'object' || Array.isArray(course.schedule)) { // <<<--- เพิ่ม Array.isArray(course.schedule)
    //   this.logger.error(
    //     `Course ${courseId} has invalid or missing schedule data (not a JSON object). Data: ${JSON.stringify(course.schedule)}`,
    //   );
    //   throw new BadRequestException(
    //     `Course ${courseId} does not have a valid schedule configured.`,
    //   );
    // }
    // // หลังจากเช็คแล้วว่ามันเป็น Object และไม่ใช่ Array เราถึงจะ Cast
    // const courseSchedule = course.schedule as unknown as CourseScheduleFromDB;

    // 2. Validate startDateForFirstWeek
    const firstWeekStartDateObj = new Date(startDateForFirstWeek);
    if (isNaN(firstWeekStartDateObj.getTime())) {
        throw new BadRequestException('Invalid startDateForFirstWeek format. Please use YYYY-MM-DD.');
    }
    // ตัวอย่าง Validation เพิ่มเติม: วันที่ต้องไม่ใช่วันในอดีต
    const today = new Date();
    today.setHours(0, 0, 0, 0); // เซ็ตเวลาเป็นเที่ยงคืนเพื่อเปรียบเทียบเฉพาะวัน
    if (firstWeekStartDateObj < today) {
        throw new BadRequestException('startDateForFirstWeek cannot be in the past.');
    }
    // คุณอาจจะอยาก Validate ว่า startDateForFirstWeek เป็นวันจันทร์ (ถ้าสัปดาห์การเรียนเริ่มวันจันทร์)
    // if (firstWeekStartDateObj.getDay() !== 1) { // 0 = Sunday, 1 = Monday
    //   throw new BadRequestException('startDateForFirstWeek must be a Monday to align with the week.');
    // }


    // 3. Validate selectedSlots ที่นักเรียนเลือกมา กับ course.schedule
    if (!selectedSlots || selectedSlots.length === 0) {
        throw new BadRequestException('At least one schedule slot must be selected.');
    }

    for (const slot of selectedSlots) {
      const dayKey = slot.dayOfWeek.toLowerCase(); // เพื่อความแน่นอนในการเทียบ Key
      const dayScheduleData = courseSchedule[dayKey];

      if (!dayScheduleData || !dayScheduleData.selected) {
        throw new BadRequestException(`Course is not available or not selected on ${slot.dayOfWeek}.`);
      }

      // ตรวจสอบว่า startTime และ endTime ที่ส่งมา ตรงกับ range ที่มีใน schedule ของวันนั้น
      const isValidSlot = dayScheduleData.ranges.some(
        (range) => range.start === slot.startTime && range.end === slot.endTime
      );

      if (!isValidSlot) {
        this.logger.warn(`Invalid slot selected: Day: ${slot.dayOfWeek}, Time: ${slot.startTime}-${slot.endTime}. Available ranges for ${dayKey}: ${JSON.stringify(dayScheduleData.ranges)}`);
        throw new BadRequestException(
          `Time slot ${slot.startTime}-${slot.endTime} on ${slot.dayOfWeek} is not available for this course. Please check the course schedule.`,
        );
      }
    }

    // (Optional) 4. ตรวจสอบคำขอซ้ำซ้อน (อาจจะยังใช้ Logic เดิมไปก่อน)
    const existingRequest = await this.prisma.request.findFirst({
      where: {
        student_id: studentId,
        course_id: courseId,
        status: {
          in: [RequestStatus.PENDING_APPROVAL, RequestStatus.APPROVED_PENDING_PAYMENT],
        },
      },
    });

    if (existingRequest) {
      this.logger.warn(`Student ${studentId} already has an active/pending request for course ${courseId}`);
      throw new ConflictException('You already have an active or pending request for this course.');
    }

    // 5. คำนวณราคารวม (ถ้าจำเป็น - ขึ้นอยู่กับ Business Logic ของคุณ)
    // สำหรับตอนนี้ เรายังใช้ราคาจากคอร์สหลักไปก่อน
    const requestPrice = course.price;

    // 6. สร้าง Record ใหม่ในตาราง request และ RequestedSlot (ใน Transaction เดียวกัน)
    try {
      const newRequest = await this.prisma.request.create({
        data: {
          course_id: courseId,
          student_id: studentId,
          status: RequestStatus.PENDING_APPROVAL,
          request_price: requestPrice,
          request_location: course.location, // หรือจาก DTO ถ้าต้องการ
          request_date: new Date(), // วันที่ส่งคำขอ
          start_date_for_first_week: firstWeekStartDateObj, // วันที่อ้างอิงสัปดาห์แรก
          notes: notes, // จาก DTO
          requestedSlots: { // สร้าง Record ใน RequestedSlot ไปพร้อมกัน
            create: selectedSlots.map(slot => ({
              dayOfWeek: slot.dayOfWeek.toLowerCase(),
              startTime: slot.startTime,
              endTime: slot.endTime,
              // คุณอาจจะอยากคำนวณ 'calculated_first_session_datetime' ที่นี่
              // โดยอิงจาก firstWeekStartDateObj และ slot.dayOfWeek
              // เช่น: calculateActualDateTimeForSlot(firstWeekStartDateObj, slot.dayOfWeek, slot.startTime)
            })),
          },
        },
        include: { // ดึงข้อมูลที่สร้างแล้วกลับมาด้วย เพื่อให้ Response Body สมบูรณ์
          requestedSlots: true,
          Course: { select: { course_name: true, instructor_id: true } },
          student: { select: { user_id: true, name: true, email: true } },
        }
      });

      this.logger.log(`Created new request ${newRequest.request_id} by student ${studentId} for course ${courseId} with ${selectedSlots.length} slots.`);

      // *** ขั้นตอนต่อไป (Future): ส่ง Notification ไปหา Instructor ***
      // const instructorId = newRequest.Course?.instructor_id;
      // if (instructorId) {
      //   // this.notificationService.notifyInstructorNewRequest(instructorId, newRequest.request_id);
      // }

      return newRequest;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(`Prisma error creating request: ${error.code} - ${error.message}`, error.stack);
        if (error.code === 'P2002') { // Unique constraint failed
            throw new ConflictException('There was a conflict creating the request, possibly due to duplicate slot selection within the same request or other unique constraints.');
        }
      } else {
        this.logger.error(`Generic error creating request: ${error.message}`, error.stack);
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
          requestedSlots: true,
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
          requestedSlots: true,
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