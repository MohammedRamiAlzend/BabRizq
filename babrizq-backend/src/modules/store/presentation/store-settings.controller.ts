/**
 * Store-settings controller — `/api/store/settings` (store-owner settings.md).
 * Same guard contract as the rest of the store module: `store_owner` role +
 * an owned `X-Store-Id` header.
 */
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { StoreSettingsService } from '../application/store-settings.service';
import {
  ChangePasswordDto,
  UpdateStoreSettingsDto,
} from './dto/store-settings.dto';

/** 10 MB cap for logo / cover uploads (memory storage is fine). */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@ApiTags('Store Owner Settings')
@ApiBearerAuth()
@ApiHeader({ name: 'x-store-id', required: true, description: 'UUID of the authenticated store' })
@Roles('store_owner')
@Controller('store/settings')
export class StoreSettingsController {
  constructor(private readonly settings: StoreSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get the store settings (merged Store + StoreSettings view)' })
  getSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
  ) {
    return this.settings.getSettings(user.sub, storeId);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update store settings (partial, any tab)' })
  updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: UpdateStoreSettingsDto,
  ) {
    return this.settings.updateSettings(user.sub, storeId, dto);
  }

  @Put('logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new store logo (returns the URL to persist via PUT /settings)' })
  uploadLogo(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.settings.uploadImage(user.sub, storeId, file);
  }

  @Put('cover')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new store cover image (returns the URL to persist via PUT /settings)' })
  uploadCover(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.settings.uploadImage(user.sub, storeId, file);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change the store owner account password' })
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-store-id') storeId: string | undefined,
    @Body() dto: ChangePasswordDto,
  ): Promise<null> {
    return this.settings.changePassword(user.sub, storeId, dto);
  }
}
