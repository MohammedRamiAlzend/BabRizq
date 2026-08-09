/**
 * Delivery controller — the driver's orders, status actions, and
 * proof-of-delivery uploads. Every route requires the `delivery` role.
 */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../shared/common/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { DeliveryService } from '../application/delivery.service';
import {
  ListDeliveryOrdersQueryDto,
  UpdateDeliveryStatusDto,
} from './delivery.dto';

/** 10 MB cap for proof-of-delivery photos. */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@ApiTags('Delivery')
@ApiBearerAuth()
@Roles('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}

  @Get('orders')
  @ApiOperation({ summary: 'The driver orders (status-filterable: active / delivered / all)' })
  listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListDeliveryOrdersQueryDto,
  ) {
    return this.delivery.listOrders(user.sub, query.status);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Single order assigned to this driver' })
  getOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') orderId: string) {
    return this.delivery.getOrder(user.sub, orderId);
  }

  @Put('orders/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Advance the order status (forward only)' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') orderId: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.delivery.updateStatus(user.sub, orderId, dto.status);
  }

  @Put('orders/:id/proof')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload proof of delivery (multipart field "file")' })
  uploadProof(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') orderId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file || file.size === 0) {
      throw new BadRequestException('No file uploaded');
    }
    return this.delivery.uploadProof(user.sub, orderId, {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    });
  }
}
