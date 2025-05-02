// swimming-course.module.ts
import { Module } from '@nestjs/common';
import { SwimmingCourseService } from './swimming-course.service';
import { SwimmingCourseController } from './swimming-course.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SwimmingCourseController],
  providers: [SwimmingCourseService, PrismaService],
})
export class SwimmingCourseModule {}
