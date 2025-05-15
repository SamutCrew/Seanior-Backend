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
  UseGuards,
  UnauthorizedException, // ใช้โยน Error ถ้าไม่ Login
   // ถ้าต้องการให้ Endpoint สร้าง Session ต้อง Login ก่อน
  // Param, // ถ้ามี Parameter ใน Path
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'; // ถ้าใช้ Swagger
import { Request, Response } from 'express'; // Import Request/Response จาก express
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard'; // Import Guard ถ้าต้องการบังคับ Login
import { CreateCheckoutSessionForRequestDto } from '../schemas/course-request'; // Import DTO สำหรับ Checkout Session
// import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'; // ถ้าใช้ Swagger

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name); // เพิ่ม Logger

  constructor(private readonly paymentService: PaymentService) {}

  // --- Endpoint สร้าง Checkout Session (แก้ไขจาก Get เป็น Post) ---
  @Post('create-checkout-session')
  @UseGuards(FirebaseAuthGuard) // <<<--- Endpoint นี้ต้อง Login แน่นอน
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Checkout Session for an approved course request' })
  async createCheckoutSession(
    @Body() dto: CreateCheckoutSessionForRequestDto, // <<<--- ใช้ DTO ใหม่
    @Req() req: any,
  ) {
    const studentId = req.user?.user_id;
    if (!studentId) {
      throw new UnauthorizedException('User not authenticated or user ID missing.');
    }
    // เราจะส่ง requestId และ studentId (คนที่จ่ายเงิน) ไปให้ Service
    return this.paymentService.createCheckoutSessionForRequest(dto.requestId, studentId);
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