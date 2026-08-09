/**
 * Store-owner request DTOs (products.md / orders.md / categories.md).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationParamsDto } from '../../../../shared/common/pagination/pagination-params.dto';
import { ORDER_STATUS_FLOW } from '../../../../shared/common/orders/order-status';

// ------------------------------------------------------------------
// Products
// ------------------------------------------------------------------

export class ListStoreProductsQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Filter by name (EN or AR)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by store-specific category UUID' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Premium Wireless Headphones' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nameEn!: string;

  @ApiProperty({ example: 'سماعات لاسلكية فاخرة' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nameAr!: string;

  @ApiProperty({ description: 'English description' })
  @IsString()
  @IsNotEmpty()
  descriptionEn!: string;

  @ApiProperty({ description: 'Arabic description' })
  @IsString()
  @IsNotEmpty()
  descriptionAr!: string;

  @ApiPropertyOptional({ description: 'Image URLs (upload via /files/upload first)' })
  @IsOptional()
  @IsArray()
  @IsUrl({ require_protocol: false }, { each: true })
  images?: string[];

  @ApiProperty({ description: 'Base price in SAR', minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ description: 'Initial stock quantity', minimum: 0 })
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiProperty({ description: 'Store-specific category UUID' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUrl({ require_protocol: false }, { each: true })
  images?: string[];

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;
}

// ------------------------------------------------------------------
// Orders
// ------------------------------------------------------------------

export class ListStoreOrdersQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Filter by order number or customer name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by order status', enum: ORDER_STATUS_FLOW })
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdvanceOrderStatusDto {
  @ApiProperty({ description: 'Next status in the flow', enum: ORDER_STATUS_FLOW.slice(1) })
  @IsString()
  @IsNotEmpty()
  status!: string;
}

// ------------------------------------------------------------------
// Categories
// ------------------------------------------------------------------

export class CreateCategoryDto {
  @ApiProperty({ example: 'Headphones' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nameEn!: string;

  @ApiProperty({ example: 'سماعات' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nameAr!: string;

  @ApiProperty({ description: 'Single emoji icon', example: '🎧' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4)
  iconOrEmoji!: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiPropertyOptional({ maxLength: 4 })
  @IsOptional()
  @IsString()
  @MaxLength(4)
  iconOrEmoji?: string;
}
