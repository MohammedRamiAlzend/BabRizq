/**
 * Refresh token repository — persistence for hashed refresh tokens.
 */
import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByHash(tokenHash: string): Promise<(RefreshToken & { user: { id: string; status: string } }) | null> {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, status: true } } },
    });
  }

  revoke(id: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  /** Removes tokens that have expired or were revoked (housekeeping). */
  deleteExpired(now: Date): Promise<{ count: number }> {
    return this.prisma.refreshToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }] },
    });
  }
}
