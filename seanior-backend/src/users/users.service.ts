import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async checkUser(firebase_uid: string) {
    if (!firebase_uid) {
      throw new Error('Firebase UID is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { firebase_uid },
    });

    return user || null;
  }

  async createUser(userData: {
    firebase_uid: string;
    email: string;
    name?: string;
    profile_img?: string;
    user_type?: string;
  }) {
    if (!userData.firebase_uid || !userData.email) {
      throw new Error('Missing required fields');
    }

    return this.prisma.user.create({
      data: {
        firebase_uid: userData.firebase_uid,
        email: userData.email,
        name: userData.name || '',
        profile_img: userData.profile_img || '',
        user_type: userData.user_type || 'user',
      },
    });
  }
}