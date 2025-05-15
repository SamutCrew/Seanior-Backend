// swimming-course.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SwimmingCourseService {
  private readonly logger = new Logger(SwimmingCourseService.name);
  constructor(private prisma: PrismaService) {}

  async getAllCourses() {
    try {
      return await this.prisma.swimming_course.findMany({
        include: {
          instructor: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch all courses: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  
  async getCourseById(courseId: string) { // <--- METHOD ใหม่ที่เพิ่มเข้ามา
    this.logger.log(`Attempting to fetch course with ID: ${courseId}`);
    try {
      const course = await this.prisma.swimming_course.findUnique({
        where: {
          course_id: courseId,
        },
        include: {
          instructor: true, // ดึงข้อมูล instructor ที่เกี่ยวข้องด้วย (ถ้าต้องการ)
        },
      });

      if (!course) {
        this.logger.warn(`Course with ID: ${courseId} not found.`);
        return null; // คืนค่า null เพื่อให้ controller จัดการ NotFound
      }

      this.logger.log(`Successfully fetched course with ID: ${courseId}`);
      return course;
    } catch (error) {
      this.logger.error(
        `Failed to fetch course with ID ${courseId}: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throwเพื่อให้ controller หรือ error filter จัดการ
    }
  }

  async getCoursesByInstructor(instructorId: string) {
    try {
      return await this.prisma.swimming_course.findMany({
        where: {
          instructor_id: instructorId,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch courses for instructor ${instructorId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async createCourse(data: any) {
    try {
      return await this.prisma.swimming_course.create({
        data,
      });
    } catch (error) {
      this.logger.error(
        `Failed to create course: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateCourse(
    courseId: string,
    data: any,
    userId: string,
    userType: string,
  ) {
    if (!courseId) {
      this.logger.error('Course ID is required for update');
      throw new Error('Course ID is required');
    }

    try {
      // Step 1: Check if the course exists
      const course = await this.prisma.swimming_course.findUnique({
        where: { course_id: courseId },
        include: { instructor: true }, // Include instructor for logging
      });

      if (!course) {
        this.logger.warn(
          `Course with ID: ${courseId} not found for update by User ${userId}`,
        );
        throw new NotFoundException('Course not found');
      }

      // Step 2: Authorization check
      const isOwner = course.instructor_id === userId;
      const isAdmin = userType === 'admin';

      if (!isOwner && !isAdmin) {
        this.logger.warn(
          `Unauthorized update attempt: requestingUserId=${userId}, courseInstructorId=${course.instructor_id}, userType=${userType}, courseId=${courseId}`,
        );
        throw new ForbiddenException(
          'You are not allowed to update this course',
        );
      }

      // Step 3: Perform the update
      const updatedCourse = await this.prisma.swimming_course.update({
        where: { course_id: courseId },
        data,
      });

      this.logger.log(
        `Course ${courseId} successfully updated by User ${userId} (Type: ${userType})`,
      );
      return updatedCourse;
    } catch (error) {
      this.logger.error(
        `Failed to update course ${courseId} by user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // Let the controller handle specific status codes
    }
  }

  async deleteCourse(courseId: string, userId: string, userType: string) {
    if (!courseId) {
      this.logger.error('Course ID is required for deletion');
      throw new Error('Course ID is required');
    }

    try {
      // Step 1: Check if the course exists
      const course = await this.prisma.swimming_course.findUnique({
        where: { course_id: courseId },
        include: { instructor: true }, // Include instructor for logging
      });

      if (!course) {
        this.logger.warn(
          `Course with ID: ${courseId} not found for deletion by User ${userId}`,
        );
        throw new NotFoundException('Course not found');
      }

      // Step 2: Authorization check
      const isOwner = course.instructor_id === userId;
      const isAdmin = userType === 'admin';

      if (!isOwner && !isAdmin) {
        this.logger.warn(
          `Unauthorized delete attempt: requestingUserId=${userId}, courseInstructorId=${course.instructor_id}, userType=${userType}, courseId=${courseId}`,
        );
        throw new ForbiddenException(
          'You are not allowed to delete this course',
        );
      }

      // Step 3: Perform the deletion
      const deletedCourse = await this.prisma.swimming_course.delete({
        where: { course_id: courseId },
      });

      this.logger.log(
        `Course ${courseId} successfully deleted by User ${userId} (Type: ${userType})`,
      );
      return deletedCourse;
    } catch (error) {
      this.logger.error(
        `Failed to delete course ${courseId} by user ${userId}: ${error.message}`,
        error.stack,
      );
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Course with ID '${courseId}' not found or already deleted.`,
        );
      }
      throw error; // Let the controller handle specific status codes
    }
  }
}
