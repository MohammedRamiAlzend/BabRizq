/**
 * FIFO cost engine — the layer that turns stock receipts into real COGS.
 *
 * Inventory is tracked as cost layers (`InventoryBatch`, one per received
 * lot). When an order is placed, checkout consumes units oldest-first:
 * `cost = Σ taken × layer.unitCost`. This replaces the price-proxy COGS of
 * accounting P1 with actual purchase costs, so the ledger's gross profit is
 * real (per `plans/03` — "auto inventory value update (FIFO cost → feeds
 * accounting)").
 *
 * Pure math lives in the static `fifoCost` helper (unit-testable golden
 * cases); the service applies consumption atomically inside the caller's
 * transaction.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface FifoLayer {
  quantity: number;
  unitCost: number;
}

export interface FifoResult {
  /** Total cost of the consumed units (SAR, rounded). */
  cost: number;
  /** Units consumed from each layer, oldest-first. */
  consumed: { quantity: number; unitCost: number }[];
  /** Units that could not be covered by layers (no/insufficient stock). */
  uncovered: number;
}

/** Rounding helper for money (SAR): two decimals. */
const round2 = (value: number): number => Math.round(value * 100) / 100;

@Injectable()
export class FifoCostService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pure FIFO walk — consume `qty` units oldest-first across layers.
   * Kept static so the golden cases (plan QA gate §2) are plain unit tests.
   */
  static fifoCost(layers: FifoLayer[], qty: number): FifoResult {
    let remaining = qty;
    const consumed: { quantity: number; unitCost: number }[] = [];
    for (const layer of layers) {
      if (remaining <= 0) break;
      const taken = Math.min(layer.quantity, remaining);
      consumed.push({ quantity: taken, unitCost: layer.unitCost });
      remaining -= taken;
    }
    return {
      cost: round2(consumed.reduce((sum, c) => sum + c.quantity * c.unitCost, 0)),
      consumed,
      uncovered: Math.max(0, remaining),
    };
  }

  /**
   * Consumes `qty` units of a product FIFO inside `tx`: decrements (or
   * deletes) the oldest batches first and returns the real COGS.
   *
   * When a product has no batches yet (legacy data), falls back to
   * `product.cost ?? product.price` so COGS never zeroes out silently.
   */
  async consumeForOrder(
    productId: string,
    qty: number,
    tx: Prisma.TransactionClient,
  ): Promise<number> {
    if (qty <= 0) return 0;
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true, cost: true, price: true },
    });
    if (!product) return 0;

    const batches = await tx.inventoryBatch.findMany({
      where: { productId, quantity: { gt: 0 } },
      orderBy: [{ receivedAt: 'asc' }, { id: 'asc' }],
      select: { id: true, quantity: true, unitCost: true },
    });

    const { cost, consumed, uncovered } = FifoCostService.fifoCost(batches, qty);

    // Apply the consumption: decrement the layers in the same order we read.
    for (let i = 0; i < batches.length && i < consumed.length; i++) {
      const batch = batches[i];
      const taken = consumed[i].quantity;
      if (taken <= 0) continue;
      const remaining = batch.quantity - taken;
      if (remaining <= 0) {
        await tx.inventoryBatch.delete({ where: { id: batch.id } });
      } else {
        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: { quantity: remaining },
        });
      }
    }

    if (uncovered > 0) {
      // No layers (or not enough) — proxy at the recorded unit cost.
      return round2(cost + uncovered * (product.cost ?? product.price ?? 0));
    }
    return cost;
  }
}
