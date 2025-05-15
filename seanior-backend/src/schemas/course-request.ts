// src/course-request/dto/create-course-request.dto.ts
import { IsNotEmpty, IsString, IsDateString, Matches, IsOptional, MaxLength } from 'class-validator'; // (ถ้าคุณใช้ class-validator)
import { ApiProperty } from '@nestjs/swagger'; // (ถ้าคุณใช้ Swagger)

export class CreateCourseRequestDto {
  @ApiProperty({
      description: 'course_id',
      example: 'ID_ของ_COURSE',
    })
  @IsNotEmpty()
  @IsString()
  courseId: string;

    @ApiProperty({
        description: 'start date',
        example: 'YYYY-MM-DD',
    })
  @IsNotEmpty({ message: 'Start date should not be empty' })
  @IsDateString({}, { message: 'Start date must be a valid date string (YYYY-MM-DD)' })
  startDate: string; // e.g., "2025-05-16"

    @ApiProperty({
        description: 'dayname:HH:MM-HH:MM',
        example: 'dayname:HH:MM-HH:MM',
        })
  @IsNotEmpty({ message: 'Selected schedule should not be empty' })
  @IsString()
  @Matches(/^[a-z]+:([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/, {

    message: 'Selected schedule must be in format "dayname:HH:MM-HH:MM" (e.g., "friday:19:00-20:00")',
  })
  selectedSchedule: string; // e.g., "wednesday:19:00-20:00"
  
}

export class RejectCourseRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500) // กำหนดความยาวสูงสุดของเหตุผล
  rejectionReason?: string;
}

export class CreateCheckoutSessionForRequestDto {
  @IsNotEmpty()
  @IsString()
  requestId: string;
}