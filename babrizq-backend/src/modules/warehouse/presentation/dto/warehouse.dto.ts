/**
 * Warehouse request DTOs (per `plans/03` §8 — suppliers, purchase orders,
 * stock movements/stocktakes under `/api/store/*`).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationParamsDto } from '../../../../shared/common/pagination/pagination-params.dto';

// ------------------------------------------------------------------
// Suppliers
// ------------------------------------------------------------------

export class ListSuppliersQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Filter by name or contact' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateSupplierDto {
  @ApiProperty({ example: 'Al-Faisal Electronics Trading' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nameEn!: string;

  @ApiProperty({ example: 'مؤسسة الفيصل لتجارة الإلكترونيات' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nameAr!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ example: '+966 50 000 0011' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'sales@alfaisal.sa' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Expected delivery lead time in days' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  leadTimeDays?: number;
}

export class UpdateSupplierDto {
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
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  leadTimeDays?: number;
}

// ------------------------------------------------------------------
// Purchase orders
// ------------------------------------------------------------------

export class PurchaseOrderItemDto {
  @ApiProperty({ example: 'prod-headphones' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 190, description: 'Ordered unit cost (SAR)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost!: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 'sup-1' })
  @IsString()
  @IsNotEmpty()
  supplierId!: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  expectedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}

export class ListPurchaseOrdersQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ enum: ['draft', 'ordered', 'partial', 'received', 'cancelled'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class ReceivePurchaseOrderItemDto {
  @ApiProperty({ example: 'prod-headphones' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class ReceivePurchaseOrderDto {
  @ApiProperty({ type: [ReceivePurchaseOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseOrderItemDto)
  items!: ReceivePurchaseOrderItemDto[];
}

// ------------------------------------------------------------------
// Stock
// ------------------------------------------------------------------

export class AdjustStockDto {
  @ApiProperty({ example: 'prod-headphones' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ example: -3, description: 'Signed quantity: + in, − out' })
  @Type(() => Number)
  @IsInt()
  quantity!: number;

  @ApiPropertyOptional({ example: 'Damaged packaging found on shelf' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reasonAr?: string;
}

export class StocktakeItemDto {
  @ApiProperty({ example: 'prod-headphones' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ example: 42, description: 'Physical count' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  countedQuantity!: number;
}

export class CreateStocktakeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ type: [StocktakeItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StocktakeItemDto)
  items!: StocktakeItemDto[];
}
