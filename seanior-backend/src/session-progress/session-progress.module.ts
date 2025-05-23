// src/session-progress/session-progress.module.ts
import { Module } from '@nestjs/common';
import { SessionProgressController } from './session-progress.controller';
import { SessionProgressService } from './session-progress.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResourceModule } from '../resource/resource.module';

@Module({
  imports: [ResourceModule], // <<<--- เพิ่ม ResourceModule ที่นี่
  controllers: [SessionProgressController],
  providers: [SessionProgressService, PrismaService],
})
export class SessionProgressModule {}