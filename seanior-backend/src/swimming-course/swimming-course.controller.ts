// swimming-course.controller.ts
import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { SwimmingCourseService } from './swimming-course.service';
import { Param } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

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
  @ApiOperation({ summary: 'Get course from database by instructor_id' })
  @Get('byInstructor/:id')
  async getCoursesByInstructor(@Param('id') instructorId: string) {
    this.logger.log(`Fetching courses for instructorId with ID: ${instructorId}`);
    return this.courseService.getCoursesByInstructor(instructorId);
  }


//   @Post()
//   async createCourse(@Body() body: any) {
//     this.logger.log('Creating new swimming course');
//     return this.courseService.createCourse(body);
//   }
}