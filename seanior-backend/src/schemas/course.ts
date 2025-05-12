//  /src/schemas/course.ts
import { IsString, IsInt, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    description: 'course_name of the user',
    example: 'Advanced Backstroke Techniques',
  })
  @IsString()
  course_name: string;

  @ApiProperty({
    description: 'instructor_id of the user',
    example: 'cmal4jj5m0000uw7wno57qzvl',
  })
  @IsString()
  instructor_id: string;

  @ApiProperty({
    description: 'price of the user',
    example: '3500',
  })
  @IsInt()
  price: number;

  @ApiProperty({
    description: 'pool_type of the user',
    example: 'Olympic Size Saltwater Pool',
  })
  @IsString()
  pool_type: string;

  @ApiProperty({
    description: 'location of the user',
    example: '123 Main St, City',
  })
  @IsString()
  @IsOptional()
  location: string;

  @ApiProperty({
    description: 'description of the user',
    example: 'A comprehensive course focusing on advanced backstroke techniques.',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'course_duration of the user',
    example: '3',
  })
  @IsInt()
  course_duration: number;

  @ApiProperty({
    description: 'course_duration_unit of the user',
    example: 'Three times a week',
  })
  @IsInt()
  study_frequency: number;

  @ApiProperty({
    description: 'days_study of the user',
    example: '3',
  })
  @IsInt()
  days_study: number;

  @ApiProperty({
    description: 'number_of_total_sessions of the user',
    example: '12',
  })
  @IsInt()
  number_of_total_sessions: number;

  @ApiProperty({
    description: 'level of the user',
    example: 'Beginner',
  })
  @IsString()
  level: string;

  @ApiProperty({
    description: 'schedule of the user',
    example: {
    "monday": "19:00-20:00",
    "wednesday": "19:00-20:00",
    "friday": "19:00-20:00"
  },
  })
  @IsString()
  schedule: string;

  @ApiProperty({
    description: 'max_students of the user',
    example: '8',
  })
  @IsInt()
  max_students: number;

  @ApiProperty({
    description: 'course_image of the user',
    example: 'https://example.com/course.jpg',
  })
  @IsString()
  @IsOptional()
  course_image?: string;

  @ApiProperty({
    description: 'pool_image of the user',
    example: 'https://example.com/pool.jpg',
  })
  @IsString()
  @IsOptional()
  pool_image?: string;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
