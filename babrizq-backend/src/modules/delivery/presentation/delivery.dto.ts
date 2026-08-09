/**
 * Delivery request DTOs (orders.md / order-detail.md).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ORDER_STATUS_FLOW } from '../../../shared/common/orders/order-status';

/** Splits "assigned,picked_up,in_transit" into an array. */
const toStatusArray = ({ value }: { value: unknown }): string[] =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    : [];

export class ListDeliveryOrdersQueryDto {
  @ApiPropertyOptional({
    description: 'Comma-separated status filter (e.g. assigned,picked_up,in_transit)',
  })
  @IsOptional()
  @Transform(toStatusArray)
  @IsArray()
  @IsString({ each: true })
  status?: string[];
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: ['picked_up', 'in_transit', 'delivered'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['picked_up', 'in_transit', 'delivered'])
  status!: 'picked_up' | 'in_transit' | 'delivered';
}

// Referenced for Swagger documentation of the valid flow.
export const DELIVERY_STATUS_OPTIONS = ORDER_STATUS_FLOW;
