// firebase-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('No Bearer token provided');
      throw new UnauthorizedException('No Bearer token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      this.logger.log('Verifying Firebase token');
      const decodedToken = await admin.auth().verifyIdToken(token);
      this.logger.log(
        `Token verified successfully for user: ${decodedToken.uid}`,
      );

      // Fetch user from database using firebase_uid
      const user = await this.prisma.user.findUnique({
        where: { firebase_uid: decodedToken.uid },
        select: { user_id: true, user_type: true, firebase_uid: true },
      });

      if (!user) {
        this.logger.warn(
          `User not found in database for firebase_uid: ${decodedToken.uid}`,
        );
        throw new UnauthorizedException('User not found in database');
      }

      // Attach user details to request
      request.user = {
        ...decodedToken,
        user_id: user.user_id,
        user_type: user.user_type,
      };

      return true;
    } catch (error) {
      this.logger.error(`Failed to verify token: ${error.message}`, {
        token: token ? 'Provided' : 'Not provided',
        stack: error.stack,
      });
      throw new UnauthorizedException({
        error: error.message || 'Internal server error',
      });
    }
  }
}
