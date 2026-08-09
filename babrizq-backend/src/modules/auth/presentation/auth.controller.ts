/**
 * Auth controller — public auth endpoints + authenticated `me`.
 */
import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../../shared/common/decorators/public.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { AuthService } from '../application/auth.service';
import { TokenPair } from '../application/token.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import {
  AccountSuspendedError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../domain/auth.errors';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email + password' })
  async login(@Body() dto: LoginDto): Promise<TokenPair> {
    try {
      // `await` is required so rejected domain errors are caught here and
      // mapped to proper HTTP statuses (instead of bubbling up as 500s).
      return await this.authService.login(dto);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a customer or store-owner account' })
  async register(@Body() dto: RegisterDto): Promise<TokenPair> {
    try {
      return await this.authService.register(dto);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the refresh token into a new token pair' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenPair> {
    try {
      return await this.authService.refresh(dto.refreshToken);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the refresh token' })
  async logout(@Body() dto: RefreshTokenDto): Promise<{ revoked: boolean }> {
    await this.authService.logout(dto.refreshToken);
    return { revoked: true };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current authenticated user (any role)' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.sub);
  }

  /** Maps domain errors to HTTP exceptions. */
  private mapError(error: unknown): Error {
    if (error instanceof InvalidCredentialsError || error instanceof InvalidRefreshTokenError) {
      return new UnauthorizedException(error.message);
    }
    if (error instanceof AccountSuspendedError) {
      return new ForbiddenException(error.message);
    }
    if (error instanceof EmailAlreadyRegisteredError) {
      return new ConflictException(error.message);
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
