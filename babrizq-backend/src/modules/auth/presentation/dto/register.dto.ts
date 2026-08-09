import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { PUBLIC_REGISTRATION_ROLES } from '../../../../shared/common/roles';

export class RegisterDto {
  @ApiProperty({ example: 'customer@babrizq.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Sara Mansour' })
  @IsString()
  @IsNotEmpty()
  nameEn!: string;

  @ApiProperty({ example: 'سارة منصور' })
  @IsString()
  @IsNotEmpty()
  nameAr!: string;

  @ApiPropertyOptional({ example: '+966 50 000 0005' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: [...PUBLIC_REGISTRATION_ROLES], example: 'customer' })
  @IsIn([...PUBLIC_REGISTRATION_ROLES])
  role!: string;
}
