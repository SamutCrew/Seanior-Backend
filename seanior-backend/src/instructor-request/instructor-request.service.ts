// instructor-request.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstructorRequestDto } from '../schemas/instructorRequest';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class InstructorRequestService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async getUserName(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { name: true },
    });
    return user?.name || userId;
  }

  async createInstructorRequest(userId: string, dto: InstructorRequestDto) {
    // Check if the user already has any instructor request
    const existingRequest = await this.prisma.instructor_request.findFirst({
      where: {
        user_id: userId,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'You already have an Instructor request. Please edit or delete the existing request before creating a new one.',
      );
    }

    // Map InstructorRequestDto to Prisma.instructor_requestCreateInput
    const prismaInput = {
      user: { connect: { user_id: userId } },
      full_name: dto.full_name,
      phone_number: dto.phone_number,
      address: dto.address,
      profile_image: dto.profile_image,
      date_of_birth: new Date(dto.date_of_birth),
      education_record: dto.education_record,
      id_card_url: dto.id_card_url,
      contact_channels: dto.contact_channels,
      swimming_instructor_license: dto.swimming_instructor_license,
      teaching_history: dto.teaching_history,
      additional_skills: dto.additional_skills,
    };

    // Create the Instructor request
    const newRequest = await this.prisma.instructor_request.create({
      data: prismaInput,
    });

    const username = await this.getUserName(userId);

    // Notify all admins about the new instructor request
    const admins = await this.prisma.user.findMany({
      where: { user_type: 'admin' },
    });

    for (const admin of admins) {
      await this.notificationService.createNotification(
        admin.user_id,
        'instructor_request_created',
        `A new instructor request has been submitted by ${username}`,
        newRequest.request_id,
      );
    }

    return newRequest;
  }

  async updateInstructorRequest(requestId: string, dto: InstructorRequestDto) {
    // Check if the request exists
    const existingRequest = await this.prisma.instructor_request.findUnique({
      where: { request_id: requestId },
    });

    if (!existingRequest) {
      throw new BadRequestException('Instructor request not found');
    }

    // Only allow updates if the request status is "rejected"
    if (existingRequest.status !== 'rejected') {
      throw new BadRequestException(
        'You can only edit a rejected Instructor request',
      );
    }

    // Map InstructorRequestDto to Prisma.instructor_requestUpdateInput
    const prismaInput = {
      full_name: dto.full_name,
      phone_number: dto.phone_number,
      address: dto.address,
      profile_image: dto.profile_image,
      date_of_birth: new Date(dto.date_of_birth),
      education_record: dto.education_record,
      id_card_url: dto.id_card_url,
      contact_channels: dto.contact_channels,
      swimming_instructor_license: dto.swimming_instructor_license,
      teaching_history: dto.teaching_history,
      additional_skills: dto.additional_skills,
      status: 'pending',
      rejection_reason: null,
    };

    // Update the Instructor request
    const updatedRequest = await this.prisma.instructor_request.update({
      where: { request_id: requestId },
      data: prismaInput,
    });

    const username = await this.getUserName(existingRequest.user_id);

    // Notify all admins about the updated instructor request
    const admins = await this.prisma.user.findMany({
      where: { user_type: 'admin' },
    });

    for (const admin of admins) {
      await this.notificationService.createNotification(
        admin.user_id,
        'instructor_request_updated',
        `Instructor request ID: ${requestId} has been updated and resubmitted by ${username}`,
        requestId,
      );
    }

    return updatedRequest;
  }

  async getInstructorRequests() {
    return this.prisma.instructor_request.findMany({
      include: {
        user: true,
      },
    });
  }

  async getInstructorRequestById(requestId: string) {
    const request = await this.prisma.instructor_request.findUnique({
      where: { request_id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new BadRequestException('Instructor request not found');
    }

    return request;
  }

  async getInstructorRequestByUserId(userId: string) {
    return this.prisma.instructor_request.findFirst({
      where: { user_id: userId },
      include: { user: true },
    });
  }

  async approveInstructorRequest(requestId: string) {
    const request = await this.prisma.instructor_request.findUnique({
      where: { request_id: requestId },
    });

    if (!request) {
      throw new BadRequestException('Instructor request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('This request has already been processed');
    }

    // Update the request status to approved
    const updatedRequest = await this.prisma.instructor_request.update({
      where: { request_id: requestId },
      data: { status: 'approved', rejection_reason: null },
    });

    // Update the user's user_type to Instructor
    await this.prisma.user.update({
      where: { user_id: request.user_id },
      data: { user_type: 'instructor' },
    });

    // Notify the user about the approval
    await this.notificationService.createNotification(
      request.user_id,
      'instructor_request_approved',
      `Your instructor request has been approved.`,
      requestId,
    );

    return updatedRequest;
  }

  async rejectInstructorRequest(requestId: string, rejectionReason: string) {
    const request = await this.prisma.instructor_request.findUnique({
      where: { request_id: requestId },
    });

    if (!request) {
      throw new BadRequestException('Instructor request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('This request has already been processed');
    }

    // Update the request status to rejected with a reason
    const updatedRequest = await this.prisma.instructor_request.update({
      where: { request_id: requestId },
      data: { status: 'rejected', rejection_reason: rejectionReason },
    });

    // Notify the user about the rejection
    await this.notificationService.createNotification(
      request.user_id,
      'instructor_request_rejected',
      `Your instructor request has been rejected. Reason: ${rejectionReason}`,
      requestId,
    );

    return updatedRequest;
  }
}
