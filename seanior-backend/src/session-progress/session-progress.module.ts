// src/session-progress/session-progress.module.ts
import { Module } from '@nestjs/common';
import { SessionProgressController } from './session-progress.controller';
import { SessionProgressService } from './session-progress.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SessionProgressController],
  providers: [SessionProgressService, PrismaService],
})
export class SessionProgressModule {}