/**
 * Interests DTO — records a customer interest event (recommendations.md).
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TrackInterestDto {
  @ApiProperty({
    description: 'Platform category name the customer interacted with',
    example: 'Electronics',
  })
  @IsString()
  @IsNotEmpty()
  categoryEn!: string;
}
