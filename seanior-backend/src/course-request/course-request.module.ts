// src/course-request/course-request.module.ts
import { Module } from '@nestjs/common';
import { CourseRequestController } from './course-request.controller';
import { CourseRequestService } from './course-request.service';
import { PrismaService } from '../prisma/prisma.service'; // <<<--- 1. Import PrismaService
// import { PrismaModule } from '../prisma/prisma.module'; // หรือถ้าคุณมี PrismaModule ที่ Export PrismaService ก็ Import อันนี้แทน

@Module({
  // imports: [PrismaModule], // <--- หรือถ้าใช้ PrismaModule
  controllers: [CourseRequestController],
  providers: [
    CourseRequestService,
    PrismaService // <--- 2. เพิ่ม PrismaService ใน providers
  ],
  exports: [CourseRequestService] // ถ้า Module อื่นต้องการใช้ Service นี้
})
export class CourseRequestModule {}