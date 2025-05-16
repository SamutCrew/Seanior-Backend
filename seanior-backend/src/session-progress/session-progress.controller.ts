// src/session-progress/session-progress.controller.ts
import { Controller, Post, Get, Put, Param, Body, Req, UseGuards, Logger, ForbiddenException } from '@nestjs/common';
import { SessionProgressService } from './session-progress.service';
import { CreateSessionProgressDto } from '../schemas/session-progress';
import { UpdateSessionProgressDto } from '../schemas/session-progress'; 
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('Session Progress')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller()
export class SessionProgressController {
    private readonly logger = new Logger(SessionProgressController.name);

    constructor(private readonly sessionProgressService: SessionProgressService) {}

    @Post('enrollments/:enrollmentId/session-progress')
    @ApiOperation({ summary: 'Create or update session progress for an enrollment (Instructor/Admin only)' })
    @ApiParam({ name: 'enrollmentId', type: 'string', description: 'ID of the enrollment' })
    async createOrUpdateSessionProgress(
        @Param('enrollmentId') enrollmentId: string,
        @Body() createDto: CreateSessionProgressDto, // ใช้ CreateDTO สำหรับการสร้าง/อัปเดตครั้งแรก
        @Req() req: any,
    ) {
        const actingUserId = req.user?.user_id;
        const actingUserType = req.user?.user_type;
        if (!actingUserId) { throw new ForbiddenException('Authentication required.'); }

        this.logger.log(`User ${actingUserId} (Type: ${actingUserType}) attempting to create/update session progress for enrollment ${enrollmentId}`);
        return this.sessionProgressService.createOrUpdateSessionProgress(enrollmentId, createDto, actingUserId, actingUserType);
    }

    @Get('enrollments/:enrollmentId/session-progress')
    @ApiOperation({ summary: 'Get all session progress for an enrollment (Student owner, Course Instructor, or Admin)' })
    @ApiParam({ name: 'enrollmentId', type: 'string', description: 'ID of the enrollment' })
    async getSessionProgressForEnrollment(
        @Param('enrollmentId') enrollmentId: string,
        @Req() req: any,
    ) {
        const accessorUserId = req.user?.user_id;
        const accessorUserType = req.user?.user_type;
        if (!accessorUserId) { throw new ForbiddenException('Authentication required.'); }

        this.logger.log(`User ${accessorUserId} (Type: ${accessorUserType}) attempting to get session progress for enrollment ${enrollmentId}`);
        return this.sessionProgressService.getSessionProgressForEnrollment(enrollmentId, accessorUserId, accessorUserType);
    }

    @Get('session-progress/:sessionProgressId')
    @ApiOperation({ summary: 'Get a specific session progress record (Student owner, Course Instructor, or Admin)' })
    @ApiParam({ name: 'sessionProgressId', type: 'string', description: 'ID of the session progress record' })
    async getOneSessionProgress(
        @Param('sessionProgressId') sessionProgressId: string,
        @Req() req: any,
    ) {
        const accessorUserId = req.user?.user_id;
        const accessorUserType = req.user?.user_type;
         if (!accessorUserId) { throw new ForbiddenException('Authentication required.'); }
        return this.sessionProgressService.getOneSessionProgress(sessionProgressId, accessorUserId, accessorUserType);
    }

    @Put('session-progress/:sessionProgressId')
    @ApiOperation({ summary: 'Update a specific session progress record (Instructor/Admin only)' })
    @ApiParam({ name: 'sessionProgressId', type: 'string', description: 'ID of the session progress record' })
    async updateOneSessionProgress(
        @Param('sessionProgressId') sessionProgressId: string,
        @Body() updateDto: UpdateSessionProgressDto,
        @Req() req: any,
    ) {
        const actingUserId = req.user?.user_id;
        const actingUserType = req.user?.user_type;
        if (!actingUserId) { throw new ForbiddenException('Authentication required.'); }
        return this.sessionProgressService.updateOneSessionProgress(sessionProgressId, updateDto, actingUserId, actingUserType);
    }
}