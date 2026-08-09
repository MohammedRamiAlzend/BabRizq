/**
 * Auth controller — public auth endpoints + authenticated `me`.
 *
 * Google login is exposed two ways:
 *   - POST /auth/google/token        — SPA flow (verify a Google id_token)
 *   - GET  /auth/google              — redirect flow (Google consent screen)
 *   - GET  /auth/google/callback     — redirect flow (code exchange → frontend)
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
  Query,
  Redirect,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../shared/common/decorators/public.decorator';
import { SkipApiResponse } from '../../../shared/common/decorators/skip-api-response.decorator';
import { CurrentUser } from '../../../shared/common/decorators/current-user.decorator';
import { AppConfig } from '../../../shared/config/configuration';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';
import { AuthService } from '../application/auth.service';
import { TokenPair } from '../application/token.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import {
  AccountSuspendedError,
  EmailAlreadyRegisteredError,
  GoogleAuthError,
  GoogleAuthNotConfiguredError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../domain/auth.errors';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

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

  // -------------------------------------------------------------------
  // Google login
  // -------------------------------------------------------------------

  @Public()
  @Post('google/token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with Google (SPA id_token flow)' })
  async googleToken(@Body() dto: GoogleLoginDto): Promise<TokenPair> {
    try {
      return await this.authService.loginWithGoogleIdToken(dto.idToken);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Public()
  @Get('google')
  @SkipApiResponse()
  @Redirect(undefined, HttpStatus.FOUND)
  @ApiOperation({ summary: 'Start Google login (redirect to consent screen)' })
  googleStart(@Query('state') state?: string): { url: string; statusCode: number } {
    const url = this.authService.getGoogleAuthorizationUrl(state);
    return { url, statusCode: HttpStatus.FOUND };
  }

  @Public()
  @Get('google/callback')
  @SkipApiResponse()
  @Redirect(undefined, HttpStatus.FOUND)
  @ApiOperation({
    summary: 'Google OAuth callback — exchanges the code and redirects to the frontend with tokens',
  })
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state?: string,
  ): Promise<{ url: string; statusCode: number }> {
    if (!code) {
      throw new UnauthorizedException('Missing Google authorization code');
    }
    const pair = await this.authService.loginWithGoogleAuthorizationCode(code);
    return {
      url: this.buildFrontendRedirect(pair, state),
      statusCode: HttpStatus.FOUND,
    };
  }

  /** Sends the fresh token pair back to the SPA (query params — the SPA
   *  should swap them into storage and strip them from the URL). */
  private buildFrontendRedirect(pair: TokenPair, state?: string): string {
    const base = this.config.get('googleOAuth.frontendRedirectUrl', {
      infer: true,
    });
    const params = new URLSearchParams({
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
    });
    if (state) params.set('state', state);
    return `${base}?${params.toString()}`;
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current authenticated user (any role)' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.sub);
  }

  /** Maps domain errors to HTTP exceptions. */
  private mapError(error: unknown): Error {
    if (
      error instanceof InvalidCredentialsError ||
      error instanceof InvalidRefreshTokenError ||
      error instanceof GoogleAuthError
    ) {
      return new UnauthorizedException(error.message);
    }
    if (error instanceof GoogleAuthNotConfiguredError) {
      return new ServiceUnavailableException(error.message);
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
