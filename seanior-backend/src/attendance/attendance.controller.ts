// src/attendance/attendance.controller.ts
import { Controller, Post, Get, Put, Param, Body, Req, UseGuards, ParseIntPipe, Logger, ForbiddenException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, RequestExcuseDto } from '../schemas/attendance';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('Attendances')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller() // เราจะใช้ Path จาก method decorators
export class AttendanceController {
    private readonly logger = new Logger(AttendanceController.name);

    constructor(private readonly attendanceService: AttendanceService) {}

    @Post('enrollments/:enrollmentId/attendances')
    @ApiOperation({ summary: 'Record attendance for an enrollment session (Instructor only)' })
    @ApiParam({ name: 'enrollmentId', type: String, description: 'ID of the enrollment' })
    async recordAttendance(
        @Param('enrollmentId') enrollmentId: string,
        @Body() createAttendanceDto: CreateAttendanceDto,
        @Req() req: any,
    ) {
        const instructorId = req.user?.user_id;
        // เพิ่มการตรวจสอบ Role ว่าเป็น Instructor หรือ Admin ใน Service หรือที่นี่
        this.logger.log(`Instructor ${instructorId} attempting to record attendance for enrollment ${enrollmentId}`);
        return this.attendanceService.recordAttendance(enrollmentId, createAttendanceDto, instructorId);
    }

    @Get('enrollments/:enrollmentId/attendances')
    @ApiOperation({ summary: 'Get attendance history for an enrollment (Student owner, Instructor, or Admin)' })
    @ApiParam({ name: 'enrollmentId', type: String, description: 'ID of the enrollment' })
    async getAttendancesForEnrollment(
        @Param('enrollmentId') enrollmentId: string,
        @Req() req: any,
    ) {
        const accessorUserId = req.user?.user_id;
        const accessorUserType = req.user?.user_type;
        this.logger.log(`User ${accessorUserId} (Type: ${accessorUserType}) attempting to get attendance for enrollment ${enrollmentId}`);
        return this.attendanceService.getAttendancesForEnrollment(enrollmentId, accessorUserId, accessorUserType);
    }

    // อาจจะมี Endpoint สำหรับ PUT /attendances/:attendanceId ถ้าต้องการให้แก้ไขได้

    // --- ADD THIS NEW ENDPOINT FOR STUDENTS TO REQUEST EXCUSE ---
    @Post('enrollments/:enrollmentId/sessions/:sessionNumber/request-excuse')
    @ApiOperation({ summary: 'Student requests an excused absence for a specific session' })
    @ApiParam({ name: 'enrollmentId', type: 'string', description: 'ID of the student\'s enrollment' })
    @ApiParam({ name: 'sessionNumber', type: 'number', description: 'The session number to request leave for' })
    async studentRequestExcuse(
        @Param('enrollmentId') enrollmentId: string,
        @Param('sessionNumber', ParseIntPipe) sessionNumber: number, // <<<--- รับ sessionNumber จาก Path และแปลงเป็น Int
        @Body() requestExcuseDto: RequestExcuseDto, // <<<--- ใช้ DTO ใหม่
        @Req() req: any,
    ) {
        const studentId = req.user?.user_id;
        const userType = req.user?.user_type;

        if (!studentId) {
            throw new ForbiddenException('Authentication required.');
        }
        // อาจจะมีการตรวจสอบเพิ่มเติมว่า userType เป็น 'student' หรือ 'user'
        if (userType !== 'student' && userType !== 'user' && userType !== 'instructor' && userType !== 'admin') { // อนุญาตให้ User ทุกประเภทที่ Login แล้วแจ้งลาให้ตัวเองได้ (ถ้า Enrollment เป็นของเขา)
             this.logger.warn(`User ${studentId} with type ${userType} attempted to request excuse.`);
             // throw new ForbiddenException('Only authenticated users can request leave for their enrollments.');
        }
        // การตรวจสอบว่าเป็นเจ้าของ Enrollment จริงๆ จะอยู่ใน Service

        // สร้าง DTO ใหม่ให้ครบถ้วน ถ้า sessionNumber มาจาก Param
        const dtoForService: RequestExcuseDto = {
            sessionNumber: sessionNumber,
            dateAttendance: requestExcuseDto.dateAttendance,
            reasonForAbsence: requestExcuseDto.reasonForAbsence,
        };

        this.logger.log(`Student ${studentId} attempting to request excuse for enrollment ${enrollmentId}, session ${sessionNumber}`);
        return this.attendanceService.studentRequestExcuse(enrollmentId, dtoForService, studentId);
    }
    // --- END ADD THIS NEW ENDPOINT ---
}