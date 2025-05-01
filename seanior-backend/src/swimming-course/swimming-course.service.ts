// swimming-course.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SwimmingCourseService {
  constructor(private prisma: PrismaService) {}

  async getAllCourses() {
    return this.prisma.swimming_course.findMany({
      include: {
        coach: true, // ดึงข้อมูลครูด้วยถ้าต้องการ
      },
    });
  }

  async createCourse(data: any) {
    return this.prisma.swimming_course.create({
      data,
    });
  }

  async getCoursesByTeacher(teacherId: string) {
    return this.prisma.swimming_course.findMany({
      where: {
        coach_id: teacherId,
      },
    });
  }
  
}
