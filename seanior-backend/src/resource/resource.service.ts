// resource.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class ResourceService {
  private blobServiceClient: BlobServiceClient;
  private readonly logger = new Logger(ResourceService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    if (!connectionString) {
      throw new BadRequestException(
        'Azure Storage connection string is not configured',
      );
    }
    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
  }

  private async getBlobClient(
    containerName: string,
    blobName: string,
  ): Promise<BlockBlobClient> {
    const containerClient =
      this.blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists(); // No access option, defaults to private
    return containerClient.getBlockBlobClient(blobName);
  }

  async uploadResource(
    file: Express.Multer.File,
    userId: string,
    containerName: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new BadRequestException(`User with ID ${userId} not found`);
    }

    const extension = file.originalname.split('.').pop();
    if (!extension) {
      throw new BadRequestException('File must have a valid extension');
    }
    const fileName = `${uuid()}.${extension}`;
    const blockBlobClient = await this.getBlobClient(containerName, fileName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    const resourceUrl = blockBlobClient.url;

    const sizeInKiB = file.size / 1024;

    const resource = await this.prisma.resource.create({
      data: {
        resource_id: uuid(),
        user_id: userId,
        resource_name: file.originalname,
        resource_type: file.mimetype,
        resource_url: resourceUrl,
        resource_size: sizeInKiB,
      },
    });

    return { resourceUrl, resourceId: resource.resource_id };
  }

  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string,
    containerName: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new BadRequestException(`User with ID ${userId} not found`);
    }

    const existingProfileImages = await this.prisma.resource.findMany({
      where: {
        user_id: userId,
        resource_name: {
          startsWith: `${userId}_profile.`,
        },
      },
    });

    for (const existingImage of existingProfileImages) {
      await this.deleteResource(existingImage.resource_id, containerName);
    }

    const extension = file.originalname.split('.').pop();
    if (!extension) {
      throw new BadRequestException('File must have a valid extension');
    }
    const fileName = `${userId}_profile.${extension}`;
    const blockBlobClient = await this.getBlobClient(containerName, fileName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    const resourceUrl = blockBlobClient.url;

    const sizeInKiB = file.size / 1024;

    const resource = await this.prisma.resource.create({
      data: {
        resource_id: uuid(),
        user_id: userId,
        resource_name: fileName,
        resource_type: file.mimetype,
        resource_url: resourceUrl,
        resource_size: sizeInKiB,
      },
    });

    await this.prisma.user.update({
      where: { user_id: userId },
      data: { profile_img: resourceUrl },
    });

    return { resourceUrl, resourceId: resource.resource_id };
  }

  async uploadIdCard(
    file: Express.Multer.File,
    userId: string,
    containerName: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new BadRequestException(`User with ID ${userId} not found`);
    }

    const existingIdCards = await this.prisma.resource.findMany({
      where: {
        user_id: userId,
        resource_name: {
          startsWith: `${userId}_idcard.`,
        },
      },
    });

    for (const existingIdCard of existingIdCards) {
      await this.deleteResource(existingIdCard.resource_id, containerName);
    }

    const extension = file.originalname.split('.').pop();
    if (!extension) {
      throw new BadRequestException('File must have a valid extension');
    }
    const fileName = `${userId}_idcard.${extension}`;
    const blockBlobClient = await this.getBlobClient(containerName, fileName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    const resourceUrl = blockBlobClient.url;

    const sizeInKiB = file.size / 1024;

    const resource = await this.prisma.resource.create({
      data: {
        resource_id: uuid(),
        user_id: userId,
        resource_name: fileName,
        resource_type: file.mimetype,
        resource_url: resourceUrl,
        resource_size: sizeInKiB,
      },
    });

    return { resourceUrl, resourceId: resource.resource_id };
  }

  async uploadSwimmingLicense(
    file: Express.Multer.File,
    userId: string,
    containerName: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new BadRequestException(`User with ID ${userId} not found`);
    }

    const existingLicenses = await this.prisma.resource.findMany({
      where: {
        user_id: userId,
        resource_name: {
          startsWith: `${userId}_license.`,
        },
      },
    });

    for (const existingLicense of existingLicenses) {
      await this.deleteResource(existingLicense.resource_id, containerName);
    }

    const extension = file.originalname.split('.').pop();
    if (!extension) {
      throw new BadRequestException('File must have a valid extension');
    }
    const fileName = `${userId}_license.${extension}`;
    const blockBlobClient = await this.getBlobClient(containerName, fileName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    const resourceUrl = blockBlobClient.url;

    const sizeInKiB = file.size / 1024;

    const resource = await this.prisma.resource.create({
      data: {
        resource_id: uuid(),
        user_id: userId,
        resource_name: fileName,
        resource_type: file.mimetype,
        resource_url: resourceUrl,
        resource_size: sizeInKiB,
      },
    });

    return { resourceUrl, resourceId: resource.resource_id };
  }

  async uploadCourseImage(
    file: Express.Multer.File,
    courseId: string,
    containerName: string,
  ) {
    const course = await this.prisma.swimming_course.findUnique({
      where: { course_id: courseId },
    });

    if (!course) {
      throw new BadRequestException(`Course with ID ${courseId} not found`);
    }

    // Check for existing course image and delete it
    const existingCourseImages = await this.prisma.resource.findMany({
      where: {
        resource_name: {
          startsWith: `${courseId}_course.`,
        },
      },
    });

    for (const existingImage of existingCourseImages) {
      await this.deleteResource(existingImage.resource_id, containerName);
    }

    const extension = file.originalname.split('.').pop();
    if (!extension) {
      throw new BadRequestException('File must have a valid extension');
    }
    const fileName = `${courseId}_course.${extension}`;
    const blockBlobClient = await this.getBlobClient(containerName, fileName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    const resourceUrl = blockBlobClient.url;

    const sizeInKiB = file.size / 1024;

    const resource = await this.prisma.resource.create({
      data: {
        resource_id: uuid(),
        user_id: course.instructor_id, // Associate with the course instructor
        resource_name: fileName,
        resource_type: file.mimetype,
        resource_url: resourceUrl,
        resource_size: sizeInKiB,
      },
    });

    // Update the course with the new image URL
    await this.prisma.swimming_course.update({
      where: { course_id: courseId },
      data: { course_image: resourceUrl },
    });

    return { resourceUrl, resourceId: resource.resource_id };
  }

  async uploadPoolImage(
    file: Express.Multer.File,
    courseId: string,
    containerName: string,
  ) {
    const course = await this.prisma.swimming_course.findUnique({
      where: { course_id: courseId },
    });

    if (!course) {
      throw new BadRequestException(`Course with ID ${courseId} not found`);
    }

    // Check for existing pool image and delete it
    const existingPoolImages = await this.prisma.resource.findMany({
      where: {
        resource_name: {
          startsWith: `${courseId}_pool.`,
        },
      },
    });

    for (const existingImage of existingPoolImages) {
      await this.deleteResource(existingImage.resource_id, containerName);
    }

    const extension = file.originalname.split('.').pop();
    if (!extension) {
      throw new BadRequestException('File must have a valid extension');
    }
    const fileName = `${courseId}_pool.${extension}`;
    const blockBlobClient = await this.getBlobClient(containerName, fileName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    const resourceUrl = blockBlobClient.url;

    const sizeInKiB = file.size / 1024;

    const resource = await this.prisma.resource.create({
      data: {
        resource_id: uuid(),
        user_id: course.instructor_id, // Associate with the course instructor
        resource_name: fileName,
        resource_type: file.mimetype,
        resource_url: resourceUrl,
        resource_size: sizeInKiB,
      },
    });

    // Update the course with the new image URL
    await this.prisma.swimming_course.update({
      where: { course_id: courseId },
      data: { pool_image: resourceUrl },
    });

    return { resourceUrl, resourceId: resource.resource_id };
  }

  async deleteResource(
    resourceId: string,
    containerName: string,
  ): Promise<void> {
    const resource = await this.prisma.resource.findUnique({
      where: { resource_id: resourceId },
    });

    if (!resource) {
      throw new BadRequestException('Resource not found');
    }

    const fileName = resource.resource_url.split('/').pop();
    if (!fileName) {
      throw new BadRequestException('Invalid resource URL');
    }

    const blockBlobClient = await this.getBlobClient(containerName, fileName);
    await blockBlobClient.deleteIfExists();

    await this.prisma.resource.delete({
      where: { resource_id: resourceId },
    });
  }

  async getUserResources(userId: string) {
    return this.prisma.resource.findMany({
      where: { user_id: userId },
    });
  }

  async getAllResources() {
    return this.prisma.resource.findMany({});
  }

  // --- ADD THIS NEW METHOD ---
  async uploadSessionProgressImage(
    file: Express.Multer.File,
    enrollmentId: string, // ID ของ Enrollment ที่เกี่ยวข้อง
    sessionNumber: number,  // Session Number
    uploaderUserId: string, // ID ของ User ที่ทำการ Upload (Instructor/Admin)
    // containerName: string, // หรือจะ Hardcode containerName สำหรับ session-progress ไปเลย
  ) {
    // กำหนด Container Name สำหรับ Session Progress Images
    const containerName = 'session-progress-images'; // หรืออ่านจาก Config

    const extension = file.originalname.split('.').pop();
    if (!extension) {
      throw new BadRequestException('File must have a valid extension');
    }
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกันและสื่อความหมาย
    const fileName = `enrollment_${enrollmentId}_session_${sessionNumber}_${uuid()}.${extension}`;
    const blockBlobClient = await this.getBlobClient(containerName, fileName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    const resourceUrl = blockBlobClient.url;
    const sizeInKiB = file.size / 1024;

    // สร้าง Resource record ใน Database
    // user_id ที่ผูกกับ resource นี้คือ uploaderUserId (Instructor/Admin)
    const resource = await this.prisma.resource.create({
      data: {
        // resource_id: uuid(), // ถ้า PK ของ resource ไม่ใช่ auto-generate ด้วย cuid()
        user_id: uploaderUserId,
        resource_name: fileName, // หรือจะใช้ file.originalname ก็ได้ถ้าต้องการ
        resource_type: file.mimetype,
        resource_url: resourceUrl,
        resource_size: sizeInKiB,
      },
    });

    this.logger.log(`Session progress image uploaded: ${resourceUrl} for enrollment ${enrollmentId}, session ${sessionNumber}. Resource ID: ${resource.resource_id}`);
    return { resourceUrl, resourceId: resource.resource_id };
  }
  // --- END ADD NEW METHOD ---
}