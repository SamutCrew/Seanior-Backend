// src/review/review.controller.ts
import { Controller, Post, Get, Put, Delete, Param, Body, Req, UseGuards, Logger, ParseUUIDPipe, ForbiddenException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from '../schemas/review';
import { UpdateReviewDto } from '../schemas/review';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('Reviews')
@Controller() // Path จะถูกกำหนดที่ระดับ Method
export class ReviewController {
    private readonly logger = new Logger(ReviewController.name);

    constructor(private readonly reviewService: ReviewService) {}

    @Post('enrollments/:enrollmentId/reviews')
    @UseGuards(FirebaseAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a review for a completed enrollment (Student only)' })
    @ApiParam({ name: 'enrollmentId', type: 'string', description: 'ID of the completed enrollment' })
    async createReview(
        @Param('enrollmentId') enrollmentId: string,
        @Body() createReviewDto: CreateReviewDto,
        @Req() req: any,
    ) {
        const studentId = req.user?.user_id;
        if (!studentId) { throw new ForbiddenException('Authentication required.');} // Guard ควรดักไปแล้ว
        this.logger.log(`Student ${studentId} attempting to create review for enrollment ${enrollmentId}`);
        return this.reviewService.createReview(enrollmentId, createReviewDto, studentId);
    }

    @Get('courses/:courseId/reviews')
    @ApiOperation({ summary: 'Get all reviews for a specific course (Public)' })
    @ApiParam({ name: 'courseId', type: 'string', description: 'ID of the course' })
    async getReviewsByCourse(@Param('courseId') courseId: string) {
        this.logger.log(`Workspaceing reviews for course ${courseId}`);
        return this.reviewService.getReviewsByCourse(courseId);
    }

    @Get('reviews/my')
    @UseGuards(FirebaseAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all reviews written by the logged-in student' })
    async getMyReviews(@Req() req: any) {
        const studentId = req.user?.user_id;
        if (!studentId) { throw new ForbiddenException('Authentication required.');}
        this.logger.log(`Student ${studentId} fetching their reviews.`);
        return this.reviewService.getMyReviews(studentId);
    }


    @Put('reviews/:reviewId')
    @UseGuards(FirebaseAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a review written by the logged-in student' })
    @ApiParam({ name: 'reviewId', type: 'string', description: 'ID of the review to update' })
    async updateReview(
        @Param('reviewId') reviewId: string,
        @Body() updateReviewDto: UpdateReviewDto,
        @Req() req: any,
    ) {
        const studentId = req.user?.user_id;
        if (!studentId) { throw new ForbiddenException('Authentication required.');}
        this.logger.log(`Student ${studentId} attempting to update review ${reviewId}`);
        return this.reviewService.updateReview(reviewId, updateReviewDto, studentId);
    }

    @Delete('reviews/:reviewId')
    @UseGuards(FirebaseAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a review (Student owner or Admin)' })
    @ApiParam({ name: 'reviewId', type: 'string', description: 'ID of the review to delete' })
    async deleteReview(
        @Param('reviewId') reviewId: string,
        @Req() req: any,
    ) {
        const userId = req.user?.user_id;
        const userType = req.user?.user_type;
        if (!userId) { throw new ForbiddenException('Authentication required.');}
        this.logger.log(`User ${userId} (Type: ${userType}) attempting to delete review ${reviewId}`);
        return this.reviewService.deleteReview(reviewId, userId, userType);
    }
}