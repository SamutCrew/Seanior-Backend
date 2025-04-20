// auth.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { verifyToken } from '../schemas/auth';

@Controller('auth')
export class AuthController {
  // Create a logger instance for the AuthController
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('verifyToken')
  async verifyToken(@Body() body: verifyToken) {
    try {
      const decodedToken = await this.authService.verifyToken(body.token);
      return decodedToken;
    } catch (error) {
      // Log error details in the controller
      this.logger.error(
        `Failed to verify token: ${error.message}`,
        {
          token: body.token ? 'Provided' : 'Not provided', // Log whether a token was sent
          stack: error.stack,
        }
      );
      throw new HttpException(
        { error: error.message || 'Internal server error' },
        error.message === 'Token is required' ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}