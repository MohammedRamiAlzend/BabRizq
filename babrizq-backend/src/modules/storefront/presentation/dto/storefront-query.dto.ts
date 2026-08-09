/**
 * Storefront query DTOs — validated, whitelisted query params for the
 * catalog endpoints. `Transform` splits comma-separated list params.
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PaginationParamsDto } from '../../../../shared/common/pagination/pagination-params.dto';

/** Splits "a,b,c" into ['a','b','c'] (single value → single-element array). */
const toArray = ({ value }: { value: unknown }): string[] =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    : Array.isArray(value)
      ? value.map(String)
      : [];

export class ListProductsQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Full-text search on nameEn/nameAr' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Minimum price (SAR)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Maximum price (SAR)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Comma-separated store IDs', example: 'store-techzone' })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsString({ each: true })
  stores?: string[];

  @ApiPropertyOptional({ description: 'Comma-separated platform category names', example: 'Electronics,Watches' })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ description: 'Only products with an active discount', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onlyDiscounted?: boolean;

  @ApiPropertyOptional({ description: 'Only new arrivals', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onlyNew?: boolean;

  @ApiPropertyOptional({ description: 'Minimum rating (inclusive)', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['default', 'price-asc', 'price-desc', 'rating', 'newest'],
    default: 'default',
  })
  @IsOptional()
  @IsString()
  sortBy: 'default' | 'price-asc' | 'price-desc' | 'rating' | 'newest' = 'default';
}

export class LimitQueryDto {
  @ApiPropertyOptional({ description: 'Maximum results to return', default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 12;
}

/** GET /storefront/recommendations — the client passes interest categories. */
export class RecommendationsQueryDto extends LimitQueryDto {
  @ApiPropertyOptional({ description: 'Comma-separated category names, most recent first' })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}

export class CategoryCatalogQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Filter products by nameEn/nameAr' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class StoreProductsQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Filter products by nameEn/nameAr' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Store-specific sub-category ID' })
  @IsOptional()
  @IsString()
  storeCategoryId?: string;
}
