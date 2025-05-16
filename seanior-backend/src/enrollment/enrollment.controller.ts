// src/enrollment/enrollment.controller.ts
import {
  Controller,
  Get,
  Req,
  UseGuards,
  Logger,
  UnauthorizedException,
  ForbiddenException, // ถ้าจะใช้
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard'; // ตรวจสอบ Path
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Enrollments') // ตั้งชื่อ Tag ใน Swagger
@ApiBearerAuth()       // บอกว่า Endpoint ในนี้ส่วนใหญ่ต้องใช้ Bearer Token
@UseGuards(FirebaseAuthGuard) // ใช้ Guard กับ Controller นี้เลย
@Controller('enrollments')  // Path หลักคือ /enrollments
export class EnrollmentController {
  private readonly logger = new Logger(EnrollmentController.name);

  constructor(private readonly enrollmentService: EnrollmentService) {}

  // --- ADD THIS NEW ENDPOINT ---
  @Get('my') // GET /enrollments/my
  @ApiOperation({ summary: "Get all enrollments for the logged-in student" })
  async getMyEnrollments(@Req() req: any) {
    const studentId = req.user?.user_id; // ID ของ Student ที่ Login อยู่

    if (!studentId) {
      // Guard ควรจะดักไปแล้ว แต่เช็คอีกรอบก็ดี
      this.logger.warn('Attempt to get student enrollments without studentId');
      throw new UnauthorizedException('User not authenticated or user ID missing.');
    }

    // โดยทั่วไป User ทุกคนที่ Login แล้ว (และมี user_id) ควรจะดู Enrollment ของตัวเองได้
    // ไม่จำเป็นต้องเช็ค Role 'student' ซ้ำ นอกจากว่าคุณจะมี Logic ที่ซับซ้อนกว่านั้น
    // if (req.user?.user_type !== 'student' && req.user?.user_type !== 'user') {
    //   throw new ForbiddenException('Only students can view their enrollments.');
    // }

    this.logger.log(`Student ${studentId} fetching their enrollments.`);
    return this.enrollmentService.getEnrollmentsByStudent(studentId);
  }
  // --- END ADD THIS NEW ENDPOINT ---

  // --- ADD THIS NEW ENDPOINT FOR INSTRUCTORS ---
  @Get('instructor') // GET /enrollments/instructor
  @ApiOperation({ summary: "Get all enrollments for courses taught by the logged-in instructor" })
  async getInstructorEnrollments(@Req() req: any) {
    const instructorId = req.user?.user_id; // ID ของ Instructor ที่ Login อยู่
    const userType = req.user?.user_type;   // ประเภท User จาก Token

    if (!instructorId) {
      this.logger.warn('Attempt to get instructor enrollments without instructorId');
      throw new UnauthorizedException('User not authenticated or user ID missing.');
    }

    // ตรวจสอบ Role ว่าเป็น Instructor (หรือ Admin ก็อาจจะดูได้)
    if (userType !== 'instructor' && userType !== 'admin') {
      this.logger.warn(`User ${instructorId} with type ${userType} attempted to access instructor enrollments resource.`);
      throw new ForbiddenException('Only instructors or admins can access this resource.');
    }

    this.logger.log(`Instructor/Admin ${instructorId} fetching enrollments for their courses.`);
    // ถ้าเป็น Admin และอยากให้เห็นทั้งหมด อาจจะต้องมี Logic แยก หรือ Service method แยก
    // แต่สำหรับ Endpoint นี้ จะให้ Admin เห็นเหมือน Instructor คือเห็นเฉพาะคอร์สที่ตัวเองถูก Assign เป็น Instructor (ถ้ามี)
    // หรือถ้าต้องการให้ Admin เห็นทั้งหมดจริงๆ จาก Endpoint นี้เลย ก็ต้องปรับ Service method ให้รับ userType แล้วไม่ Filter instructorId
    return this.enrollmentService.getEnrollmentsForInstructorCourses(instructorId);
  }
  // --- END ADD THIS NEW ENDPOINT ---

  // อาจจะมี Endpoint อื่นๆ สำหรับ Enrollment ในอนาคต
  // เช่น GET /enrollments/:id (Admin ดู Enrollment συγκεκρι)
}