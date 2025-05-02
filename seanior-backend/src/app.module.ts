// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ResourceController } from './resource/resource.controller';
import { ResourceService } from './resource/resource.service';
import { ResourceModule } from './resource/resource.module';
import { ConfigModule } from '@nestjs/config';
import { SwimmingCourseModule } from './swimming-course/swimming-course.module';
import { SwimmingCourseController } from './swimming-course/swimming-course.controller';
import { InstructorRequestService } from './instructor-request/instructor-request.service';
import { InstructorRequestController } from './instructor-request/instructor-request.controller';
import { InstructorRequestModule } from './instructor-request/instructor-request.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    PrismaModule,
    ResourceModule,
    SwimmingCourseModule,
    InstructorRequestModule,
  ],
  controllers: [AppController, InstructorRequestController],
  providers: [AppService, InstructorRequestService],
  // imports: [UsersModule, AuthModule, PrismaModule, ResourceModule],
  // controllers: [AppController, UsersController, ResourceController],
  // providers: [AppService, UsersService, PrismaService, ResourceService],
})
export class AppModule {}
