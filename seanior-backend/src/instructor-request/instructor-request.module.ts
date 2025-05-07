import { Module } from '@nestjs/common';
import { InstructorRequestService } from './instructor-request.service';
import { InstructorRequestController } from './instructor-request.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Module({
  controllers: [InstructorRequestController],
  providers: [InstructorRequestService, PrismaService, NotificationService],
})
export class InstructorRequestModule {}
