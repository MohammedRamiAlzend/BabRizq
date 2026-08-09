/**
 * Orders DTOs — checkout request + order-history query (customer `checkout.md`).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationParamsDto } from '../../../../shared/common/pagination/pagination-params.dto';

export class CreateOrderDto {
  @ApiProperty({ description: "Customer's full name", example: 'Sara Mansour' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ description: 'Valid phone number', example: '+966 50 000 0005' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9\s\-()]{8,20}$/, {
    message: 'phone must be a valid phone number',
  })
  phone!: string;

  @ApiProperty({ description: 'Complete delivery address', example: '45 King Fahd Rd, Riyadh' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  deliveryAddress!: string;

  @ApiPropertyOptional({ description: 'Payment method', enum: ['cash', 'card', 'mada'], default: 'cash' })
  @IsOptional()
  @IsString()
  @IsIn(['cash', 'card', 'mada'])
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Delivery instructions / order notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ListOrdersQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    example: 'pending',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
