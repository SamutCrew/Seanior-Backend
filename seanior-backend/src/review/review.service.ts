// src/review/review.service.ts
import { Injectable, Logger, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from '../schemas/review';
import { UpdateReviewDto } from '../schemas/review';
import { EnrollmentStatus, Prisma } from '@prisma/client';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(private prisma: PrismaService) {}

  async createReview(enrollmentId: string, dto: CreateReviewDto, studentId: string) {
    this.logger.log(`Student ${studentId} creating review for enrollment ${enrollmentId}`);

    // 1. ตรวจสอบ Enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { enrollment_id: enrollmentId },
      include: { request: { select: { student_id: true, course_id: true } } },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found.`);
    }
    if (enrollment.request.student_id !== studentId) {
      throw new ForbiddenException('You can only review your own enrollments.');
    }
    if (enrollment.status !== EnrollmentStatus.COMPLETED) {
      throw new ForbiddenException('You can only review completed enrollments.');
    }

    // 2. ตรวจสอบว่ายังไม่เคยรีวิว Enrollment นี้มาก่อน (เพราะ enrollment_id ใน review เป็น @unique)
    // Prisma จะโยน P2002 error ถ้าพยายามสร้างซ้ำ ซึ่งเราจะดักจับใน try...catch

    try {
      const reviewDate = dto.reviewDate ? new Date(dto.reviewDate) : new Date();
      const newReview = await this.prisma.review.create({
        data: {
          enrollment_id: enrollmentId,
          rating: dto.rating,
          comment: dto.comment,
          review_date: reviewDate,
        },
      });
      this.logger.log(`Review ${newReview.review_id} created for enrollment ${enrollmentId}`);
      // (Optional) อาจจะมีการอัปเดต Rating เฉลี่ยของ Course ที่เกี่ยวข้อง
      // await this.updateCourseAverageRating(enrollment.request.course_id);
      return newReview;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Unique constraint failed (น่าจะเกิดจาก enrollment_id ซ้ำ)
        throw new ConflictException(`A review for enrollment ID ${enrollmentId} already exists.`);
      }
      this.logger.error(`Failed to create review for enrollment ${enrollmentId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Could not create review.');
    }
  }

  async getReviewsByCourse(courseId: string) {
    this.logger.log(`Workspaceing reviews for course ID: ${courseId}`);
    return this.prisma.review.findMany({
      where: {
        enrollment: { // Query ผ่าน Relation
          request: {
            course_id: courseId,
          },
        },
      },
      orderBy: { review_date: 'desc' },
      include: {
        enrollment: {
          select: {
            request: {
              select: {
                student: { select: { user_id: true, name: true, profile_img: true } },
              },
            },
          },
        },
      },
    });
  }

  async getMyReviews(studentId: string) {
    this.logger.log(`Workspaceing reviews for student ID: ${studentId}`);
    return this.prisma.review.findMany({
        where: {
            enrollment: {
                request: {
                    student_id: studentId
                }
            }
        },
        orderBy: { review_date: 'desc' },
        include: {
            enrollment: { select: { request: { select: { Course: { select: { course_id: true, course_name: true }} } } } }
        }
    });
  }


  async updateReview(reviewId: string, dto: UpdateReviewDto, studentId: string) {
    this.logger.log(`Student ${studentId} attempting to update review ${reviewId}`);
    const review = await this.prisma.review.findUnique({
        where: { review_id: reviewId },
        include: { enrollment: { select: { request: {select: { student_id: true, course_id: true}}}}}
    });

    if (!review) {
        throw new NotFoundException(`Review with ID ${reviewId} not found.`);
    }
    if (review.enrollment.request.student_id !== studentId) {
        throw new ForbiddenException('You can only update your own reviews.');
    }

    // (Optional) อาจจะมีเงื่อนไขเพิ่มเติม เช่น แก้ไขได้ภายใน X วันหลังจากสร้าง
    // const canEditUntil = new Date(review.created_at);
    // canEditUntil.setDate(canEditUntil.getDate() + 7); // สมมติแก้ได้ภายใน 7 วัน
    // if (new Date() > canEditUntil) {
    //     throw new ForbiddenException('Review can no longer be edited.');
    // }

    const updatedReview = await this.prisma.review.update({
        where: { review_id: reviewId },
        data: {
            rating: dto.rating,
            comment: dto.comment,
            // review_date: new Date(), // อาจจะอัปเดตวันที่แก้ไขรีวิว
        },
    });
    // (Optional) ถ้ามีการแก้ไข rating อาจจะต้องอัปเดต Rating เฉลี่ยของ Course อีกครั้ง
    // await this.updateCourseAverageRating(review.enrollment.request.course_id);
    return updatedReview;
  }

  async deleteReview(reviewId: string, userId: string, userType: string) {
    this.logger.log(`User ${userId} (Type: ${userType}) attempting to delete review ${reviewId}`);
    const review = await this.prisma.review.findUnique({
        where: { review_id: reviewId },
        include: { enrollment: { select: { request: {select: { student_id: true, course_id: true}}}}}
    });

    if (!review) {
        throw new NotFoundException(`Review with ID ${reviewId} not found.`);
    }

    const isOwner = review.enrollment.request.student_id === userId;
    // Admin หรือ Instructor เจ้าของคอร์ส อาจจะมีสิทธิ์ลบรีวิวที่ไม่เหมาะสมได้
    // const isCourseInstructor = review.enrollment.request.Course.instructor_id === userId; (ต้อง include Course มาด้วย)

    if (!isOwner && userType !== 'admin' /* && !isCourseInstructor */) {
        throw new ForbiddenException('You do not have permission to delete this review.');
    }

    await this.prisma.review.delete({ where: { review_id: reviewId }});
    this.logger.log(`Review ${reviewId} deleted by User ${userId}.`);
    // (Optional) อัปเดต Rating เฉลี่ยของ Course
    // await this.updateCourseAverageRating(review.enrollment.request.course_id);
    return { message: 'Review deleted successfully' };
  }

  // (Optional) Method สำหรับอัปเดต Rating เฉลี่ยของ Course
  // private async updateCourseAverageRating(courseId: string) {
  //   const reviews = await this.prisma.review.findMany({
  //     where: { enrollment: { request: { course_id: courseId } } },
  //     select: { rating: true },
  //   });
  //   if (reviews.length > 0) {
  //     const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  //     await this.prisma.swimming_course.update({
  //       where: { course_id: courseId },
  //       data: { rating: parseFloat(avgRating.toFixed(1)) }, // ปัดเศษ 1 ตำแหน่ง
  //     });
  //     this.logger.log(`Updated average rating for course ${courseId} to ${avgRating.toFixed(1)}`);
  //   } else {
  //       // ถ้าไม่มีรีวิวเลย อาจจะตั้งเป็น 0 หรือ null
  //       await this.prisma.swimming_course.update({
  //           where: { course_id: courseId },
  //           data: { rating: 0 },
  //       });
  //       this.logger.log(`No reviews for course ${courseId}, set average rating to 0.`);
  //   }
  // }

}