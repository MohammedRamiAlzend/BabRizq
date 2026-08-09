/**
 * Token service — issues access + refresh token pairs.
 *
 * Refresh tokens are stored **hashed** (sha256) with an expiry so they can be
 * rotated and revoked; the raw token is only ever handed to the client.
 */
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import { AppConfig } from '../../../shared/config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../../shared/common/types/authenticated-user';
import { AuthenticatedUser } from '../../../shared/common/types/authenticated-user';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /** Signs an access token from the authenticated user. */
  async signAccessToken(user: AuthenticatedUser): Promise<string> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.sub,
      email: user.email,
      role: user.role,
      nameEn: user.nameEn,
      nameAr: user.nameAr,
      status: user.status,
    };
    return this.jwtService.signAsync(payload, {
      secret: this.config.get('jwt.accessSecret', { infer: true }),
      expiresIn: this.config.get('jwt.accessExpiresIn', { infer: true }) as JwtSignOptions['expiresIn'],
    });
  }

  /** Issues a refresh token, persisting only its hash. */
  async createRefreshToken(userId: string): Promise<string> {
    const expiresIn = this.config.get('jwt.refreshExpiresIn', { infer: true });
    const raw = await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.config.get('jwt.refreshSecret', { infer: true }),
        expiresIn: expiresIn as JwtSignOptions['expiresIn'],
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(raw),
        expiresAt: new Date(Date.now() + parseDurationToMs(expiresIn)),
      },
    });
    return raw;
  }

  /** Issues a fresh token pair (used at login/register/refresh). */
  async issueTokenPair(user: AuthenticatedUser): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.createRefreshToken(user.sub),
    ]);
    return { accessToken, refreshToken };
  }

  /** Hashes a raw refresh token for storage/comparison. */
  hash(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}

/**
 * Converts a JWT-style duration (`45s`, `10m`, `12h`, `7d`) to milliseconds.
 * Falls back to 7 days for unknown units.
 */
export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(duration.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * multipliers[unit];
}
