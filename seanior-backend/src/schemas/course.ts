//  /src/schemas/course.ts
import { IsString, IsInt, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  course_name: string;

  @ApiProperty()
  @IsString()
  instructor_id: string;

  @ApiProperty()
  @IsInt()
  price: number;

  @ApiProperty()
  @IsString()
  pool_type: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  location: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsInt()
  course_duration: number;

  @ApiProperty()
  @IsInt()
  study_frequency: number;

  @ApiProperty()
  @IsInt()
  days_study: number;

  @ApiProperty()
  @IsInt()
  number_of_total_sessions: number;

  @ApiProperty()
  @IsString()
  level: string;

  @ApiProperty()
  @IsString()
  schedule: string;

  @ApiProperty()
  @IsInt()
  max_students: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  course_image?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  pool_image?: string;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
