import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '../../../shared/config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService, parseDurationToMs } from './token.service';

describe('parseDurationToMs', () => {
  it.each([
    ['45s', 45_000],
    ['10m', 600_000],
    ['12h', 43_200_000],
    ['7d', 604_800_000],
  ])('parses %s → %i ms', (input, expected) => {
    expect(parseDurationToMs(input)).toBe(expected);
  });

  it('falls back to 7 days for unknown formats', () => {
    expect(parseDurationToMs('forever')).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe('TokenService', () => {
  const user = {
    sub: 'u1',
    email: 'a@b.com',
    role: 'customer' as const,
    nameEn: 'A',
    nameAr: 'أ',
    status: 'active' as const,
  };

  const prisma = {
    refreshToken: {
      create: jest.fn().mockResolvedValue({ id: 'rt1' }),
    },
  } as unknown as PrismaService;

  const jwt = {
    signAsync: jest.fn().mockResolvedValue('signed.token'),
  } as unknown as JwtService;

  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        'jwt.accessSecret': 'access-secret',
        'jwt.accessExpiresIn': '1h',
        'jwt.refreshSecret': 'refresh-secret',
        'jwt.refreshExpiresIn': '7d',
      };
      return values[key] ?? '7d';
    }),
  } as unknown as ConfigService<AppConfig, true>;

  const service = new TokenService(jwt, prisma, config);

  beforeEach(() => jest.clearAllMocks());

  it('issues an access + refresh pair and persists a hashed refresh token', async () => {
    const pair = await service.issueTokenPair(user);

    expect(pair.accessToken).toBe('signed.token');
    expect(pair.refreshToken).toBe('signed.token');
    // The stored hash must never be the raw token.
    const stored = (prisma.refreshToken.create as jest.Mock).mock.calls[0][0];
    expect(stored.data.tokenHash).not.toBe('signed.token');
    expect(stored.data.userId).toBe('u1');
  });

  it('hashes deterministically with sha256', () => {
    expect(service.hash('abc')).toBe(service.hash('abc'));
    expect(service.hash('abc')).not.toBe(service.hash('abd'));
  });
});
