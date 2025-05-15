// src/course-request/course-request.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  Req, 
  UseGuards, 
  Logger, 
  Get, 
  UnauthorizedException,
  Put,
  Param,
  ForbiddenException, } from '@nestjs/common';
import { CourseRequestService } from './course-request.service';
import { CreateCourseRequestDto } from '../schemas/course-request';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard'; // <<<--- Import Guard ของคุณ
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam 
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

  @Put(':requestId/approve') // PUT /course-requests/{requestId}/approve
  @ApiOperation({ summary: 'Approve a pending course request (instructor/admin)' })
  @ApiParam({ name: 'requestId', description: 'The ID of the request to approve', type: String })
  async approveCourseRequest(
    @Param('requestId') requestId: string,
    @Req() req: any,
  ) {
    const actingUserId = req.user?.user_id;
    const actingUserType = req.user?.user_type;

    if (!actingUserId) {
      throw new UnauthorizedException('User not authenticated or user ID missing.');
    }

    // การตรวจสอบ Role เบื้องต้น (Service จะตรวจสอบสิทธิ์ความเป็นเจ้าของคอร์สอีกที)
    if (actingUserType !== 'instructor' && actingUserType !== 'admin') {
      throw new ForbiddenException('Only instructors or admins can approve requests.');
    }

    this.logger.log(`User ${actingUserId} (Type: ${actingUserType}) attempting to approve request ID: ${requestId}`);
    return this.courseRequestService.approveRequest(requestId, actingUserId, actingUserType);
  }

  @Put(':requestId/reject') // PUT /course-requests/{requestId}/reject
  @ApiOperation({ summary: 'Reject a pending course request (instructor/admin)' })
  @ApiParam({ name: 'requestId', description: 'The ID of the request to reject', type: String })
  // @ApiBody({ type: RejectCourseRequestDto, required: false }) // <--- ถ้าคุณสร้าง DTO นี้
  async rejectCourseRequest(
    @Param('requestId') requestId: string,
    @Req() req: any,
    // @Body() rejectDto: RejectCourseRequestDto, // <--- ถ้าคุณสร้าง DTO นี้
  ) {
    const actingUserId = req.user?.user_id;
    const actingUserType = req.user?.user_type;
    // const rejectionReason = rejectDto?.rejectionReason; // <--- ถ้าคุณสร้าง DTO นี้

    if (!actingUserId) {
      throw new UnauthorizedException('User not authenticated or user ID missing.');
    }

    if (actingUserType !== 'instructor' && actingUserType !== 'admin') {
      throw new ForbiddenException('Only instructors or admins can reject requests.');
    }

    this.logger.log(`User ${actingUserId} (Type: ${actingUserType}) attempting to reject request ID: ${requestId}`);
    return this.courseRequestService.rejectRequest(
        requestId,
        actingUserId,
        actingUserType
        // rejectionReason // <--- ถ้าคุณสร้าง DTO นี้
        );
  }

  @Get('my-requests') // GET /course-requests/my-requests
  @ApiOperation({ summary: 'Get all course requests for the logged-in student' })
  async getMyRequests(@Req() req: any) {
    const studentId = req.user?.user_id; // ID ของ Student ที่ Login อยู่

    if (!studentId) {
      this.logger.warn('Attempt to get student requests without studentId');
      throw new UnauthorizedException('User not authenticated or user ID missing.');
    }

    // โดยทั่วไป Endpoint นี้สำหรับ "นักเรียน" ทุกคนที่ Login แล้ว ไม่จำเป็นต้องเช็ค Role เพิ่มเติม
    // นอกจากว่าคุณจะมี User Type อื่นๆ ที่ไม่ใช่ Student และไม่ควรเห็นหน้านี้
    // if (req.user?.user_type !== 'student' && req.user?.user_type !== 'user') {
    //   throw new ForbiddenException('Only students can view their requests.');
    // }

    this.logger.log(`Student ${studentId} fetching their course requests.`);
    return this.courseRequestService.getRequestsByStudent(studentId);
  }
}