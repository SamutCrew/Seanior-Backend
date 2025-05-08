// src/swimming-course/dto/create-course.dto.ts
import { IsString, IsInt } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  course_name: string;

  @IsString()
  instructor_id: string;

  @IsInt()
  price: number;

  @IsString()
  pool_type: string;

  @IsString()
  location: string;

  @IsString()
  description: string;

  @IsInt()
  course_duration: number;

  @IsInt()
  study_frequency: number;

  @IsInt()
  days_study: number;

  @IsInt()
  number_of_total_sessions: number;
}
