// src/course-request/course-request.controller.ts
import { Controller, Post, Body, Req, UseGuards, Logger, Get, UnauthorizedException } from '@nestjs/common';
import { CourseRequestService } from './course-request.service';
import { CreateCourseRequestDto } from '../schemas/course-request';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard'; // <<<--- Import Guard ของคุณ
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'; // <<<--- Import Swagger Decorators


@ApiTags('course-requests')
@Controller('course-requests') // Endpoint หลักจะเป็น /course-requests
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard) // <<<--- บังคับให้ต้อง Login ก่อนส่งคำขอ
export class CourseRequestController {
  private readonly logger = new Logger(CourseRequestController.name);

  constructor(private readonly courseRequestService: CourseRequestService) {}

  @Post() // POST /course-requests
  @ApiOperation({ summary: 'Request course from user to instructor' })
  async createCourseRequest(
    @Body() createDto: CreateCourseRequestDto,
    @Req() req: any, // เพื่อดึง userId จาก Firebase token ที่ Guard ตรวจสอบแล้ว
  ) {
    const studentId = req.user?.user_id; // หรือ path ที่ถูกต้องไปยัง user_id ใน req.user ของคุณ
    if (!studentId) {
      // ควรจะถูกดักโดย Guard ไปแล้ว แต่เช็คอีกรอบก็ดี
      this.logger.warn('Attempt to create request without studentId (Guard should have caught this)');
      // อาจจะ throw UnauthorizedException หรือ BadRequestException
      throw new Error('User not authenticated or user ID missing.');
    }

    this.logger.log(`Student ${studentId} creating request for course ${createDto.courseId}`);
    return this.courseRequestService.createRequest(createDto, studentId);
  }

  // ใน CourseRequestController
// ... (imports อื่นๆ, @Controller, constructor, createCourseRequest method) ...

// --- ADD THIS NEW ENDPOINT ---
@Get('instructor/pending-request') // GET /course-requests/instructor/pending
@ApiOperation({ summary: 'Get pending course requests (for instructor or admin)' })
  async getPendingRequests(@Req() req: any) { // เปลี่ยนชื่อ method ให้ทั่วไปขึ้น
    const userId = req.user?.user_id; // ID ของ User ที่ Login อยู่
    const userType = req.user?.user_type;   // ประเภท User จาก Token

    if (!userId) {
      this.logger.warn('Attempt to get pending requests without userId');
      throw new UnauthorizedException('User not authenticated or user ID missing.');
    }

    this.logger.log(`User ${userId} (Type: ${userType}) fetching pending requests.`);

    if (userType === 'admin') {
      // ถ้าเป็น Admin ให้เรียก Service ที่ดึงข้อมูลทั้งหมด
      return this.courseRequestService.getAllPendingRequestsForAdmin();
    } else if (userType === 'instructor') {
      // ถ้าเป็น Instructor ให้เรียก Service ที่ดึงข้อมูลเฉพาะของ Instructor
      return this.courseRequestService.getPendingRequestsForInstructor(userId);
    } else {
      // ถ้าเป็น User ประเภทอื่น (เช่น student) ไม่มีสิทธิ์เข้าถึง Endpoint นี้
      this.logger.warn(`User ${userId} with type ${userType} attempted to access restricted resource.`);
      throw new UnauthorizedException('Only instructors or admins can access this resource.');
    }
  }
}