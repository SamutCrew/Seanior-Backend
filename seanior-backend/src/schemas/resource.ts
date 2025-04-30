// resource.ts
import { ApiProperty } from '@nestjs/swagger';

export class UploadResourceDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The file to upload (e.g., image or PDF)',
  })
  file: Express.Multer.File;

  @ApiProperty({
    description: 'The ID of the user uploading the resource',
    example: 'user123',
  })
  userId: string;
}

export class ResourceResponseDto {
  @ApiProperty({
    description: 'Message indicating the result of the operation',
  })
  message: string;

  @ApiProperty({
    description: 'URL of the uploaded resource in Azure Blob Storage',
  })
  resourceUrl: string;

  @ApiProperty({ description: 'ID of the uploaded resource' })
  resourceId: string;
}

export class ResourceDto {
  @ApiProperty({ description: 'ID of the resource' })
  resource_id: string;

  @ApiProperty({ description: 'ID of the user who owns the resource' })
  user_id: string;

  @ApiProperty({ description: 'Name of the resource file' })
  resource_name: string;

  @ApiProperty({ description: 'Type of the resource (e.g., image/jpeg)' })
  resource_type: string;

  @ApiProperty({ description: 'URL of the resource in Azure Blob Storage' })
  resource_url: string;

  @ApiProperty({ description: 'Size of the resource in bytes' })
  resource_size: number;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Last updated timestamp' })
  updated_at: Date;
}

export class GetUserResourcesResponseDto {
  @ApiProperty({
    type: [ResourceDto],
    description: 'List of resources for the user',
  })
  resources: ResourceDto[];
}

export class DeleteResourceResponseDto {
  @ApiProperty({
    description: 'Message indicating the result of the operation',
  })
  message: string;
}
