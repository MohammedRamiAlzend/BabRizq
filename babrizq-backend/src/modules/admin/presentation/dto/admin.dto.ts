/**
 * Admin request DTOs (users.md / settings.md).
 *
 * `role` is validated in the service layer so the documented `INVALID_ROLE`
 * (422) code is produced; `status` is validated here with class-validator.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationParamsDto } from '../../../../shared/common/pagination/pagination-params.dto';

export class ListUsersQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Matches name (EN/AR) or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by platform role' })
  @IsOptional()
  @IsString()
  role?: string;
}

export class CreateUserDto {
  @ApiProperty({ description: 'English display name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: 'Arabic display name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nameAr!: string;

  @ApiProperty({ example: 'user@babrizq.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Platform role',
    example: 'store_owner',
  })
  @IsString()
  @IsNotEmpty()
  role!: string;

  @ApiPropertyOptional({
    description:
      'Initial password (min 8 chars). Omitted → a temporary password is generated and returned once.',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'marketer' })
  @IsString()
  @IsNotEmpty()
  role!: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: ['active', 'suspended'] })
  @IsIn(['active', 'suspended'])
  status!: 'active' | 'suspended';
}

export class UpdateMeDto {
  @ApiPropertyOptional({ description: 'English display name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ description: 'Arabic display name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nameAr?: string;

  @ApiPropertyOptional({ example: 'admin@babrizq.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password (verified first)' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ description: 'New password (min 8 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;

  @ApiProperty({ description: 'Must equal newPassword' })
  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;
}

export class UpdatePlatformSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  platformName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @ApiPropertyOptional({ example: 'SAR' })
  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  @ApiPropertyOptional({
    description: 'Platform commission rate (0–100 %)',
    example: 5.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;
}
