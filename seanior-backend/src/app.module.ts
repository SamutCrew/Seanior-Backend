import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { SwimmingCourseModule } from './swimming-course/swimming-course.module';
import { SwimmingCourseController } from './swimming-course/swimming-course.controller';

@Module({
  imports: [SwimmingCourseModule, UsersModule, AuthModule, PrismaModule],
  controllers: [AppController, UsersController],
  providers: [AppService, UsersService, PrismaService],
})
export class AppModule {}
