// auth.controller.ts
import {
  Controller,
  Post,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
  Request, // Add Request decorator
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Verify Firebase token' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Token verified successfully, returns decoded token',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (invalid or missing token)',
  })
  @UseGuards(FirebaseAuthGuard)
  @Post('verifyToken')
  async verifyToken(@Request() req: any) {
    try {
      this.logger.log(`Returning decoded token for user: ${req.user.uid}`);
      return req.user; // Return the decoded token from FirebaseAuthGuard
    } catch (error) {
      this.logger.error(`Failed to process token: ${error.message}`, {
        stack: error.stack,
      });
      throw new HttpException(
        { error: error.message || 'Internal server error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}