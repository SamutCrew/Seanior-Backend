// src/payment/payment.controller.ts
import {
  Controller,
  Post, // ใช้ Post สำหรับ Endpoint ทั้งสอง
  Body, // ใช้รับข้อมูลจาก Request Body
  Req, // ใช้รับ Request object (เพื่อเข้าถึง raw body)
  Res, // ใช้ส่ง Response กลับไปเอง (สำหรับ Webhook)
  Headers, // ใช้รับ Header (สำหรับ stripe-signature)
  HttpCode, // ใช้กำหนด HTTP Status Code ที่จะตอบกลับ
  HttpStatus, // ค่า Status Code ต่างๆ
  BadRequestException, // ใช้โยน Error
  Logger, // เพิ่ม Logger
  UseGuards, // ถ้าต้องการให้ Endpoint สร้าง Session ต้อง Login ก่อน
  // Param, // ถ้ามี Parameter ใน Path
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'; // ถ้าใช้ Swagger
import { Request, Response } from 'express'; // Import Request/Response จาก express
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard'; // Import Guard ถ้าต้องการบังคับ Login
// import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'; // ถ้าใช้ Swagger

// สร้าง DTO ง่ายๆ สำหรับรับ course_id
class CreateCheckoutSessionDto {
  course_id: string;
  // อาจจะมี userId ถ้า Frontend ส่งมา หรือถ้าไม่ใช้ Guard
}

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name); // เพิ่ม Logger

  constructor(private readonly paymentService: PaymentService) {}

  // --- Endpoint สร้าง Checkout Session (แก้ไขจาก Get เป็น Post) ---
  @UseGuards(FirebaseAuthGuard) // เอา Comment ออก ถ้าต้องการให้ต้อง Login ก่อน
  @ApiBearerAuth()             // สำหรับ Swagger ถ้าใช้ Guard
  @ApiOperation({ summary: 'Create a Stripe Checkout Session for a course' }) // สำหรับ Swagger
  @Post('create-checkout-session') // เปลี่ยนเป็น POST เพื่อรับ Body
  async createCheckoutSession(
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
    @Req() req: any, // เอา Comment ออก ถ้าใช้ Guard เพื่อดึง userId จาก req.user
  ) {
    this.logger.log(
      `Received request to create checkout session for course: ${createCheckoutSessionDto.course_id}`,
    );
    if (!createCheckoutSessionDto.course_id) {
      throw new BadRequestException('Missing course_id in request body');
    }

    // --- ดึง userId (ถ้ามีการ Login) ---
    const userId = req.user?.user_id; // ตัวอย่างการดึงจาก Guard (อาจจะต้องปรับตามโครงสร้าง req.user ของคุณ)
    if (!userId) {
      throw new BadRequestException('User ID not found in request.');
    }
    // --- เรียก Service method ที่แก้ไขแล้ว ---
    return this.paymentService.createCourseCheckoutSession(
      createCheckoutSessionDto.course_id,
      userId, // ส่ง userId ไปด้วย (ถ้ามี)
    );
  }

  // --- Endpoint สำหรับรับ Webhook จาก Stripe ---
  @ApiOperation({ summary: 'Handle incoming Stripe webhooks' }) // สำหรับ Swagger
  @Post('webhook') // ใช้ POST
  @HttpCode(HttpStatus.OK) // ตั้งค่าให้ตอบกลับ 200 OK โดย Default ถ้าไม่มี Error
  async handleWebhook(
    @Headers('stripe-signature') signature: string, // รับ Signature จาก Header
    @Req() request: Request, // รับ Request object ทั้งหมด (ที่มี rawBody)
    @Res() response: Response, // รับ Response object เพื่อส่งกลับเอง
  ) {
    // ตรวจสอบว่ามี Signature header ส่งมาหรือไม่
    if (!signature) {
      this.logger.warn('Webhook request missing stripe-signature header');
      // ตอบกลับ Bad Request แต่ไม่ต้อง throw Error เพื่อให้ Stripe ไม่ส่งมาซ้ำๆ โดยไม่จำเป็น
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send('Missing stripe-signature header');
    }

    // ตรวจสอบว่ามี rawBody หรือไม่ (ต้องตั้งค่า Middleware ใน main.ts ให้ถูกต้อง)
    const rawBody = request.body;

    if (!rawBody) {
      this.logger.error(
        'Webhook Error: Raw body is missing. Ensure rawBody middleware is configured in main.ts.',
      );
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send('Request body is not a Buffer. Expected raw body.');
    }

    if (!rawBody || rawBody.length === 0) { // ตรวจสอบว่า rawBody มีข้อมูลหรือไม่
      this.logger.error(
        'Webhook Error: Raw body is missing or empty. Ensure body parsing middleware is configured correctly.',
      );
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send('Raw body is missing or empty');
    }

    this.logger.log(`Received Stripe webhook with signature. Raw body type: ${rawBody.constructor.name}, length: ${rawBody.length}`);

    try {
      await this.paymentService.handleWebhook(rawBody, signature);
      this.logger.log('Webhook processed successfully by service.');
      response.status(HttpStatus.OK).send('Webhook received successfully');
    } catch (err) {
      this.logger.error(`Webhook handling error: ${err.message}`);
      response
        .status(HttpStatus.BAD_REQUEST)
        .send(`Webhook Error: ${err.message}`);
    }
  }
}