/**
 * Marketer request DTOs (links.md / overview.md / performance.md / settings.md).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PaginationParamsDto } from '../../../../shared/common/pagination/pagination-params.dto';

export class ListLinksQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ enum: ['all', 'store', 'product'], default: 'all' })
  @IsOptional()
  @IsIn(['all', 'store', 'product'])
  type?: 'all' | 'store' | 'product';
}

export class GenerateLinkDto {
  @ApiProperty({ description: 'Store or product id' })
  @IsString()
  @IsNotEmpty()
  targetId!: string;

  @ApiProperty({ enum: ['store', 'product'] })
  @IsIn(['store', 'product'])
  targetType!: 'store' | 'product';
}

export class WithdrawDto {
  @ApiProperty({ description: 'Amount to withdraw from the available balance' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ description: 'Required when payout method is bank' })
  @IsOptional()
  @IsString()
  bankIban?: string;

  @ApiPropertyOptional({ description: 'Required when payout method is wallet' })
  @IsOptional()
  @IsString()
  walletId?: string;
}

export class PerformanceQueryDto {
  @ApiPropertyOptional({ enum: ['weekly', 'monthly'], default: 'weekly' })
  @IsOptional()
  @IsIn(['weekly', 'monthly'])
  period: 'weekly' | 'monthly' = 'weekly';

  @ApiPropertyOptional({ description: 'Filter the analytics to one link' })
  @IsOptional()
  @IsString()
  linkId?: string;
}

export class MarketerNotificationsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  newConversion?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  payoutProcessed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  promotions?: boolean;
}

export class UpdateMarketerSettingsDto {
  @ApiPropertyOptional({ enum: ['bank', 'wallet'] })
  @IsOptional()
  @IsIn(['bank', 'wallet'])
  payoutMethod?: 'bank' | 'wallet';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankIban?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  walletId?: string;

  @ApiPropertyOptional({ type: () => MarketerNotificationsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MarketerNotificationsDto)
  notifications?: MarketerNotificationsDto;
}
