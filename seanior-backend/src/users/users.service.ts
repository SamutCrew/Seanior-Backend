// users.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  createUserDto,
  checkUserDto,
  userDataDto,
  updateUserDataDto,
} from '../schemas/user';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
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
      throw new Error('Firebase UID and email are required');
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

  async getUserById(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return this.prisma.user.findUnique({
      where: { user_id: userId },
    });
  }

  async updateUserData(userId: string, userData: updateUserDataDto) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      // Step 1: Check if the user exists in the database
      const existingUser = await this.prisma.user.findUnique({
        where: { user_id: userId },
      });

      if (!existingUser) {
        this.logger.error(`User not found for user_id: ${userId}`);
        throw new Error('User not found');
      }

      // Step 2: Prepare data for database update
      const updateData: any = {
        ...(userData.email && { email: userData.email }),
        ...(userData.name && { name: userData.name }),
        ...(userData.gender && { gender: userData.gender }),
        ...(userData.address && { address: userData.address }),
        ...(userData.phone_number && { phone_number: userData.phone_number }),
        ...(userData.description && { description: userData.description }),
        ...(userData.profile_img && { profile_img: userData.profile_img }),
        ...(userData.user_type && { user_type: userData.user_type }),
      };

      // Step 3: Update the user in the database
      const updatedUser = await this.prisma.user.update({
        where: { user_id: userId },
        data: updateData,
      });

      // Step 4: Update Firebase user profile if necessary
      if (userData.email || userData.name || userData.profile_img) {
        try {
          const firebaseUpdate: admin.auth.UpdateRequest = {
            ...(userData.email && { email: userData.email }),
            ...(userData.name && { displayName: userData.name }),
            ...(userData.profile_img && { photoURL: userData.profile_img }),
          };

          await admin
            .auth()
            .updateUser(existingUser.firebase_uid, firebaseUpdate);
          this.logger.log(
            `Firebase user profile updated for UID: ${existingUser.firebase_uid}`,
          );
        } catch (firebaseError) {
          this.logger.error(
            `Failed to update Firebase user profile for UID: ${existingUser.firebase_uid}`,
            {
              error: firebaseError.message,
              stack: firebaseError.stack,
            },
          );
          throw new Error(
            `Failed to update Firebase user profile: ${firebaseError.message}`,
          );
        }
      }

      this.logger.log(`User updated successfully for user_id: ${userId}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user data for user_id: ${userId}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error; // Let the controller handle the error
    }
  }

  async getAllUsers() {
    return this.prisma.user.findMany({});
  }
  async getAllInstructors() {
    return this.prisma.user.findMany({
      where: {
        user_type: 'instructor',
      },
    });
  }
}
