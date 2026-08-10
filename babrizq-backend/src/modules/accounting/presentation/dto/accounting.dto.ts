/**
 * Accounting request DTOs — store-owner accounting suite (P1).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationParamsDto } from '../../../../shared/common/pagination/pagination-params.dto';

/** Expense categories (frontend contract from the store-owner app). */
export const EXPENSE_CATEGORIES = [
  'rent',
  'salary',
  'marketing',
  'shipping',
  'utilities',
  'other',
] as const;

export class CreateExpenseDto {
  @ApiProperty({ example: 'Store Rent' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  titleEn!: string;

  @ApiProperty({ example: 'إيجار المستودع' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  titleAr!: string;

  @ApiProperty({ enum: EXPENSE_CATEGORIES, example: 'rent' })
  @IsIn(EXPENSE_CATEGORIES)
  category!: (typeof EXPENSE_CATEGORIES)[number];

  @ApiProperty({ minimum: 0, example: 3500 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ description: 'ISO date; defaults to now', example: '2026-04-01' })
  @IsOptional()
  @IsString()
  expenseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ListExpensesQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ enum: EXPENSE_CATEGORIES })
  @IsOptional()
  @IsIn(EXPENSE_CATEGORIES)
  category?: (typeof EXPENSE_CATEGORIES)[number];
}

export class PeriodQueryDto {
  @ApiProperty({ example: '2026-01-01' })
  @IsString()
  @IsNotEmpty()
  from!: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsString()
  @IsNotEmpty()
  to!: string;
}

export class TrialBalanceQueryDto {
  @ApiPropertyOptional({ description: 'ISO date; defaults to now' })
  @IsOptional()
  @IsString()
  at?: string;
}

export class LedgerQueryDto extends PeriodQueryDto {
  @ApiProperty({ description: 'Ledger account UUID' })
  @IsString()
  @IsNotEmpty()
  accountId!: string;
}

export class JournalQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Filter by source type', example: 'order' })
  @IsOptional()
  @IsString()
  sourceType?: string;
}
