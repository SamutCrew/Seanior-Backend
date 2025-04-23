// users.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { createUser, checkUser, userData } from '../schemas/user';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post('retrieve/checkUser')
  @ApiOperation({ summary: 'Check if a user exists on database' })
  @ApiResponse({
    status: 200,
    description: 'User existence checked (returns user data or null if not found)',
    type: createUser,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  async checkUser(@Body() body: checkUser) {
    try {
      const user = await this.usersService.checkUser(body.firebase_uid);
      if (!user) {
        this.logger.log(`User not found for firebase_uid: ${body.firebase_uid}`);
        throw new HttpException(
          { error: 'User not found' },
          HttpStatus.NOT_FOUND, // Return 404 when user is not found
        );
      }
      this.logger.log(`User found: ${JSON.stringify(user)}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to check user: ${error.message}`, {
        firebase_uid: body.firebase_uid || 'Not provided',
        stack: error.stack,
      });
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error; // Re-throw the 404 error
      }
      throw new HttpException(
        { error: error.message || 'Internal server error' },
        error.message === 'Firebase UID is required'
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create/createUser')
  @ApiOperation({ summary: 'Create a new user on database' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: createUser,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  async createUser(@Body() userData: createUser) {
    try {
      const newUser = await this.usersService.createUser(userData);
      return newUser;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, {
        userData: userData || 'Not provided',
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

  @Get('retrieve/getAllUsers')
  @ApiOperation({ summary: 'Get all users from database' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [userData],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(FirebaseAuthGuard)
  async getAllUsers() {
    try {
      const users = await this.usersService.getAllUsers();
      return users;
    } catch (error) {
      this.logger.error(`Failed to retrieve users: ${error.message}`, {
        stack: error.stack,
      });
      throw new HttpException(
        { error: 'Database error', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}