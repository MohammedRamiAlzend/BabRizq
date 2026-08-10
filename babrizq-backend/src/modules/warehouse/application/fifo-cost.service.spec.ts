/**
 * FIFO golden tests — the money-correctness gate from `plans/10` §2:
 * scripted purchase/sale sequences with expected COGS + margin outputs.
 */
import { FifoCostService } from './fifo-cost.service';

describe('FifoCostService.fifoCost', () => {
  it('consumes the oldest layer first (single layer)', () => {
    const result = FifoCostService.fifoCost([{ quantity: 10, unitCost: 100 }], 4);
    expect(result.cost).toBe(400);
    expect(result.uncovered).toBe(0);
    expect(result.consumed).toEqual([{ quantity: 4, unitCost: 100 }]);
  });

  it('spills into the next layer when the oldest is exhausted', () => {
    // Golden case 1: bought 10 @100, then 5 @120; sell 12 → 10×100 + 2×120.
    const result = FifoCostService.fifoCost(
      [
        { quantity: 10, unitCost: 100 },
        { quantity: 5, unitCost: 120 },
      ],
      12,
    );
    expect(result.cost).toBe(1000 + 240);
    expect(result.uncovered).toBe(0);
    expect(result.consumed).toEqual([
      { quantity: 10, unitCost: 100 },
      { quantity: 2, unitCost: 120 },
    ]);
  });

  it('reports uncovered units when layers run out (fallback proxy path)', () => {
    const result = FifoCostService.fifoCost([{ quantity: 3, unitCost: 100 }], 5);
    expect(result.cost).toBe(300);
    expect(result.uncovered).toBe(2);
  });

  it('handles a partial layer correctly with exact boundary', () => {
    // Golden case 2: buy 6 @50; sell exactly 6 → full layer gone, cost 300.
    const result = FifoCostService.fifoCost([{ quantity: 6, unitCost: 50 }], 6);
    expect(result.cost).toBe(300);
    expect(result.consumed).toEqual([{ quantity: 6, unitCost: 50 }]);
  });

  it('never consumes past the layers (defensive)', () => {
    const result = FifoCostService.fifoCost([], 4);
    expect(result.cost).toBe(0);
    expect(result.uncovered).toBe(4);
  });

  it('rounds cost to 2 decimals', () => {
    const result = FifoCostService.fifoCost(
      [{ quantity: 3, unitCost: 100.333 }],
      3,
    );
    expect(result.cost).toBe(301.0);
  });

  it('multi-layer golden sequence: 4 purchases + 3 sales with exact COGS', () => {
    // Purchases:  10 @ 90, 15 @ 100, 20 @ 110, 10 @ 105
    // Sales:      12, 25, 18  (in order)
    const layers = [
      { quantity: 10, unitCost: 90 },
      { quantity: 15, unitCost: 100 },
      { quantity: 20, unitCost: 110 },
      { quantity: 10, unitCost: 105 },
    ];

    // Sale 1: 12 → 10×90 + 2×100 = 1100
    const s1 = FifoCostService.fifoCost(layers, 12);
    expect(s1.cost).toBe(1100);
    expect(s1.uncovered).toBe(0);

    // Remaining: 13 @100, 20 @110, 10 @105
    // Sale 2: 25 → 13×100 + 12×110 = 2620
    const s2 = FifoCostService.fifoCost(
      [
        { quantity: 13, unitCost: 100 },
        { quantity: 20, unitCost: 110 },
        { quantity: 10, unitCost: 105 },
      ],
      25,
    );
    expect(s2.cost).toBe(13 * 100 + 12 * 110);
    expect(s2.uncovered).toBe(0);

    // Remaining: 8 @110, 10 @105
    // Sale 3: 18 → 8×110 + 10×105 = 1930
    const s3 = FifoCostService.fifoCost(
      [
        { quantity: 8, unitCost: 110 },
        { quantity: 10, unitCost: 105 },
      ],
      18,
    );
    expect(s3.cost).toBe(8 * 110 + 10 * 105);
    expect(s3.uncovered).toBe(0);
  });
});
