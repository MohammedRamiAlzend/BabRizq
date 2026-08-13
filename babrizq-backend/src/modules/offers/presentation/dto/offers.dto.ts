/**
 * Offers request DTOs — the store-owner promotions contract
 * (`store-owner/offers.md`).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationParamsDto } from '../../../../shared/common/pagination/pagination-params.dto';

export class CreateOfferDto {
  @ApiProperty({ example: 'TechZone Storewide -10%' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nameEn!: string;

  @ApiProperty({ example: 'تخفيض 10% على كل المنتجات' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nameAr!: string;

  @ApiPropertyOptional({
    description: 'Target product UUID; omit for a store-wide offer',
    example: 'prod-headphones',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  productId?: string;

  @ApiProperty({ enum: ['percent', 'fixed'], example: 'percent' })
  @IsString()
  @IsIn(['percent', 'fixed'])
  discountType!: 'percent' | 'fixed';

  @ApiProperty({ description: 'Percent (1–100) or fixed SAR amount', example: 10 })
  @IsNumber()
  @Min(0.01)
  @Max(10000)
  discountValue!: number;

  @ApiPropertyOptional({ description: 'ISO date-time the offer starts', example: '2026-08-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'ISO date-time the offer ends', example: '2026-09-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class UpdateOfferDto {
  @ApiPropertyOptional({ example: 'TechZone Storewide -15%' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nameEn?: string;

  @ApiPropertyOptional({ example: 'تخفيض 15% على كل المنتجات' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nameAr?: string;

  @ApiPropertyOptional({ description: 'Target product UUID; omit for a store-wide offer' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  productId?: string;

  @ApiPropertyOptional({ enum: ['percent', 'fixed'] })
  @IsOptional()
  @IsString()
  @IsIn(['percent', 'fixed'])
  discountType?: 'percent' | 'fixed';

  @ApiPropertyOptional({ description: 'Percent (1–100) or fixed SAR amount' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(10000)
  discountValue?: number;

  @ApiPropertyOptional({ description: 'ISO date-time the offer starts' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'ISO date-time the offer ends' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class ListOffersQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ enum: ['active', 'paused', 'expired'], description: 'Filter by status' })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'paused', 'expired'])
  status?: string;
}

export class OfferStatsParamsDto {
  @ApiProperty({ description: 'Offer UUID' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}

export class SetOfferStatusParamsDto {
  @ApiProperty({ description: 'Offer UUID' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}

export class ToggleOfferDto {
  @ApiProperty({ example: true })
  @IsNotEmpty()
  isActive!: boolean;
}
