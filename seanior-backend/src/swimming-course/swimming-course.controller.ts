import {
  Controller, Get, Post, Body, Logger, Param, Put, Delete,
} from '@nestjs/common';
import { SwimmingCourseService } from './swimming-course.service';
import { ApiOperation } from '@nestjs/swagger';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('courses')
export class SwimmingCourseController {
  private readonly logger = new Logger(SwimmingCourseController.name);

  constructor(private readonly courseService: SwimmingCourseService) {}

  @ApiOperation({ summary: 'Get all courses from database' })
  @Get('retrieve/getAllCourses')
  async getAllCourses() {
    this.logger.log('Fetching all swimming courses');
    return this.courseService.getAllCourses();
  }

  @ApiOperation({ summary: 'Get courses by instructor_id' })
  @Get('byInstructor/:id')
  async getCoursesByInstructor(@Param('id') instructorId: string) {
    this.logger.log(`Fetching courses for instructor ID: ${instructorId}`);
    return this.courseService.getCoursesByInstructor(instructorId);
  }

  @ApiOperation({ summary: 'Create a new swimming course' })
  @Post('create')
  async createCourse(@Body() body: CreateCourseDto) {
    this.logger.log('Creating new swimming course');
    return this.courseService.createCourse(body);
  }

  @ApiOperation({ summary: 'Update a swimming course' })
  @Put('update/:id')
  async updateCourse(@Param('id') courseId: string, @Body() body: UpdateCourseDto) {
    this.logger.log(`Updating course with ID: ${courseId}`);
    return this.courseService.updateCourse(courseId, body);
  }

  @ApiOperation({ summary: 'Delete a swimming course' })
  @Delete('delete/:id')
  async deleteCourse(@Param('id') courseId: string) {
    this.logger.log(`Deleting course with ID: ${courseId}`);
    return this.courseService.deleteCourse(courseId);
  }
}
