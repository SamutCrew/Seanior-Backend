//  resource.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Param,
  Delete,
  Get,
  BadRequestException,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourceService } from './resource.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import {
  ResourceDto,
  UploadResourceDto,
  ResourceResponseDto,
  GetUserResourcesResponseDto,
  DeleteResourceResponseDto,
} from '../schemas/resource';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('resources')
@Controller('resources')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
export class ResourceController {
  private readonly logger = new Logger(ResourceController.name);

  constructor(private readonly resourceService: ResourceService) {}

  @Post('upload/:userId')
  @ApiOperation({ summary: 'Upload a resource for a user' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'userId',
    description: 'The ID of the user uploading the resource',
  })
  @ApiBody({
    description: 'File to upload (test file uploads in Postman, not Swagger)',
    type: UploadResourceDto,
  })
  @ApiOkResponse({
    type: ResourceResponseDto,
    description: 'Resource uploaded successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid file, user ID, or malformed request',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadResource(
    @UploadedFile() file: Express.Multer.File,
    @Param('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const containerName = 'resource'; // Fixed typo from 'resoucre' to 'resource'
    try {
      const result = await this.resourceService.uploadResource(
        file,
        userId,
        containerName,
      );
      return {
        message: 'Resource uploaded successfully',
        resource_url: result.resourceUrl,
        resource_id: result.resourceId,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Multipart')) {
        throw new BadRequestException('Malformed multipart form data');
      }
      throw error;
    }
  }

  @Post('upload-profile-image/:userId')
  @ApiOperation({ summary: 'Upload a profile image for a user' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'userId',
    description: 'The ID of the user uploading the profile image',
  })
  @ApiBody({
    description: 'Profile image file to upload',
    type: UploadResourceDto,
  })
  @ApiOkResponse({
    type: ResourceResponseDto,
    description: 'Profile image uploaded successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid file, user ID, or malformed request',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const containerName = 'resource'; // Fixed typo from 'resoucre' to 'resource'
    try {
      const result = await this.resourceService.uploadProfileImage(
        file,
        userId,
        containerName,
      );
      return {
        message: 'Profile image uploaded successfully',
        resource_url: result.resourceUrl,
        resource_id: result.resourceId,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Multipart')) {
        throw new BadRequestException('Malformed multipart form data');
      }
      throw error;
    }
  }

  @Post('upload-id-card/:userId')
  @ApiOperation({ summary: 'Upload an ID card for a user' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'userId',
    description: 'The ID of the user uploading the ID card',
  })
  @ApiBody({
    description: 'ID card file to upload (image or PDF)',
    type: UploadResourceDto,
  })
  @ApiOkResponse({
    type: ResourceResponseDto,
    description: 'ID card uploaded successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid file, user ID, or malformed request',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadIdCard(
    @UploadedFile() file: Express.Multer.File,
    @Param('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const containerName = 'resource'; // Fixed typo from 'resoucre' to 'resource'
    try {
      const result = await this.resourceService.uploadIdCard(
        file,
        userId,
        containerName,
      );
      return {
        message: 'ID card uploaded successfully',
        resource_url: result.resourceUrl,
        resource_id: result.resourceId,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Multipart')) {
        throw new BadRequestException('Malformed multipart form data');
      }
      throw error;
    }
  }

  @Post('upload-swimming-license/:userId')
  @ApiOperation({ summary: 'Upload a swimming instructor license for a user' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'userId',
    description: 'The ID of the user uploading the swimming instructor license',
  })
  @ApiBody({
    description: 'Swimming instructor license file to upload (image or PDF)',
    type: UploadResourceDto,
  })
  @ApiOkResponse({
    type: ResourceResponseDto,
    description: 'Swimming instructor license uploaded successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid file, user ID, or malformed request',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSwimmingLicense(
    @UploadedFile() file: Express.Multer.File,
    @Param('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const containerName = 'resource'; // Fixed typo from 'resoucre' to 'resource'
    try {
      const result = await this.resourceService.uploadSwimmingLicense(
        file,
        userId,
        containerName,
      );
      return {
        message: 'Swimming instructor license uploaded successfully',
        resource_url: result.resourceUrl,
        resource_id: result.resourceId,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Multipart')) {
        throw new BadRequestException('Malformed multipart form data');
      }
      throw error;
    }
  }

  @Post('upload-course-image/:courseId')
  @ApiOperation({ summary: 'Upload a course image for a specific course' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'courseId',
    description: 'The ID of the course uploading the course image',
  })
  @ApiBody({
    description: 'Course image file to upload',
    type: UploadResourceDto,
  })
  @ApiOkResponse({
    type: ResourceResponseDto,
    description: 'Course image uploaded successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid file, course ID, or malformed request',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCourseImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('courseId') courseId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const containerName = 'resource'; // Fixed typo from 'resoucre' to 'resource'
    try {
      const result = await this.resourceService.uploadCourseImage(
        file,
        courseId,
        containerName,
      );
      return {
        message: 'Course image uploaded successfully',
        resource_url: result.resourceUrl,
        resource_id: result.resourceId,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Multipart')) {
        throw new BadRequestException('Malformed multipart form data');
      }
      throw error;
    }
  }

  @Post('upload-pool-image/:courseId')
  @ApiOperation({ summary: 'Upload a pool image for a specific course' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'courseId',
    description: 'The ID of the course uploading the pool image',
  })
  @ApiBody({
    description: 'Pool image file to upload',
    type: UploadResourceDto,
  })
  @ApiOkResponse({
    type: ResourceResponseDto,
    description: 'Pool image uploaded successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid file, course ID, or malformed request',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPoolImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('courseId') courseId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const containerName = 'resource'; // Fixed typo from 'resoucre' to 'resource'
    try {
      const result = await this.resourceService.uploadPoolImage(
        file,
        courseId,
        containerName,
      );
      return {
        message: 'Pool image uploaded successfully',
        resource_url: result.resourceUrl,
        resource_id: result.resourceId,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Multipart')) {
        throw new BadRequestException('Malformed multipart form data');
      }
      throw error;
    }
  }

  @Delete('/delete/:resourceId')
  @ApiOperation({ summary: 'Delete a resource by ID' })
  @ApiParam({
    name: 'resourceId',
    description: 'The ID of the resource to delete',
  })
  @ApiOkResponse({
    type: DeleteResourceResponseDto,
    description: 'Resource deleted successfully',
  })
  @ApiBadRequestResponse({ description: 'Resource not found or invalid URL' })
  async deleteResource(@Param('resourceId') resourceId: string) {
    const containerName = 'resource'; // Fixed typo from 'resoucre' to 'resource'
    await this.resourceService.deleteResource(resourceId, containerName);
    return { message: 'Resource deleted successfully' };
  }

  @Get('/retrieve/all/:userId')
  @ApiOperation({ summary: 'Get all resources for a user by user ID' })
  @ApiParam({
    name: 'userId',
    description: 'The ID of the user whose resources are being retrieved',
  })
  @ApiOkResponse({
    type: GetUserResourcesResponseDto,
    description: 'List of user resources',
  })
  async getUserResources(@Param('userId') userId: string) {
    const resources = await this.resourceService.getUserResources(userId);
    return { resources };
  }

  @Get('retrieve/all')
  @ApiOperation({ summary: 'Get all resources from the database' })
  @ApiOkResponse({
    type: ResourceDto,
    description: 'List of all resources',
  })
  async getAllResources() {
    try {
      const resources = await this.resourceService.getAllResources();
      return resources;
    } catch (error) {
      this.logger.error(`Failed to retrieve users: ${error.message}`, {
        stack: error.stack,
      });
      throw new HttpException(
        { error: 'Database error', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}