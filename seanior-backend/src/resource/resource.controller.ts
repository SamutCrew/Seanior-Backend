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
    const containerName = 'resoucre';
    try {
      const result = await this.resourceService.uploadResource(
        file,
        userId,
        containerName,
      );
      return {
        message: 'Resource uploaded successfully',
        resourceUrl: result.resourceUrl,
        resourceId: result.resourceId,
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
    const containerName = 'resoucre';
    try {
      const result = await this.resourceService.uploadProfileImage(
        file,
        userId,
        containerName,
      );
      return {
        message: 'Profile image uploaded successfully',
        resourceUrl: result.resourceUrl,
        resourceId: result.resourceId,
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
    const containerName = 'resoucre';
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