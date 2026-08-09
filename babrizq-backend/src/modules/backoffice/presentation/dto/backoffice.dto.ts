/**
 * Back-office request DTOs (orders.md / drivers.md).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationParamsDto } from '../../../../shared/common/pagination/pagination-params.dto';
import { ORDER_STATUS_FLOW } from '../../../../shared/common/orders/order-status';

export class ListBackofficeOrdersQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({
    description: 'Filter by order number, customer name, or store name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by order status', enum: ORDER_STATUS_FLOW })
  @IsOptional()
  @IsString()
  status?: string;
}

export class AssignDriverDto {
  @ApiProperty({ description: 'UUID of the driver to assign (must be available)' })
  @IsString()
  @IsNotEmpty()
  driverId!: string;
}

export class UpdateDriverAvailabilityDto {
  @ApiProperty({ description: 'true = available, false = busy' })
  @IsBoolean()
  available!: boolean;
}
