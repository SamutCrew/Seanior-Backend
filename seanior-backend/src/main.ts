// main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common'; // <<<--- 1. เพิ่ม Import ValidationPipe
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // --- Firebase Initialization ---
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
  // --- End Firebase Initialization ---

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // --- Body Parsers Configuration (ต้องอยู่ก่อน GlobalPipes และ Logger ที่อ่าน body) ---
  app.use('/payment/webhook', bodyParser.raw({ type: '*/*' }));
  app.use(bodyParser.json()); // For other routes
  // app.use(bodyParser.urlencoded({ extended: true })); // Optional
  // --- End Body Parsers Configuration ---

  // --- ADD: Global Validation Pipe (สำคัญมากสำหรับการแปลง Type) ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ลบ Property ที่ไม่มีใน DTO ออก (เพื่อความปลอดภัย)
      forbidNonWhitelisted: true, // โยน Error ถ้ามี Property ที่ไม่มีใน DTO
      transform: true, // <<<--- Option นี้จะสั่งให้ Pipe พยายามแปลง Type ข้อมูลให้ตรงกับ DTO
      transformOptions: {
        enableImplicitConversion: true, // <<<--- ช่วยให้การแปลง Type (เช่น string to number) ทำงานได้ดีขึ้น
      },
    }),
  );
  // --- END ADD: Global Validation Pipe ---


  // --- Middleware Logging (ควรอยู่หลัง Body Parsers และ GlobalPipes) ---
  app.use((req, res, next) => {
    logger.log(`Request: ${req.method} ${req.originalUrl}`);
    logger.debug(`Params: ${JSON.stringify(req.params)}`);
    logger.debug(`Headers: ${JSON.stringify(req.headers)}`);
    logger.debug(`Body: ${JSON.stringify(req.body)}`);
    res.on('finish', () => {
      logger.log(
        `Response: ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`,
      );
    });
    next();
  });
  // --- End Middleware Logging ---

  // --- Swagger Configuration ---
  const config = new DocumentBuilder()
    .setTitle('Seanior API')
    .setDescription('The Seanior API description')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  // --- End Swagger Configuration ---

  // --- CORS Configuration ---
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Accept',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  // --- End CORS Configuration ---

  // --- Start Listening ---
  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVER_PORT') || 8000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
  logger.log(`Swagger UI available at: http://localhost:${port}/api`);
  // --- End Start Listening ---
}

bootstrap();