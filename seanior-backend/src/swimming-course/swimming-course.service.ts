import { Injectable, NotFoundException, ForbiddenException, Logger  } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SwimmingCourseService {
  private readonly logger = new Logger(SwimmingCourseService.name);
  constructor(private prisma: PrismaService) {}

  async getAllCourses() {
    return this.prisma.swimming_course.findMany({
      include: {
        instructor: true,
      },
    });
  }

  async getCoursesByInstructor(instructorId: string) {
    return this.prisma.swimming_course.findMany({
      where: {
        instructor_id: instructorId,
      },
    });
  }

  async createCourse(data: any) {
    return this.prisma.swimming_course.create({
      data,
    });
  }

async updateCourse(courseId: string, data: any, userId: string, userType: string) {
  const course = await this.prisma.swimming_course.findUnique({
    where: { course_id: courseId },
  });

  if (!course) {
    throw new NotFoundException('Course not found');
  }

  const isOwner = course.instructor_id === userId;
  const isAdmin = userType === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenException('You are not allowed to update this course');
  }

  return this.prisma.swimming_course.update({
    where: { course_id: courseId },
    data,
  });
}

 async deleteCourse(courseId: string, userId: string, userType: string) {
    this.logger.log(`User ${userId} (Type: ${userType}) attempting to delete course ID: ${courseId}`);

    const course = await this.prisma.swimming_course.findUnique({
      where: { course_id: courseId },
    });

    if (!course) {
      this.logger.warn(`Course with ID: ${courseId} not found for deletion by User ${userId}`);
      throw new NotFoundException('Course not found');
    }

    if (typeof course.instructor_id === 'undefined') {
        this.logger.error(`instructor_id is missing on course object with ID: ${courseId} for deletion. Check Prisma schema and query.`);
        throw new ForbiddenException('Cannot verify ownership for deletion due to missing instructor information.');
    }

    const isOwner = course.instructor_id === userId;
    const isAdmin = userType === 'admin';

    if (!isOwner && !isAdmin) {
      this.logger.warn(
        `User ${userId} (Type: ${userType}) does not have permission to delete course ${courseId}. Course instructor ID: ${course.instructor_id}.`,
      );
      throw new ForbiddenException('You are not allowed to delete this course');
    }

    try {
      const deletedCourse = await this.prisma.swimming_course.delete({
        where: { course_id: courseId },
      });
      this.logger.log(`Course ${courseId} successfully deleted by User ${userId} (Type: ${userType})`);
      return deletedCourse;
    } catch (error) {
        this.logger.error(`Error during deletion of course ${courseId} by user ${userId}: ${error.message}`, error.stack);
        if (error.code === 'P2025') {
           throw new NotFoundException(`Course with ID '${courseId}' not found or already deleted.`);
        }
        throw error;
    }
  }
}