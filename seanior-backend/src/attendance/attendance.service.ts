// src/attendance/attendance.service.ts
import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from '../schemas/attendance';
import { AttendanceStatus, EnrollmentStatus, Prisma } from '@prisma/client';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private prisma: PrismaService) {}

  async recordAttendance(
    enrollmentId: string,
    dto: CreateAttendanceDto,
    instructorId: string, // ID ของ Instructor ที่กำลังบันทึก
  ) {
    this.logger.log(`Instructor ${instructorId} recording attendance for enrollment ${enrollmentId}, session ${dto.sessionNumber}`);

    // 1. ตรวจสอบ Enrollment และ Course Instructor
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { enrollment_id: enrollmentId },
      include: {
        request: {
          include: {
            Course: { select: { instructor_id: true } },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found.`);
    }
    if (enrollment.request.Course?.instructor_id !== instructorId) {
      // หรือถ้า Admin สามารถบันทึกได้ ก็ต้องเพิ่มเงื่อนไขเช็ค Role ของ instructorId
      throw new ForbiddenException('You are not authorized to record attendance for this enrollment.');
    }
    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
        throw new BadRequestException(`Cannot record attendance for an enrollment that is not ACTIVE. Current status: ${enrollment.status}`);
    }

    // 2. ตรวจสอบว่า sessionNumber ไม่เกิน max_sessions_allowed ของ enrollment
    if (dto.sessionNumber > enrollment.max_sessions_allowed) {
        throw new BadRequestException(`Session number <span class="math-inline">\{dto\.sessionNumber\} exceeds maximum allowed sessions \(</span>{enrollment.max_sessions_allowed}) for this enrollment.`);
    }

    // 3. สร้างหรืออัปเดต Attendance record
    // ใช้ upsert เพื่อให้ถ้ามี record ของ session นี้อยู่แล้วให้อัปเดต, ถ้าไม่มีให้สร้างใหม่
    const attendanceRecord = await this.prisma.attendance.upsert({
      where: {
        enrollment_id_session_number: { // อ้างอิงจาก @@unique ที่เราตั้งใน Schema
          enrollment_id: enrollmentId,
          session_number: dto.sessionNumber,
        }
      },
      update: { // ถ้ามีอยู่แล้วให้อัปเดตอะไรบ้าง
        attendance_status: dto.status,
        reason_for_absence: dto.reasonForAbsence,
        date_attendance: new Date(dto.dateAttendance),
        recorded_by_id: instructorId,
      },
      create: { // ถ้ายังไม่มี ให้สร้างใหม่
        enrollment_id: enrollmentId,
        session_number: dto.sessionNumber,
        attendance_status: dto.status,
        reason_for_absence: dto.reasonForAbsence,
        date_attendance: new Date(dto.dateAttendance),
        recorded_by_id: instructorId,
      },
    });
    this.logger.log(`Attendance recorded/updated for enrollment ${enrollmentId}, session ${dto.sessionNumber}: ${dto.status}`);

    // 4. อัปเดต actual_sessions_attended ใน Enrollment และตรวจสอบการจบ Enrollment
    // เราต้องนับจำนวนครั้งที่ 'PRESENT' หรือ 'LATE' (หรือตามที่คุณนิยามว่านับเป็นการเข้าเรียน)
    const presentStatuses: AttendanceStatus[] = [AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.EXCUSED]; // สมมติว่า EXCUSED ก็นับ
    const attendedSessionsCount = await this.prisma.attendance.count({
        where: {
            enrollment_id: enrollmentId,
            attendance_status: { in: presentStatuses }
        }
    });

    let updatedEnrollmentData: Prisma.enrollmentUpdateInput = {
        actual_sessions_attended: attendedSessionsCount,
    };

    // ตรวจสอบเงื่อนไขการจบ Enrollment
    let shouldCompleteEnrollment = false;
    if (attendedSessionsCount >= enrollment.target_sessions_to_complete) {
        this.logger.log(`Enrollment <span class="math-inline">\{enrollmentId\} reached target sessions \(</span>{attendedSessionsCount}/${enrollment.target_sessions_to_complete}). Marking as COMPLETED.`);
        shouldCompleteEnrollment = true;
    }
    // ตรวจสอบว่าใช้โควต้า session ที่ควรจะมาเรียนไปครบหรือยัง
    // สมมติว่าทุก session_number จนถึง max_sessions_allowed คือ session ที่ควรจะเกิดขึ้น
    // การนับ sessions_accounted_for อาจจะซับซ้อน ถ้าจะนับเฉพาะวันที่ควรมีเรียนจริงๆ
    // เพื่อความง่ายตอนนี้ จะเช็คแค่ target_sessions_completed
    // หรือถ้าจะใช้ max_sessions_allowed เป็นตัวตัดจบ:
    // const totalSessionsTakenOrMissed = await this.prisma.attendance.count({
    //     where: { enrollment_id: enrollmentId }
    // });
    // if (totalSessionsTakenOrMissed >= enrollment.max_sessions_allowed) {
    //     this.logger.log(`Enrollment <span class="math-inline">\{enrollmentId\} reached max allowed sessions \(</span>{totalSessionsTakenOrMissed}/${enrollment.max_sessions_allowed}). Marking as COMPLETED.`);
    //     shouldCompleteEnrollment = true;
    // }


    if (shouldCompleteEnrollment) {
        updatedEnrollmentData.status = EnrollmentStatus.COMPLETED;
        updatedEnrollmentData.end_date = new Date(); // วันที่จบคือวันที่เงื่อนไขครบ
    }

    const updatedEnrollment = await this.prisma.enrollment.update({
        where: { enrollment_id: enrollmentId },
        data: updatedEnrollmentData,
    });

    this.logger.log(`Enrollment ${enrollmentId} updated. Attended sessions: ${updatedEnrollment.actual_sessions_attended}. Status: ${updatedEnrollment.status}`);

    return attendanceRecord; // หรือจะ return updatedEnrollment ก็ได้
  }

  async getAttendancesForEnrollment(enrollmentId: string, accessorUserId: string, accessorUserType: string) {
    // ตรวจสอบว่า accessorUserId เป็น student เจ้าของ enrollment หรือ instructor ของ course นั้น หรือ admin
    const enrollment = await this.prisma.enrollment.findUnique({
        where: { enrollment_id: enrollmentId },
        include: { request: { include: { student: true, Course: true } } }
    });

    if (!enrollment) {
        throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found.`);
    }

    const isOwner = enrollment.request.student_id === accessorUserId;
    const isCourseInstructor = enrollment.request.Course?.instructor_id === accessorUserId;

    if (accessorUserType !== 'admin' && !isOwner && !isCourseInstructor) {
        throw new ForbiddenException('You are not authorized to view attendance for this enrollment.');
    }

    return this.prisma.attendance.findMany({
      where: { enrollment_id: enrollmentId },
      orderBy: { session_number: 'asc' },
      // include: { recorded_by: { select: { name: true} } } // ถ้าต้องการชื่อผู้บันทึก
    });
  }
}