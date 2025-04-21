import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

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

      request.user = decodedToken;
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
