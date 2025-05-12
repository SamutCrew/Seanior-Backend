// main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express'; // <<<--- 1. Import นี้
import * as bodyParser from 'body-parser'; // <<<--- 2. Import นี้

dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // --- Firebase Initialization (เหมือนเดิม) ---
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}',
  );

  if (!serviceAccount.project_id) {
    logger.error('Invalid Firebase service account key');
    throw new Error('Invalid Firebase service account key');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  // --- จบ Firebase Initialization ---


  // --- สร้าง App Instance (แก้ไข) ---
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { // <<<--- 3. ใช้ NestExpressApplication
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  // --- จบ สร้าง App Instance ---


  // --- ตั้งค่า Body Parsers (สำคัญ!) ---
  // *** ต้องอยู่ก่อน Middleware อื่นๆ ที่จะอ่าน Body เช่น Logger ***

  // 1. ใช้ Raw Parser *เฉพาะ* กับ Webhook Endpoint
  app.use('/payment/webhook', bodyParser.raw({ type: '*/*' }));

  // 2. ใช้ JSON Parser กับ Route อื่นๆ ทั่วไป
  app.use(bodyParser.json());

  // 3. (Optional) ถ้ามี Route ที่รับ Form แบบ x-www-form-urlencoded
  // app.use(bodyParser.urlencoded({ extended: true }));
  // --- จบ ตั้งค่า Body Parsers ---


  // --- Middleware Logging (อันเดิมของคุณ) ---
  // ควรอยู่ *หลัง* bodyParser เพื่อให้ req.body (สำหรับ non-webhook) ถูก Parse ก่อน
  app.use((req, res, next) => {
    logger.log(`Request: ${req.method} ${req.originalUrl}`);
    logger.debug(`Params: ${JSON.stringify(req.params)}`);
    logger.debug(`Headers: ${JSON.stringify(req.headers)}`);
    logger.debug(`Body: ${JSON.stringify(req.body)}`); // อาจจะแสดงเป็น {} หรือ Buffer สำหรับ webhook
    res.on('finish', () => {
      logger.log(
        `Response: ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`,
      );
    });
    next();
  });
  // --- จบ Middleware Logging ---


  // --- Swagger Configuration (เหมือนเดิม) ---
  const config = new DocumentBuilder()
    .setTitle('Seanior API')
    .setDescription('The Seanior API description')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  // --- จบ Swagger Configuration ---


  // --- CORS Configuration (เหมือนเดิม - แต่แก้ Status เป็น 204) ---
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Accept',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204, // ใช้ 204 สำหรับ preflight
  });
  // --- จบ CORS Configuration ---

  // --- Start Listening (เหมือนเดิม - แต่อ่าน Port จาก ConfigService) ---
  const configService = app.get(ConfigService); // ดึง ConfigService มาใช้
  const port = configService.get<number>('SERVER_PORT') || 8000; // ใช้ Port จาก .env หรือ Default 8000
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
  logger.log(`Swagger UI available at: http://localhost:${port}/api`);
  // --- จบ Start Listening ---

}

bootstrap();
