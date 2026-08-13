/**
 * Accounting request DTOs — created manually in the controller file's module
 * when they are controller-specific; shared shapes live here.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ManualInvoiceItemDto {
  @ApiProperty({ example: 'Wireless Mouse' })
  @IsString()
  @IsNotEmpty()
  nameEn!: string;

  @ApiProperty({ example: 'ماوس لاسلكي' })
  @IsString()
  @IsNotEmpty()
  nameAr!: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  qty!: number;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  price!: number;
}

export class CreateManualInvoiceDto {
  @ApiProperty({ description: 'UUID of the linked order' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({ example: '#BRQ-1042' })
  @IsString()
  @IsNotEmpty()
  orderNumber!: string;

  @ApiProperty({ example: 'Ahmed Al-Farsi' })
  @IsString()
  @IsNotEmpty()
  customerNameEn!: string;

  @ApiProperty({ example: 'أحمد الفارسي' })
  @IsString()
  @IsNotEmpty()
  customerNameAr!: string;

  @ApiProperty({ type: [ManualInvoiceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ManualInvoiceItemDto)
  items!: ManualInvoiceItemDto[];

  @ApiProperty({ example: 520.0 })
  @IsNumber()
  subtotal!: number;

  @ApiProperty({ example: 25.0 })
  @IsNumber()
  discount!: number;

  @ApiProperty({ example: 29.7 })
  @IsNumber()
  tax!: number;

  @ApiProperty({ example: 524.7 })
  @IsNumber()
  total!: number;

  @ApiProperty({ example: 'SAR' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({ example: '2026-04-06' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date!: string;

  @ApiProperty({ enum: ['paid', 'unpaid', 'cancelled'] })
  @IsIn(['paid', 'unpaid', 'cancelled'])
  status!: 'paid' | 'unpaid' | 'cancelled';
}
