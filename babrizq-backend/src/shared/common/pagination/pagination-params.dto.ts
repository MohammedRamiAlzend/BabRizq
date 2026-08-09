/**
 * Reusable pagination query DTO.
 *
 * Extend this in list endpoints (e.g. `class ListOrdersDto extends
 * PaginationParamsDto`) so Swagger documents the common params once.
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @ApiPropertyOptional({ description: 'Order by column (whitelisted per endpoint)', example: 'createdAt' })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  orderDirection: 'asc' | 'desc' = 'desc';
}
