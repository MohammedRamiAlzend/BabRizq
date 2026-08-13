/**
 * Sales + reports request DTOs (store-owner `sales.md` / `reports.md`).
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { PaginationParamsDto } from '../../../../shared/common/pagination/pagination-params.dto';

export class ListSalesQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Filter by order number or customer name (EN/AR)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'ISO 4217 currency code', example: 'SAR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Minimum order total' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum order total' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Start of date range (YYYY-MM-DD)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fromDate must be YYYY-MM-DD' })
  fromDate?: string;

  @ApiPropertyOptional({ description: 'End of date range (YYYY-MM-DD)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'toDate must be YYYY-MM-DD' })
  toDate?: string;
}

export class ExportSalesQueryDto extends ListSalesQueryDto {
  @ApiPropertyOptional({ enum: ['csv', 'xlsx'], default: 'csv' })
  @IsOptional()
  @IsIn(['csv', 'xlsx'])
  format: 'csv' | 'xlsx' = 'csv';
}

export class SalesReportQueryDto {
  @ApiPropertyOptional({ enum: ['weekly', 'monthly'], default: 'monthly' })
  @IsOptional()
  @IsIn(['weekly', 'monthly'])
  period: 'weekly' | 'monthly' = 'monthly';
}

export class ProductsReportQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Minimum units sold (int)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minSold?: number;
}
