// src/attendance/dto/create-attendance.dto.ts
import { IsNotEmpty, IsInt, IsEnum, IsOptional, IsString, IsDateString, Min, MaxLength } from 'class-validator';
import { AttendanceStatus } from '@prisma/client'; // Import Enum จาก Prisma Client
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // <<<--- 1. Import ApiProperty และ ApiPropertyOptional

export class CreateAttendanceDto {
  @ApiProperty({
    description: 'The session number for which attendance is being recorded (e.g., 1, 2, 3...).',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  sessionNumber: number;

  @ApiProperty({
    description: 'The attendance status for the session.',
    enum: AttendanceStatus, // Swagger UI จะแสดงตัวเลือกจาก Enum นี้
    example: AttendanceStatus.PRESENT,
  })
  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus; // "PRESENT", "ABSENT", "LATE", "EXCUSED"

  @ApiPropertyOptional({ // ใช้ ApiPropertyOptional เพราะ Field นี้ไม่บังคับใส่
    description: 'Optional reason for absence or other notes.',
    example: 'Doctor appointment',
    maxLength: 255, // ตัวอย่างการกำหนดความยาวสูงสุด
  })
  @IsOptional()
  @IsString()
  @MaxLength(255) // ตัวอย่าง
  reasonForAbsence?: string;

  @ApiProperty({
    description: 'The date of the attendance session (YYYY-MM-DD or ISO date string).',
    example: '2025-05-20', // หรือ '2025-05-20T10:00:00.000Z'
    format: 'date-time', // หรือ 'date' ถ้าต้องการแค่ YYYY-MM-DD
  })
  @IsNotEmpty()
  @IsDateString()
  dateAttendance: string;
}