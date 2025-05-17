// src/session-progress/session-progress.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Req,
  UseGuards,
  Logger,
  ForbiddenException,
  UploadedFile,         // <<<--- ตรวจสอบว่า Import ถูกต้อง
  UseInterceptors,      // <<<--- ตรวจสอบว่า Import ถูกต้อง
  ParseFilePipe,        // <<<--- ตรวจสอบว่า Import ถูกต้อง (Optional)
  MaxFileSizeValidator, // (Optional)
  FileTypeValidator,    // (Optional)
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'; // <<<--- ตรวจสอบว่า Import ถูกต้อง
import { SessionProgressService } from './session-progress.service';
// ตรวจสอบ Path ของ DTOs ให้ถูกต้อง (คุณอาจจะเก็บไว้ที่ ../schemas/session-progress)
import {
  CreateSessionProgressDto,
  UpdateSessionProgressDto,
  CreateSessionProgressWithFileDto, // <<<--- Import DTO ใหม่สำหรับ Swagger
  UpdateSessionProgressWithFileDto,   // <<<--- Import DTO ใหม่สำหรับ Swagger
} from '../schemas/session-progress'; // <<<--- สมมติว่า Path นี้ถูกต้อง
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiConsumes, // <<<--- ตรวจสอบว่า Import ถูกต้อง
  ApiBody,     // <<<--- ตรวจสอบว่า Import ถูกต้อง
} from '@nestjs/swagger';
import { Express } from 'express'; // <<<--- ตรวจสอบว่า Import ถูกต้อง
import { ResourceService } from '../resource/resource.service'; // <<<--- Import ResourceService (ตรวจสอบ Path)

@ApiTags('Session Progress')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller()
export class SessionProgressController {
  private readonly logger = new Logger(SessionProgressController.name);

  // --- MODIFY: Inject ResourceService ---
  constructor(
    private readonly sessionProgressService: SessionProgressService,
    private readonly resourceService: ResourceService, // <<<--- Inject ResourceService ที่นี่
  ) {}
  // --- END MODIFY ---


