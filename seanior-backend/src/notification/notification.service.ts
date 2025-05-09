import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async createNotification(
    userId: string,
    type: string,
    message: string,
    relatedEntityId?: string,
  ) {
    return this.prisma.notification.create({
      data: {
        user_id: userId,
        type,
        message,
        related_entity_id: relatedEntityId,
        is_read: false,
      },
    });
  }

  async getNotificationsByUserId(userId: string) {
    return this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async markNotificationAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { notification_id: notificationId },
      data: { is_read: true },
    });
  }
}
