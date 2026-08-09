/**
 * Notifications request DTOs — the in-app notification contract shared by
 * every role app (`notifications` bell in each app header).
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationParamsDto } from '../../../../shared/common/pagination/pagination-params.dto';

export class ListNotificationsQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Only unread notifications', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unreadOnly?: boolean;
}
