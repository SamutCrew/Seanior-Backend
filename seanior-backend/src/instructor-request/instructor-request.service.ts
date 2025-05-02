import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstructorRequestDto } from '../schemas/instructorRequest';

@Injectable()
export class InstructorRequestService {
  constructor(private prisma: PrismaService) {}

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
      user: { connect: { user_id: userId } }, // Connect the user relation
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
    return this.prisma.instructor_request.create({
      data: prismaInput,
    });
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
      status: 'pending', // Reset status to pending for resubmission
      rejection_reason: null, // Clear rejection reason
    };

    // Update the Instructor request
    return this.prisma.instructor_request.update({
      where: { request_id: requestId },
      data: prismaInput,
    });
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
      data: { user_type: 'Instructor' },
    });

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
    return this.prisma.instructor_request.update({
      where: { request_id: requestId },
      data: { status: 'rejected', rejection_reason: rejectionReason },
    });
  }
}
