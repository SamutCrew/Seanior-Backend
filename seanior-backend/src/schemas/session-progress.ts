// src/session-progress/dto/create-session-progress.dto.ts
import { ApiProperty, ApiPropertyOptional  } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min, IsDateString, MaxLength, IsOptional } from 'class-validator';

export class CreateSessionProgressDto {
  @ApiProperty({ example: 1, description: 'The session number (e.g., 1st, 2nd session)' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  sessionNumber: number;

  @ApiProperty({ example: 'Introduction to Freestyle Stroke', description: 'Topics covered in this session' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  topicCovered: string;

  @ApiProperty({ example: 'Student showed good understanding of floating.', description: 'Performance notes or feedback for the student' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  performanceNotes: string;

  @ApiProperty({ example: '2025-05-20', description: 'Date of the session (YYYY-MM-DD or ISOString)' })
  @IsNotEmpty()
  @IsDateString()
  dateSession: string;
}

export class UpdateSessionProgressDto {
  @ApiPropertyOptional({ example: 1, description: 'The session number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  sessionNumber?: number; // ปกติ sessionNumber ไม่น่าจะเปลี่ยนได้ แต่ใส่ไว้เผื่อ

  @ApiPropertyOptional({ example: 'Advanced Freestyle Techniques', description: 'Updated topics covered' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  topicCovered?: string;

  @ApiPropertyOptional({ example: 'Student needs more practice on breathing.', description: 'Updated performance notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  performanceNotes?: string;

  @ApiPropertyOptional({ example: '2025-05-22', description: 'Updated date of the session' })
  @IsOptional()
  @IsDateString()
  dateSession?: string;
}