  // --- MODIFY: Method createOrUpdateSessionProgress ---
  @Post('enrollments/:enrollmentId/session-progress')
  @ApiOperation({ summary: 'Create or update session progress for an enrollment (Instructor/Admin only), with optional image upload' })
  @ApiParam({ name: 'enrollmentId', type: 'string', description: 'ID of the enrollment' })
  @ApiConsumes('multipart/form-data')        // <<<--- ADD
  @ApiBody({ type: CreateSessionProgressWithFileDto }) // <<<--- ADD: ใช้ DTO ที่มี imageFile
  @UseInterceptors(FileInterceptor('imageFile')) // <<<--- ADD: รับไฟล์จาก Field 'imageFile'
  async createOrUpdateSessionProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Body() createDto: CreateSessionProgressDto,    // DTO สำหรับ Text Fields
    @Req() req: any,
    @UploadedFile(                                  // <<<--- ADD: Parameter สำหรับรับไฟล์
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          // new FileTypeValidator({ fileType: 'image/(jpeg|png|gif|webp|jpg)' }),
        ],
        fileIsRequired: false, // รูปไม่บังคับ
      }),
    ) imageFile?: Express.Multer.File,             // <<<--- ตัวแปรไฟล์ที่ Upload มา
  ) {
    const actingUserId = req.user?.user_id;
    const actingUserType = req.user?.user_type;
    if (!actingUserId) { throw new ForbiddenException('Authentication required.'); }

    let uploadedImageUrl: string | undefined = createDto.imageUrl; // ใช้ imageUrl จาก DTO ถ้ามีการส่งมา (เช่นกรณีแก้ไขโดยไม่เปลี่ยนรูป)

    if (imageFile) { // ถ้ามีการ Upload ไฟล์ใหม่เข้ามา
      this.logger.log(`Uploading new image ${imageFile.originalname} for enrollment ${enrollmentId}, session ${createDto.sessionNumber}`);
      try {
        // --- เรียกใช้ ResourceService เพื่อ Upload ไฟล์ ---
        const uploadResult = await this.resourceService.uploadSessionProgressImage(
           imageFile,
           enrollmentId,
           createDto.sessionNumber,
           actingUserId // User ที่ทำการ Upload
        );
        uploadedImageUrl = uploadResult.resourceUrl; // อัปเดต imageUrl ด้วย URL ใหม่
        this.logger.log(`Image uploaded via ResourceService, URL: ${uploadedImageUrl}`);
      } catch (uploadError) {
        this.logger.error(`Image upload failed for ${imageFile.originalname}: ${uploadError.message}`, uploadError.stack);
        throw new InternalServerErrorException('Image upload failed.');
      }
    }

    // สร้าง DTO ที่จะส่งให้ Service โดยรวม imageUrl ที่อัปเดตแล้ว
    const dtoForService: CreateSessionProgressDto = {
        ...createDto,
        imageUrl: uploadedImageUrl, // ใส่ URL ที่ได้จากการ Upload (หรือ undefined ถ้าไม่มีการ Upload หรือค่าเดิมจาก DTO)
    };

    this.logger.log(`User ${actingUserId} (Type: ${actingUserType}) attempting to create/update session progress for enrollment ${enrollmentId}`);
    return this.sessionProgressService.createOrUpdateSessionProgress(
        enrollmentId,
        dtoForService, // <<<--- ส่ง DTO ที่มี imageUrl
        actingUserId,
        actingUserType
    );
  }
  // --- END MODIFY ---


  @Get('enrollments/:enrollmentId/session-progress')
  @ApiOperation({ summary: 'Get all session progress for an enrollment (Student owner, Course Instructor, or Admin)' })
  @ApiParam({ name: 'enrollmentId', type: 'string', description: 'ID of the enrollment' })
  async getSessionProgressForEnrollment(
    @Param('enrollmentId') enrollmentId: string,
    @Req() req: any,
  ) {
    const accessorUserId = req.user?.user_id;
    const accessorUserType = req.user?.user_type;
    if (!accessorUserId) { throw new ForbiddenException('Authentication required.'); }

    this.logger.log(`User ${accessorUserId} (Type: ${accessorUserType}) attempting to get session progress for enrollment ${enrollmentId}`);
    return this.sessionProgressService.getSessionProgressForEnrollment(enrollmentId, accessorUserId, accessorUserType);
  }

  @Get('session-progress/:sessionProgressId')
  @ApiOperation({ summary: 'Get a specific session progress record (Student owner, Course Instructor, or Admin)' })
  @ApiParam({ name: 'sessionProgressId', type: 'string', description: 'ID of the session progress record' })
  async getOneSessionProgress(
    @Param('sessionProgressId') sessionProgressId: string,
    @Req() req: any,
  ) {
    const accessorUserId = req.user?.user_id;
    const accessorUserType = req.user?.user_type;
    if (!accessorUserId) { throw new ForbiddenException('Authentication required.'); }
    return this.sessionProgressService.getOneSessionProgress(sessionProgressId, accessorUserId, accessorUserType);
  }

  // --- MODIFY: Method updateOneSessionProgress ---
  @Put('session-progress/:sessionProgressId')
  @ApiOperation({ summary: 'Update a specific session progress record (Instructor/Admin only), with optional new image' })
  @ApiParam({ name: 'sessionProgressId', type: 'string', description: 'ID of the session progress record' })
  @ApiConsumes('multipart/form-data')        // <<<--- ADD
  @ApiBody({ type: UpdateSessionProgressWithFileDto }) // <<<--- ADD: ใช้ DTO ที่มี imageFile
  @UseInterceptors(FileInterceptor('imageFile')) // <<<--- ADD
  async updateOneSessionProgress(
    @Param('sessionProgressId') sessionProgressId: string,
    @Body() updateDto: UpdateSessionProgressDto,    // DTO สำหรับ Text Fields
    @Req() req: any,
    @UploadedFile(                                  // <<<--- ADD
      new ParseFilePipe({
        validators: [ /* ... Validators ... */ ],
        fileIsRequired: false, // รูปใหม่อาจจะไม่ถูกส่งมาเสมอไป
      }),
    ) imageFile?: Express.Multer.File,             // <<<--- รับไฟล์ที่ Upload มา
  ) {
    const actingUserId = req.user?.user_id;
    const actingUserType = req.user?.user_type;
    if (!actingUserId) { throw new ForbiddenException('Authentication required.'); }

    let imageUrlToUpdate: string | undefined | null = updateDto.imageUrl; // ค่า default คือที่ส่งมาใน DTO (อาจจะเป็น null ถ้าต้องการลบ)

    if (imageFile) { // ถ้ามีการ Upload ไฟล์ใหม่
      this.logger.log(`Uploading new image ${imageFile.originalname} to replace for session progress ${sessionProgressId}`);
      try {
        // ดึงข้อมูล enrollmentId และ sessionNumber จาก existingProgress ก่อน
        // เพื่อให้ ResourceService สามารถสร้างชื่อไฟล์ที่เป็นระบบได้
        // หรือจะส่ง sessionProgressId ไปให้ ResourceService แล้วให้ Service นั้น Query เองก็ได้
        const existingProgress = await this.sessionProgressService.getOneSessionProgress(sessionProgressId, actingUserId, actingUserType); // เรียกใช้ getOne เพื่อเช็คสิทธิ์และเอาข้อมูล
        if (!existingProgress) { // ควรจะไม่เกิดขึ้นถ้า getOne ผ่าน แต่เช็คอีกรอบ
             throw new NotFoundException(`Session progress ${sessionProgressId} not found for image update.`);
        }
        // (Optional) อาจจะต้องมี Logic ลบรูปเก่าใน Azure Blob ก่อน ถ้า ResourceService.uploadSessionProgressImage ไม่ได้ทำ
        // if (existingProgress.image_url) {
        //    await this.resourceService.deleteResourceByUrl(existingProgress.image_url, 'session-progress-images'); // สมมติว่ามี Method นี้
        // }

        const uploadResult = await this.resourceService.uploadSessionProgressImage(
           imageFile,
           existingProgress.enrollment_id,
           existingProgress.session_number,
           actingUserId
        );
        imageUrlToUpdate = uploadResult.resourceUrl;
      } catch (uploadError) {
        this.logger.error(`Image upload failed for replacement on ${sessionProgressId}: ${uploadError.message}`, uploadError.stack);
        throw new InternalServerErrorException('Image replacement upload failed.');
      }
    }
    // ถ้า imageFile ไม่ได้ถูกส่งมา และ dto.imageUrl เป็น undefined หมายถึงไม่ต้องการเปลี่ยนรูป
    // ถ้า imageFile ไม่ได้ถูกส่งมา และ dto.imageUrl เป็น null หมายถึงต้องการลบรูป (จะถูกส่งไปใน dtoForService)

    const dtoForService: UpdateSessionProgressDto = {
        ...updateDto,
        imageUrl: imageUrlToUpdate,
    };

    return this.sessionProgressService.updateOneSessionProgress(sessionProgressId, dtoForService, actingUserId, actingUserType);
  }
  // --- END MODIFY ---
}