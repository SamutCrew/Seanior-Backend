import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
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

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const config = new DocumentBuilder()
    .setTitle('Seanior API')
    .setDescription('The Seanior API description')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // Enable CORS with explicit configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', // Allow requests from the frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Allow all necessary methods
    allowedHeaders: 'Content-Type, Authorization, Accept', // Allow specific headers
    credentials: true, // Allow credentials (if needed)
    preflightContinue: false, // Ensure preflight requests are handled correctly
    optionsSuccessStatus: 201, // Standard status for OPTIONS requests
  });

  // middleware log all requests for debugging
  app.use((req, res, next) => {
    logger.log(`Request: ${req.method} ${req.originalUrl}`);
    logger.debug(`Headers: ${JSON.stringify(req.headers)}`);
    res.on('finish', () => {
      logger.log(
        `Response: ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`,
      );
    });
    next();
  });

  const port = process.env.SERVER_PORT ?? 8080;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}

bootstrap();
