// instructor-request.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  BadRequestException,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InstructorRequestService } from './instructor-request.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { InstructorRequestDto } from '../schemas/instructorRequest';

@ApiTags('instructor-requests')
@Controller('instructor-requests')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class InstructorRequestController {
  private readonly logger = new Logger(InstructorRequestController.name);

  constructor(
    private readonly instructorRequestService: InstructorRequestService,
  ) {}

  @Post('submit/:userId')
  @ApiOperation({ summary: 'Submit an Instructor request for a user' })
  @ApiParam({
    name: 'userId',
    description: 'The ID of the user submitting the Instructor request',
  })
  @ApiBody({
    description: 'Instructor request data',
    type: InstructorRequestDto,
  })
  @ApiOkResponse({ description: 'Instructor request submitted successfully' })
  @ApiBadRequestResponse({
    description:
      'Invalid request or user already has a pending/approved request',
  })
  async submitInstructorRequest(
    @Param('userId') userId: string,
    @Body() requestData: InstructorRequestDto,
  ) {
    try {
      const request =
        await this.instructorRequestService.createInstructorRequest(
          userId,
          requestData,
        );
      return {
        message: 'Instructor request submitted successfully',
        request,
      };
    } catch (error) {
      this.logger.error(
        `Failed to submit Instructor request: ${error.message}`,
        {
          stack: error.stack,
        },
      );
      throw new BadRequestException(error.message);
    }
  }

  @Patch('update/:requestId')
  @ApiOperation({ summary: 'Update and resubmit an Instructor request' })
  @ApiParam({
    name: 'requestId',
    description: 'The ID of the Instructor request to update',
  })
  @ApiBody({
    description: 'Updated Instructor request data',
    type: InstructorRequestDto,
  })
  @ApiOkResponse({
    description: 'Instructor request updated and resubmitted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request or request not in rejected state',
  })
  async updateInstructorRequest(
    @Param('requestId') requestId: string,
    @Body() requestData: InstructorRequestDto,
  ) {
    try {
      const updatedRequest =
        await this.instructorRequestService.updateInstructorRequest(
          requestId,
          requestData,
        );
      return {
        message: 'Instructor request updated and resubmitted successfully',
        request: updatedRequest,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update Instructor request: ${error.message}`,
        {
          stack: error.stack,
        },
      );
      throw new BadRequestException(error.message);
    }
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all Instructor requests' })
  @ApiOkResponse({ description: 'List of all Instructor requests' })
  async getAllInstructorRequests() {
    try {
      const requests =
        await this.instructorRequestService.getInstructorRequests();
      return { requests };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve Instructor requests: ${error.message}`,
        {
          stack: error.stack,
        },
      );
      throw new HttpException(
        { error: 'Database error', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':requestId')
  @ApiOperation({ summary: 'Get an Instructor request by ID' })
  @ApiParam({
    name: 'requestId',
    description: 'The ID of the Instructor request',
  })
  @ApiOkResponse({ description: 'Instructor request details' })
  @ApiBadRequestResponse({ description: 'Instructor request not found' })
  async getInstructorRequestById(@Param('requestId') requestId: string) {
    try {
      const request =
        await this.instructorRequestService.getInstructorRequestById(requestId);
      return { request };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get an Instructor request by user ID' })
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiOkResponse({ description: 'Instructor request details' })
  async getInstructorRequestByUserId(@Param('userId') userId: string) {
    try {
      const request =
        await this.instructorRequestService.getInstructorRequestByUserId(
          userId,
        );
      return { request };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('approve/:requestId')
  @ApiOperation({ summary: 'Approve an Instructor request' })
  @ApiParam({
    name: 'requestId',
    description: 'The ID of the Instructor request to approve',
  })
  @ApiOkResponse({ description: 'Instructor request approved successfully' })
  @ApiBadRequestResponse({
    description: 'Instructor request not found or already processed',
  })
  async approveInstructorRequest(@Param('requestId') requestId: string) {
    try {
      const updatedRequest =
        await this.instructorRequestService.approveInstructorRequest(requestId);
      return {
        message: 'Instructor request approved successfully',
        request: updatedRequest,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('reject/:requestId')
  @ApiOperation({ summary: 'Reject an Instructor request' })
  @ApiParam({
    name: 'requestId',
    description: 'The ID of the Instructor request to reject',
  })
  @ApiBody({
    description: 'Rejection reason',
    schema: {
      type: 'object',
      properties: {
        rejection_reason: { type: 'string' },
      },
    },
  })
  @ApiOkResponse({ description: 'Instructor request rejected successfully' })
  @ApiBadRequestResponse({
    description: 'Instructor request not found or already processed',
  })
  async rejectInstructorRequest(
    @Param('requestId') requestId: string,
    @Body('rejection_reason') rejectionReason: string,
  ) {
    if (!rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    try {
      const updatedRequest =
        await this.instructorRequestService.rejectInstructorRequest(
          requestId,
          rejectionReason,
        );
      return {
        message: 'Instructor request rejected successfully',
        request: updatedRequest,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
