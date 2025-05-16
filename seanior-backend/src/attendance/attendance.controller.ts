// src/attendance/attendance.controller.ts
import { Controller, Post, Get, Put, Param, Body, Req, UseGuards, ParseIntPipe, Logger } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from '../schemas/attendance';
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
}