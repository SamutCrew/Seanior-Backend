import {
  Controller, Get, Post, Body, Logger, Param, Put, Delete, Req,
} from '@nestjs/common';
import { SwimmingCourseService } from './swimming-course.service';
import { ApiOperation } from '@nestjs/swagger';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator';

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

@Put('update/:id')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Update a swimming course' })
async updateCourse(
  @Param('id') courseId: string,
  @Body() body: UpdateCourseDto,
  @Req() req: any
) {
  const userId = req.user.user_id;
  const userType = req.user.user_type; // ดึงจาก token เช่นเดียวกับ user_id
  this.logger.log(`User ${userId} (${userType}) updating course ${courseId}`);
  return this.courseService.updateCourse(courseId, body, userId, userType);
}

  @ApiOperation({ summary: 'Delete a swimming course' })
  @Delete('delete/:id')
  @UseGuards(FirebaseAuthGuard) 
  @ApiBearerAuth()
  async deleteCourse(
    @Param('id') courseId: string,
    @Req() req: any,
  ) {
    const userId = req.user.user_id;
    const userType = req.user.user_type;
    this.logger.log(`User ${userId} (${userType}) attempting to delete course with ID: ${courseId}`);
    return this.courseService.deleteCourse(courseId, userId, userType);
  }
}
