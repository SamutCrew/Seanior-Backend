// swimming-course.controller.ts
import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { SwimmingCourseService } from './swimming-course.service';
import { Param } from '@nestjs/common';

@Controller('courses')
export class SwimmingCourseController {
  private readonly logger = new Logger(SwimmingCourseController.name);

  constructor(private readonly courseService: SwimmingCourseService) {}

  @Get('retrieve/getAllCourses')
  async getAllCourses() {
    this.logger.log('Fetching all swimming courses');
    return this.courseService.getAllCourses();
  }
  @Get('byTeacher/:id')
  async getCoursesByTeacher(@Param('id') teacherId: string) {
    this.logger.log(`Fetching courses for teacher with ID: ${teacherId}`);
    return this.courseService.getCoursesByTeacher(teacherId);
  }


//   @Post()
//   async createCourse(@Body() body: any) {
//     this.logger.log('Creating new swimming course');
//     return this.courseService.createCourse(body);
//   }
}