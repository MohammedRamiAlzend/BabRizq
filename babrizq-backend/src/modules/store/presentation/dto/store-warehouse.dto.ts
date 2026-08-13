/**
 * Store-owner warehouse request DTOs (store-owner `warehouse.md`).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationParamsDto } from '../../../../shared/common/pagination/pagination-params.dto';

export class ListInventoryQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Filter by product name (EN or AR)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['all', 'low', 'out'], default: 'all' })
  @IsOptional()
  @IsIn(['all', 'low', 'out'])
  filter?: 'all' | 'low' | 'out';
}

export class AdjustInventoryDto {
  @ApiProperty({ description: 'Positive to add stock, negative to remove', example: 10 })
  @IsInt()
  delta!: number;

  @ApiPropertyOptional({ description: 'Optional reason / reference' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class CreateSupplierDto {
  @ApiProperty({ example: 'Al-Noor Electronics' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nameEn!: string;

  @ApiProperty({ example: 'شركة النور للإلكترونيات' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nameAr!: string;

  @ApiProperty({ example: 'Mohammed Al-Ghamdi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  contactName!: string;

  @ApiProperty({ example: '+966 55 111 2233' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone!: string;

  @ApiProperty({ example: 'contact@alnoor-elec.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Riyadh Industrial City' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  address!: string;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;
}
