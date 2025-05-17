// src/session-progress/dto/create-session-progress.dto.ts
import { ApiProperty, ApiPropertyOptional  } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min, IsDateString, MaxLength, IsOptional, IsUrl } from 'class-validator';

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

  @ApiPropertyOptional({ // เป็น Optional
    description: 'URL of the uploaded image for session progress',
    example: 'https://your-storage.com/path/to/image.jpg',
  })
  @IsOptional()
  // @IsUrl({}, { message: 'Image URL must be a valid URL' }) // ตรวจสอบว่าเป็น URL
  // @IsString()
  imageUrl?: string; // <<<--- เปลี่ยนเป็น imageUrl (string, optional)
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

  @ApiPropertyOptional({
    description: 'URL of the uploaded image for session progress (send null or empty string to remove)',
    example: 'https://your-storage.com/path/to/new_image.jpg',
    nullable: true, // สามารถส่ง null มาเพื่อลบรูปได้
  })
  @IsOptional()
  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  @IsString() // ตรวจสอบว่าเป็นสตริง (ถ้าไม่ใช่ null)
  imageUrl?: string | null;
}

export class CreateSessionProgressWithFileDto extends CreateSessionProgressDto {
  @ApiPropertyOptional({
    type: 'string',       // Swagger UI จะมองเป็น string
    format: 'binary',     // แต่ format 'binary' จะทำให้มีปุ่ม "Choose File"
    description: 'Optional image file for session progress. This field is for file upload via multipart/form-data.',
  })
  @IsOptional() // Controller จะรับไฟล์ผ่าน @UploadedFile() ไม่ใช่จาก DTO นี้โดยตรง
  imageFile?: any; // Type 'any' หรือ 'Express.Multer.File' (ถ้า import มา) สำหรับ Swagger ให้รู้ว่ามี Field นี้
                   // class-validator จะไม่ validate field นี้ เพราะ FileInterceptor จัดการ
}

export class UpdateSessionProgressWithFileDto extends UpdateSessionProgressDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Optional new image file to replace the existing one. This field is for file upload via multipart/form-data.',
  })
  @IsOptional()
  imageFile?: any;
}