import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all notifications for a user' })
  @ApiOkResponse({ description: 'List of notifications' })
  async getNotificationsByUserId(@Param('userId') userId: string) {
    try {
      const notifications =
        await this.notificationService.getNotificationsByUserId(userId);
      return { notifications };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve notifications: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        { error: 'Database error', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('read/:notificationId')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiOkResponse({ description: 'Notification marked as read' })
  @ApiBadRequestResponse({ description: 'Notification not found' })
  async markNotificationAsRead(
    @Param('notificationId') notificationId: string,
  ) {
    try {
      const updatedNotification =
        await this.notificationService.markNotificationAsRead(notificationId);
      return {
        message: 'Notification marked as read successfully',
        notification: updatedNotification,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
