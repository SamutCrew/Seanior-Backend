// src/review/dto/create-review.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min, Max, MaxLength, IsOptional, IsDateString } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 5, description: 'Rating given by the student (e.g., 1 to 5)', minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Great course, learned a lot!', description: 'Student comment for the review' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  comment: string;

  @ApiPropertyOptional({ example: '2025-08-01', description: 'Date of the review (YYYY-MM-DD or ISOString), defaults to now if not provided' })
  @IsOptional()
  @IsDateString()
  reviewDate?: string; // หรือจะให้ Service ใส่ new Date() ให้เลยก็ได้
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ example: 4, description: 'Updated rating (1 to 5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 'Excellent content and instructor!', description: 'Updated student comment' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}