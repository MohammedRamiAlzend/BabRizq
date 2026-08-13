/**
 * Store-owner settings request DTOs (store-owner `settings.md`).
 *
 * The settings contract is a single flat object that the frontend patches
 * per tab (Store Info / Payment / Notifications / Shipping). `address` maps
 * onto the DB's bilingual `addressEn`/`addressAr` pair.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateStoreSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  storeNameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  storeNameAr?: string;

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
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional({ example: 'store@babrizq.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ type: [String], example: ['SAR', 'USD', 'AED'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acceptedCurrencies?: string[];

  @ApiPropertyOptional({ type: [String], example: ['cash', 'card', 'mada'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentMethods?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyNewOrder?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyLowStock?: boolean;

  @ApiPropertyOptional({ description: 'Alert when stock ≤ this value', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  freeShippingThreshold?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  estimatedDeliveryDays?: number;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password; must match the stored hash' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ description: 'New password; minimum 8 characters' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  newPassword!: string;

  @ApiProperty({ description: 'Must match newPassword' })
  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;
}
