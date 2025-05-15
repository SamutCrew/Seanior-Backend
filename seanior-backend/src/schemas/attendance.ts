// src/attendance/dto/create-attendance.dto.ts
import { IsNotEmpty, IsInt, IsEnum, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { AttendanceStatus } from '@prisma/client'; // Import Enum จาก Prisma Client

export class CreateAttendanceDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  sessionNumber: number;

  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus; // "PRESENT", "ABSENT", "LATE", "EXCUSED"

  @IsOptional()
  @IsString()
  reasonForAbsence?: string;

  @IsNotEmpty()
  @IsDateString()
  dateAttendance: string; // วันที่ของเซสชันนั้นๆ (YYYY-MM-DD or ISOString)
}