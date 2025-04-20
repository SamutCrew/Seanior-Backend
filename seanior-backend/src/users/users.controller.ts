import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { createUser, checkUser } from '../schemas/user';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post('retrieve/checkUser')
  async checkUser(@Body() body: checkUser) {
    try {
      const user = await this.usersService.checkUser(body.firebase_uid);
      return user || null; 
    } catch (error) {
      this.logger.error(`Failed to check user: ${error.message}`, {
        firebase_uid: body.firebase_uid || 'Not provided', // Log whether a UID was sent
        stack: error.stack,
      });
      throw new HttpException(
        { error: error.message || 'Internal server error' },
        error.message === 'Firebase UID is required'
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create/createUser')
  async createUser(@Body() userData: createUser) {
    try {
      const newUser = await this.usersService.createUser(userData);
      return newUser;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, {
        userData: userData || 'Not provided', // Log whether user data was sent
        stack: error.stack,
      });
      if (error instanceof Error) {
        throw new HttpException(
          { error: 'Database error', details: error.message },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        { error: error.message || 'An unknown error occurred' },
        error.message === 'Missing required fields'
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
