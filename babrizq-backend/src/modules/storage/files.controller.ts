/**
 * Files controller — generic multipart upload for any authenticated role.
 * Domain modules will use `StorageService` directly for structured uploads
 * (product images, proof-of-delivery photos, avatars…).
 */
import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StorageService, StoredFile } from './storage.types';

/** 10 MB upload cap (memory storage is fine for product images). */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file (any authenticated role)' })
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('folder') folder?: string,
  ): Promise<StoredFile> {
    if (!file || file.size === 0) {
      throw new BadRequestException('No file uploaded');
    }
    return this.storage.save(
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
      folder || 'general',
    );
  }
}
