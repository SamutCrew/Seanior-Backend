import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsObject,
  IsOptional,
} from 'class-validator';

export class ContactChannels {
  @ApiProperty({
    description: 'Line ID of the user',
    example: 'john_doe',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  line?: string;

  @ApiProperty({
    description: 'Facebook profile of the user',
    example: 'johndoe',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  facebook?: string;

  @ApiProperty({
    description: 'Instagram handle of the user',
    example: 'john.doe',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  instagram?: string;
}

export class InstructorRequestDto {
  @ApiProperty({ description: 'Full name of the user', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @ApiProperty({
    description: 'Address of the user',
    example: '123 Main St, City',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'URL of the profile image',
    example: 'https://example.com/profile.jpg',
  })
  @IsString()
  @IsNotEmpty()
  profile_image: string;

  @ApiProperty({
    description: 'Date of birth of the user',
    example: '1990-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  date_of_birth: string;

  @ApiProperty({
    description: 'Education record of the user',
    example: 'Bachelor of Science in Sports Science',
  })
  @IsString()
  @IsNotEmpty()
  education_record: string;

  @ApiProperty({
    description: 'URL of the ID card (PDF or image)',
    example: 'https://example.com/idcard.pdf',
  })
  @IsString()
  @IsNotEmpty()
  id_card_url: string;

  @ApiProperty({
    description: 'Contact channels (Line, Facebook, Instagram)',
    type: ContactChannels,
  })
  @IsObject()
  @IsNotEmpty()
  contact_channels: { line?: string; facebook?: string; instagram?: string };

  @ApiProperty({
    description: 'URL of the swimming instructor license (PDF or image)',
    example: 'https://example.com/license.pdf',
  })
  @IsString()
  @IsNotEmpty()
  swimming_instructor_license: string;

  @ApiProperty({
    description: 'Teaching history (optional)',
    example: '5 years of teaching experience',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  teaching_history?: string;

  @ApiProperty({
    description: 'Additional skills, languages, etc. (optional)',
    example: 'Fluent in Spanish, CPR certified',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  additional_skills?: string;
}
