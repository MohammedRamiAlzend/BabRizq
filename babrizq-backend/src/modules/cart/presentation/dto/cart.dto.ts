/**
 * Cart request DTOs — match the customer `cart.md` contract.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ description: 'Product UUID to add', example: 'prod-headphones' })
  @IsString()
  @IsNotEmpty()
  productId!: string;
}

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'New quantity; 0 or less removes the item',
    example: 2,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @Max(999)
  quantity!: number;
}
