// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ResourceModule } from './resource/resource.module';
import { ConfigModule } from '@nestjs/config';
import { SwimmingCourseModule } from './swimming-course/swimming-course.module';
import { InstructorRequestModule } from './instructor-request/instructor-request.module';
import { PaymentModule } from './payment/payment.module';
import { NotificationModule } from './notification/notification.module';
import { CourseRequestModule } from './course-request/course-request.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SessionProgressModule } from './session-progress/session-progress.module';
import { ReviewModule } from './review/review.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    PrismaModule,
    ResourceModule,
    SwimmingCourseModule,
    InstructorRequestModule,
    PaymentModule,
    NotificationModule,
    CourseRequestModule,
    AttendanceModule,
    SessionProgressModule,
    ReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  // imports: [UsersModule, AuthModule, PrismaModule, ResourceModule],
  // controllers: [AppController, UsersController, ResourceController],
  // providers: [AppService, UsersService, PrismaService, ResourceService],
})
export class AppModule {}
