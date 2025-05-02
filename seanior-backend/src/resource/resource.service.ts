// resource.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourceService {
  private blobServiceClient: BlobServiceClient;

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

    // Check for existing profile image and delete it
    const existingProfileImages = await this.prisma.resource.findMany({
      where: {
        user_id: userId,
        resource_name: {
          startsWith: `${userId}_profile.`,
        },
      },
    });

    // Delete all existing profile images
    for (const existingImage of existingProfileImages) {
      await this.deleteResource(existingImage.resource_id, containerName);
    }

    // Use deterministic name: user_id + "_profile"
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

    // Create a new resource entry
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

    // Update user's profile_img
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

    // Check for existing ID card and delete it (optional, depending on your requirements)
    const existingIdCards = await this.prisma.resource.findMany({
      where: {
        user_id: userId,
        resource_name: {
          startsWith: `${userId}_idcard.`,
        },
      },
    });

    // Delete existing ID cards to ensure only one ID card exists at a time
    for (const existingIdCard of existingIdCards) {
      await this.deleteResource(existingIdCard.resource_id, containerName);
    }

    // Use deterministic name: user_id + "_idcard"
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

    // Create a new resource entry
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

    // Check for existing swimming license and delete it (optional, depending on your requirements)
    const existingLicenses = await this.prisma.resource.findMany({
      where: {
        user_id: userId,
        resource_name: {
          startsWith: `${userId}_license.`,
        },
      },
    });

    // Delete existing licenses to ensure only one license exists at a time
    for (const existingLicense of existingLicenses) {
      await this.deleteResource(existingLicense.resource_id, containerName);
    }

    // Use deterministic name: user_id + "_license"
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

    // Create a new resource entry
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
}