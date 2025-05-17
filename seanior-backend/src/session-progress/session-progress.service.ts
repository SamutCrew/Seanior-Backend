// src/session-progress/session-progress.service.ts
import { Injectable, Logger, NotFoundException, ForbiddenException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionProgressDto } from '../schemas/session-progress';
import { UpdateSessionProgressDto } from '../schemas/session-progress';
import { EnrollmentStatus, Prisma } from '@prisma/client';

@Injectable()
export class SessionProgressService {
  private readonly logger = new Logger(SessionProgressService.name);

  constructor(private prisma: PrismaService) {}

  private async checkEnrollmentAndAuthorization(enrollmentId: string, actingUserId: string, actingUserType: string): Promise<any> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { enrollment_id: enrollmentId },
      include: {
        request: {
          include: {
            Course: { select: { instructor_id: true, number_of_total_sessions: true } }, // ดึง number_of_total_sessions จาก Course
            student: { select: { user_id: true } },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found.`);
    }

    const isCourseInstructor = enrollment.request.Course?.instructor_id === actingUserId;
    if (actingUserType !== 'admin' && !isCourseInstructor) {
      throw new ForbiddenException('You are not authorized to manage session progress for this enrollment.');
    }
    // คุณอาจจะอยากให้เฉพาะ Instructor เจ้าของคอร์สเท่านั้นที่แก้ไขได้ แม้แต่ Admin ก็แก้ไม่ได้ (แล้วแต่ Policy)
    // if (!isCourseInstructor) {
    //   throw new ForbiddenException('Only the course instructor can manage session progress.');
    // }

    return enrollment;
  }

  async createOrUpdateSessionProgress(
    enrollmentId: string,
    dto: CreateSessionProgressDto, // ใช้ CreateDTO สำหรับการสร้างหรืออัปเดตครั้งแรกของ session นั้น
    actingUserId: string,
    actingUserType: string,
  ) {
    const enrollment = await this.checkEnrollmentAndAuthorization(enrollmentId, actingUserId, actingUserType);

    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
        throw new BadRequestException(`Cannot record session progress. Enrollment status is not ACTIVE (Current: ${enrollment.status}).`);
    }

    // ตรวจสอบ sessionNumber ไม่ให้เกินจำนวน session ทั้งหมดของคอร์ส (ถ้ามีข้อมูลนี้)
    const totalSessionsInCourse = enrollment.request.Course?.number_of_total_sessions;
    if (totalSessionsInCourse && dto.sessionNumber > totalSessionsInCourse) {
        throw new BadRequestException(`Session number ${dto.sessionNumber} exceeds the total sessions (${totalSessionsInCourse}) for this course.`);
    }
    // หรือเทียบกับ enrollment.max_sessions_allowed ก็ได้ ถ้าต้องการให้สอดคล้องกัน
    if (dto.sessionNumber > enrollment.max_sessions_allowed) {
        throw new BadRequestException(`Session number ${dto.sessionNumber} exceeds maximum allowed sessions (${enrollment.max_sessions_allowed}) for this enrollment.`);
    }


    const sessionDate = new Date(dto.dateSession);

    try {
      const sessionProgress = await this.prisma.session_progress.upsert({
        where: {
            enrollment_id_session_number: { // <<<--- ลองแบบนี้ก่อน (ชื่อ Field ตาม Schema ต่อด้วย _ )
              enrollment_id: enrollmentId,
              session_number: dto.sessionNumber,
            },
        },
        update: {
          topic_covered: dto.topicCovered,
          performance_notes: dto.performanceNotes,
          date_session: sessionDate,
          image_url: dto.imageUrl,
        },
        create: {
          enrollment_id: enrollmentId,
          session_number: dto.sessionNumber,
          topic_covered: dto.topicCovered,
          performance_notes: dto.performanceNotes,
          date_session: sessionDate,
          image_url: dto.imageUrl,
        },
      });
      this.logger.log(`Session progress for enrollment ${enrollmentId}, session ${dto.sessionNumber} created/updated.`);
      return sessionProgress;
    } catch (error) {
      this.logger.error(`Failed to create/update session progress for enrollment ${enrollmentId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Could not record session progress.');
    }
  }

  async getSessionProgressForEnrollment(enrollmentId: string, accessorUserId: string, accessorUserType: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
        where: { enrollment_id: enrollmentId },
        include: { request: { include: { student: true, Course: true } } }
    });

    if (!enrollment) {
        throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found.`);
    }

    const isOwnerStudent = enrollment.request.student_id === accessorUserId;
    const isCourseInstructor = enrollment.request.Course?.instructor_id === accessorUserId;

    if (accessorUserType !== 'admin' && !isOwnerStudent && !isCourseInstructor) {
        throw new ForbiddenException('You are not authorized to view session progress for this enrollment.');
    }

    return this.prisma.session_progress.findMany({
      where: { enrollment_id: enrollmentId },
      orderBy: { session_number: 'asc' },
    });
  }

  async getOneSessionProgress(sessionProgressId: string, accessorUserId: string, accessorUserType: string) {
    const progress = await this.prisma.session_progress.findUnique({
        where: { session_progress_id: sessionProgressId },
        include: { enrollment: { include: { request: { include: { student: true, Course: true } } } } }
    });

    if (!progress) {
        throw new NotFoundException(`Session progress with ID ${sessionProgressId} not found.`);
    }

    const isOwnerStudent = progress.enrollment.request.student_id === accessorUserId;
    const isCourseInstructor = progress.enrollment.request.Course?.instructor_id === accessorUserId;

     if (accessorUserType !== 'admin' && !isOwnerStudent && !isCourseInstructor) {
        throw new ForbiddenException('You are not authorized to view this session progress.');
    }
    return progress;
  }


  async updateOneSessionProgress(
    sessionProgressId: string,
    dto: UpdateSessionProgressDto,
    actingUserId: string,
    actingUserType: string,
  ) {
    const existingProgress = await this.prisma.session_progress.findUnique({
        where: { session_progress_id: sessionProgressId },
        include: { enrollment: { include: { request: { include: { Course: true } } } } }
    });

    if (!existingProgress) {
        throw new NotFoundException(`Session progress with ID ${sessionProgressId} not found.`);
    }

    // ตรวจสอบสิทธิ์ (เฉพาะ Instructor เจ้าของคอร์ส หรือ Admin)
    const isCourseInstructor = existingProgress.enrollment.request.Course?.instructor_id === actingUserId;
     if (actingUserType !== 'admin' && !isCourseInstructor) {
        throw new ForbiddenException('You are not authorized to update this session progress.');
    }

    const dataToUpdate: Prisma.session_progressUpdateInput = {};
    if (dto.topicCovered !== undefined) dataToUpdate.topic_covered = dto.topicCovered;
    if (dto.performanceNotes !== undefined) dataToUpdate.performance_notes = dto.performanceNotes;
    if (dto.dateSession !== undefined) dataToUpdate.date_session = new Date(dto.dateSession);
    // --- จัดการ imageUrl ---
    if (dto.imageUrl !== undefined) { // ถ้ามีการส่ง imageUrl มา (อาจจะเป็น string หรือ null)
         dataToUpdate.image_url = dto.imageUrl; // ถ้าส่ง null มา คือต้องการลบรูป
    }
    // --- จบการจัดการ imageUrl ---
    // sessionNumber ปกติไม่ควรเปลี่ยน แต่ถ้าต้องการ ก็เพิ่ม Logic ได้

    if (Object.keys(dataToUpdate).length === 0) {
        throw new BadRequestException('No valid fields provided for update.');
    }

    try {
        const updatedProgress = await this.prisma.session_progress.update({
            where: { session_progress_id: sessionProgressId },
            data: dataToUpdate,
        });
        this.logger.log(`Session progress ${sessionProgressId} updated by user ${actingUserId}.`);
        return updatedProgress;
    } catch (error) {
        this.logger.error(`Failed to update session progress ${sessionProgressId}: ${error.message}`, error.stack);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new NotFoundException(`Session progress with ID ${sessionProgressId} not found during update.`);
        }
        throw new InternalServerErrorException('Could not update session progress.');
    }
  }
}