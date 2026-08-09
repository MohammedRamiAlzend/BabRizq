/**
 * OrderNumberService — issues human-readable order references `#BRQ-XXXX`.
 *
 * Derived from the highest existing order number (the seed ships `#BRQ-1042`,
 * so the first live order becomes `#BRQ-1043`). Kept in its own injectable so
 * the number generation can be unit-tested and swapped for a distributed
 * counter later.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Fallback when no orders exist yet — matches the seeded sequence. */
const SEED_BASE_NUMBER = 1042;

@Injectable()
export class OrderNumberService {
  constructor(private readonly prisma: PrismaService) {}

  async nextOrderNumber(): Promise<string> {
    const last = await this.prisma.order.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    const lastNumber = this.parseNumber(last?.orderNumber);
    return `#BRQ-${lastNumber + 1}`;
  }

  /** Extracts the numeric part from "#BRQ-1042" → 1042. */
  parseNumber(orderNumber?: string): number {
    if (!orderNumber) return SEED_BASE_NUMBER;
    const match = /(\d+)/.exec(orderNumber);
    const parsed = match ? Number(match[1]) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : SEED_BASE_NUMBER;
  }
}
