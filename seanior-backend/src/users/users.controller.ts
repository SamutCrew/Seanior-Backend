// users.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
  Param,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  createUserDto,
  checkUserDto,
  userDataDto,
  updateUserDataDto,
} from '../schemas/user';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiParam,
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
    description:
      'User existence checked (returns user data or null if not found)',
    type: createUserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  async checkUser(@Body() body: checkUserDto) {
    try {
      const user = await this.usersService.checkUser(body.firebase_uid);
      this.logger.log(
        user
          ? `User found: ${JSON.stringify(user)}`
          : `User not found for firebase_uid: ${body.firebase_uid}`,
      );
      this.logger.debug(`Raw database response: ${JSON.stringify(user)}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to check user: ${error.message}`, {
        firebase_uid: body.firebase_uid || 'Not provided',
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
  @ApiOperation({ summary: 'Create a new user on database' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: createUserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  async createUser(@Body() userData: createUserDto) {
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

  @ApiOperation({ summary: 'Get all instructors from database' })
  @ApiResponse({
    status: 200,
    description: 'Instructors retrieved successfully',
    type: [userDataDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Get('retrieve/getAllInstructors')
  async getAllInstructors() {
    try {
      const instructors = await this.usersService.getAllInstructors();
      return instructors;
    } catch (error) {
      this.logger.error(`Failed to retrieve instructors: ${error.message}`, {
        stack: error.stack,
      });
      throw new HttpException(
        { error: 'Database error', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('update/:userId')
  @ApiOperation({ summary: 'Update user data by user_id' })
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOkResponse({
    description: 'User data updated successfully',
    type: userDataDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: You are not allowed to update this user',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiParam({
    name: 'userId',
    description: 'The ID of the user being updated',
  })
  async updateUser(
    @Param('userId') userId: string,
    @Body() userData: updateUserDataDto,
    @Request() req: any, // Access the request object to get the authenticated user
  ) {
    try {
      const requestingUser = req.user; // From FirebaseAuthGuard
      const updatedUser = await this.usersService.updateUserData(
        userId,
        userData,
        requestingUser.user_id, // Pass the requesting user's user_id
        requestingUser.user_type, // Pass the requesting user's user_type
      );
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user: ${error.message}`, {
        stack: error.stack,
      });
      if (error.message === 'User not found') {
        throw new HttpException(
          { error: 'User not found' },
          HttpStatus.NOT_FOUND,
        );
      } else if (
        error.message === 'Forbidden: You are not allowed to update this user'
      ) {
        throw new HttpException({ error: error.message }, HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        { error: 'Database error', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('retrieve/getAllUsers')
  @ApiOperation({ summary: 'Get all users from database' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [userDataDto],
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

  @Get('retrieve/:userId')
  @ApiOperation({ summary: 'Get user data from database by user_id' })
  @ApiOkResponse({
    description: 'User data retrieved successfully',
    type: userDataDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiParam({
    name: 'userId',
    description: 'The ID of the user being retrieved',
  })
  async getUser(@Param('userId') userId: string) {
    try {
      const user = await this.usersService.getUserById(userId);
      if (!user) {
        this.logger.log(`User not found for userId: ${userId}`);
        throw new HttpException(
          { error: 'User not found' },
          HttpStatus.NOT_FOUND,
        );
      }
      return user;
    } catch (error) {
      this.logger.error(`Failed to retrieve user: ${error.message}`, {
        stack: error.stack,
      });
      throw new HttpException(
        { error: 'Database error', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}