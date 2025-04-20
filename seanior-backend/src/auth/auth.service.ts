// auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  // Create a logger instance for the AuthService
  private readonly logger = new Logger(AuthService.name);

  async verifyToken(token: string) {
    if (!token) {
      throw new Error('Token is required');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      // Log detailed error information
      this.logger.error(
        `Error verifying token: ${error.message}`, 
        {
          code: error.code, // Firebase-specific error code (e.g., 'auth/invalid-id-token')
          stack: error.stack, // Stack trace for debugging
        }
      );
      throw new Error(`Error verifying token: ${error.message}`);
    }
  }
}