/**
 * Payload for the SPA Google login flow — the id_token (JWT) obtained from
 * Google Identity Services (`google.accounts.id` → `credential`).
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google id_token (JWT) from Google Identity Services',
    example: 'eyJhbGciOi...',
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
