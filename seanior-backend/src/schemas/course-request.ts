// src/course-request/dto/create-course-request.dto.ts
// หรือ /c:/Final-492/Seanior-Backend/seanior-backend/src/schemas/course-request.ts

import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsDateString,
  Matches,
  IsIn,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// --- ADD THIS CONSTANT ---
const VALID_DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
// --- END ADD CONSTANT ---

// Regex สำหรับ HH:MM format
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// DTO ย่อยสำหรับแต่ละ Slot ที่นักเรียนเลือก
export class SelectedSlotDto {
  @ApiProperty({
    description: 'Day of the week for the slot (lowercase e.g., "monday")',
    example: 'monday',
    enum: VALID_DAYS_OF_WEEK, // <<<--- ตอนนี้ TypeScript จะรู้จักตัวแปรนี้แล้ว
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(VALID_DAYS_OF_WEEK) // <<<--- ใช้ตัวแปรเดียวกันนี้กับ IsIn ด้วย
  dayOfWeek: string;

  @ApiProperty({
    description: 'Start time of the slot in HH:MM format',
    example: '10:00',
    pattern: TIME_REGEX.source,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(TIME_REGEX, { message: 'Start time must be in HH:MM format' })
  startTime: string;

  @ApiProperty({
    description: 'End time of the slot in HH:MM format',
    example: '12:00',
    pattern: TIME_REGEX.source,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(TIME_REGEX, { message: 'End time must be in HH:MM format' })
  endTime: string;
}

// DTO หลักสำหรับสร้าง Course Request
export class CreateCourseRequestDto {
  @ApiProperty({
    description: 'The ID of the course being requested',
    example: 'clxyz12340000someid',
  })
  @IsNotEmpty()
  @IsString()
  courseId: string;

  @ApiProperty({
    description: 'The desired start date for the first week of the course (YYYY-MM-DD)',
    example: '2025-05-19',
  })
  @IsNotEmpty({ message: 'Start date for the first week should not be empty' })
  @IsDateString({}, { message: 'Start date must be a valid date string (YYYY-MM-DD)' })
  startDateForFirstWeek: string;

  @ApiProperty({
    description: 'An array of selected time slots by the student',
    type: [SelectedSlotDto],
    example: [
      { dayOfWeek: 'monday', startTime: '10:00', endTime: '12:00' },
      { dayOfWeek: 'wednesday', startTime: '14:00', endTime: '15:00' },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SelectedSlotDto)
  selectedSlots: SelectedSlotDto[];

  @ApiPropertyOptional({
    description: 'Optional notes from the student regarding the request',
    example: 'I am particularly interested in freestyle techniques.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateCheckoutSessionForRequestDto {
  @ApiProperty({
    description: 'The ID of the approved course request to be paid for.',
    example: 'cmamxkxi90001uwb45myxcf3r', // ใส่ ID ตัวอย่าง
  })
  @IsNotEmpty({ message: 'Request ID should not be empty' })
  @IsString({ message: 'Request ID must be a string' })
  requestId: string;
}