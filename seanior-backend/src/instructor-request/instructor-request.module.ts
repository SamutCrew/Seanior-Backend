import { Module } from '@nestjs/common';
import { InstructorRequestService } from './instructor-request.service';
import { InstructorRequestController } from './instructor-request.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [InstructorRequestController],
  providers: [InstructorRequestService, PrismaService],
})
export class InstructorRequestModule {}