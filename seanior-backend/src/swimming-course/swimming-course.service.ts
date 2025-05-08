import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SwimmingCourseService {
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

  async updateCourse(courseId: string, data: any) {
    return this.prisma.swimming_course.update({
      where: { course_id: courseId },
      data,
    });
  }

  async deleteCourse(courseId: string) {
    return this.prisma.swimming_course.delete({
      where: { course_id: courseId },
    });
  }
}
