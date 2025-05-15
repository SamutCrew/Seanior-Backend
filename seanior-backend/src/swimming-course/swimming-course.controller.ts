// swimming-course.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  Param,
  Put,
  Delete,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SwimmingCourseService } from './swimming-course.service';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCourseDto, UpdateCourseDto } from '../schemas/course';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator';

@ApiTags('Swimming Courses')
@Controller('courses')
export class SwimmingCourseController {
  private readonly logger = new Logger(SwimmingCourseController.name);

  constructor(private readonly courseService: SwimmingCourseService) {}

  @ApiOperation({ summary: 'Get all courses from database' })
  @ApiOkResponse({
    description: 'Courses retrieved successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @Get('retrieve/getAllCourses')
  async getAllCourses() {
    this.logger.log('Fetching all swimming courses');
    try {
      return await this.courseService.getAllCourses();
    } catch (error) {
      this.logger.error(
        `Failed to fetch courses: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        { error: 'Database error', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Get a specific course by its ID' }) // <--- เพิ่ม endpoint ใหม่
  @ApiOkResponse({
    description: 'Course retrieved successfully',
    // type: CreateCourseDto, // หรือ DTO ที่เหมาะสมสำหรับ course เดี่ยว
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the course',
    type: String, // ระบุ type ของ parameter
  })
  @Get('byCourse/:id')
  async getCourseById(@Param('id') courseId: string) {
    this.logger.log(`Workspaceing course with ID: ${courseId}`);
    try {
      const course = await this.courseService.getCourseById(courseId); // สมมติว่ามี method นี้ใน service
      if (!course) {
        this.logger.warn(`Course with ID: ${courseId} not found`);
        throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
      }
      return course;
    } catch (error) {
      this.logger.error(
        `Failed to fetch course ${courseId}: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) { // ส่งต่อ HttpException ที่ถูก throw จาก service หรือ check ก่อนหน้า
        throw error;
      }
      throw new HttpException(
        { error: 'Database error', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Get courses by instructor_id' })
  @ApiOkResponse({
    description: 'Courses retrieved successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the instructor',
  })
  @Get('byInstructor/:id')
  async getCoursesByInstructor(@Param('id') instructorId: string) {
    this.logger.log(`Fetching courses for instructor ID: ${instructorId}`);
    try {
      return await this.courseService.getCoursesByInstructor(instructorId);
    } catch (error) {
      this.logger.error(
        `Failed to fetch courses for instructor ${instructorId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        { error: 'Database error', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Create a new swimming course' })
  @ApiOkResponse({
    description: 'Course created successfully',
    type: CreateCourseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input',
  })
  @Post('create')
  async createCourse(@Body() courseData: CreateCourseDto) {
    this.logger.log('Creating new swimming course');
    try {
      return await this.courseService.createCourse(courseData);
    } catch (error) {
      this.logger.error(
        `Failed to create course: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        { error: 'Database error', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('update/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a swimming course' })
  @ApiOkResponse({
    description: 'Course updated successfully',
    type: UpdateCourseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: You are not allowed to update this course',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the course being updated',
  })
  async updateCourse(
    @Param('id') courseId: string,
    @Body() body: UpdateCourseDto,
    @Req() req: any,
  ) {
    const userId = req.user.user_id;
    const userType = req.user.user_type;
    this.logger.log(`User ${userId} (${userType}) updating course ${courseId}`);
    try {
      return await this.courseService.updateCourse(
        courseId,
        body,
        userId,
        userType,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update course ${courseId} by user ${userId}: ${error.message}`,
        error.stack,
      );
      if (error.message === 'Course not found') {
        throw new HttpException(
          { error: 'Course not found' },
          HttpStatus.NOT_FOUND,
        );
      } else if (
        error.message === 'You are not allowed to update this course'
      ) {
        throw new HttpException({ error: error.message }, HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        { error: 'Database error', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('delete/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a swimming course' })
  @ApiOkResponse({
    description: 'Course deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: You are not allowed to delete this course',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the course being deleted',
  })
  async deleteCourse(@Param('id') courseId: string, @Req() req: any) {
    const userId = req.user.user_id;
    const userType = req.user.user_type;
    this.logger.log(
      `User ${userId} (${userType}) attempting to delete course with ID: ${courseId}`,
    );
    try {
      return await this.courseService.deleteCourse(courseId, userId, userType);
    } catch (error) {
      this.logger.error(
        `Failed to delete course ${courseId} by user ${userId}: ${error.message}`,
        error.stack,
      );
      if (error.message === 'Course not found') {
        throw new HttpException(
          { error: 'Course not found' },
          HttpStatus.NOT_FOUND,
        );
      } else if (
        error.message === 'You are not allowed to delete this course'
      ) {
        throw new HttpException({ error: error.message }, HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        { error: 'Database error', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
