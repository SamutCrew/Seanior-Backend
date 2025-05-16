// src/enrollment/enrollment.module.ts
import { Module } from '@nestjs/common';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';
import { PrismaService } from '../prisma/prisma.service'; // ตรวจสอบ Path

@Module({
  controllers: [EnrollmentController],
  providers: [EnrollmentService, PrismaService],
  exports: [EnrollmentService] // Export ไว้เผื่อ Module อื่นอาจจะต้องใช้ (เช่น PaymentService ถ้าจะย้าย Logic สร้าง Enrollment มาที่นี่สมบูรณ์)
})
export class EnrollmentModule {}