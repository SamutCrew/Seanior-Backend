// src/enrollment/enrollment.service.ts
import {
  Injectable,
  Logger,
  NotFoundException, // ถ้าต้องการใช้
  ForbiddenException, // ถ้าต้องการใช้
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { EnrollmentStatus, Prisma } from '@prisma/client'; // Import ถ้ามีการใช้

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(private prisma: PrismaService) {}

  // ... (method createEnrollmentFromRequest และ method อื่นๆ ที่อาจจะมี) ...


  // --- ADD THIS NEW METHOD ---
  async getEnrollmentsByStudent(studentId: string) {
    this.logger.log(`Workspaceing enrollments for student ID: ${studentId}`);
    try {
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          request: { // <<<--- Query ผ่าน Relation ไปยัง Request
            student_id: studentId, // เพื่อหา Enrollment ที่ Request นั้นเป็นของ Student คนนี้
          },
        },
        include: {
          request: { // ดึงข้อมูล Request ที่เกี่ยวข้องมาด้วย
            include: {
              Course: { // ดึงข้อมูล Course จาก Request
                select: {
                  course_id: true,
                  course_name: true,
                  course_image: true,
                  instructor: { // ดึงข้อมูล Instructor ของ Course
                    select: {
                      user_id: true,
                      name: true,
                    },
                  },
                },
              },
              requestedSlots: true, // ดึงข้อมูล Slot ที่นักเรียนเคยเลือกไว้ใน Request
            },
          },
          // (Optional) ถ้าต้องการข้อมูล Review, Attendance, Payment, SessionProgress ของแต่ละ Enrollment ด้วย ก็ Include มาได้เลย
          // review: true,
          // attendance: { orderBy: { session_number: 'asc' } },
          // payment: { orderBy: { payment_date: 'asc' } },
          // session_progress: { orderBy: { session_number: 'asc' } },
        },
        orderBy: [
          { status: 'asc' }, // อาจจะเรียงตามสถานะ (เช่น ACTIVE ขึ้นก่อน)
          { start_date: 'desc' }, // แล้วค่อยเรียงตามวันเริ่มล่าสุด
        ],
      });
      return enrollments;
    } catch (error) {
      this.logger.error(
        `Failed to fetch enrollments for student ${studentId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not fetch your enrollments.',
      );
    }
  }
  // --- END ADD THIS NEW METHOD ---

  // --- ADD THIS NEW METHOD FOR INSTRUCTORS ---
  async getEnrollmentsForInstructorCourses(instructorId: string) {
    this.logger.log(`Workspaceing enrollments for courses taught by instructor ID: ${instructorId}`);
    try {
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          request: { // Query ผ่าน Relation ไปยัง Request
            Course: { // Query ผ่าน Relation จาก Request ไปยัง Course
              instructor_id: instructorId, // เพื่อหา Enrollment ที่ Course นั้นถูกสอนโดย Instructor คนนี้
            },
          },
          // คุณอาจจะอยากกรองสถานะ Enrollment เพิ่มเติม เช่น เอาเฉพาะที่ ACTIVE หรือ COMPLETED
          // status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] }
        },
        include: {
          request: {
            include: {
              Course: { // ดึงข้อมูล Course
                select: {
                  course_id: true,
                  course_name: true,
                },
              },
              student: { // ดึงข้อมูล Student ของ Enrollment นี้
                select: {
                  user_id: true,
                  name: true,
                  email: true,
                  profile_img: true,
                },
              },
              requestedSlots: true, // (Optional) ถ้า Instructor อยากเห็น Slot ที่นักเรียนคนนี้เลือกไว้
            },
          },
          // (Optional) ถ้าต้องการข้อมูล Review, Attendance, Payment, SessionProgress ของแต่ละ Enrollment ด้วย ก็ Include มาได้เลย
          // review: true,
          // attendance: { orderBy: { session_number: 'asc' } },
          // payment: { orderBy: { payment_date: 'asc' } },
          // session_progress: { orderBy: { session_number: 'asc' } },
        },
        orderBy: [
          // เรียงตามอะไรดี? อาจจะเรียงตาม Course ก่อน แล้วค่อยตาม Student หรือ วันที่เริ่มเรียน
          { request: { Course: { course_name: 'asc' } } },
          { start_date: 'desc' },
        ],
      });
      return enrollments;
    } catch (error) {
      this.logger.error(
        `Failed to fetch enrollments for instructor ${instructorId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not fetch enrollments for your courses.',
      );
    }
  }
}