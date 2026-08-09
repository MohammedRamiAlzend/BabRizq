/**
 * Unit tests for the canonical order-status flow — forward-only transitions
 * with the documented error codes.
 */
import { ApiError } from '../errors/api-error';
import { assertForwardTransition, ORDER_STATUS_FLOW } from './order-status';

describe('ORDER_STATUS_FLOW', () => {
  it('defines the canonical 6-step lifecycle', () => {
    expect(ORDER_STATUS_FLOW).toEqual([
      'pending',
      'processing',
      'assigned',
      'picked_up',
      'in_transit',
      'delivered',
    ]);
  });
});

describe('assertForwardTransition', () => {
  it.each([
    ['pending', 'processing'],
    ['processing', 'assigned'],
    ['assigned', 'picked_up'],
    ['picked_up', 'in_transit'],
    ['in_transit', 'delivered'],
  ])('accepts %s → %s', (current, next) => {
    expect(() => assertForwardTransition(current, next)).not.toThrow();
  });

  it('rejects skipped steps with INVALID_STATUS_TRANSITION (422)', () => {
    try {
      assertForwardTransition('pending', 'delivered');
      fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe('INVALID_STATUS_TRANSITION');
      expect((error as ApiError).getStatus()).toBe(422);
    }
  });

  it('rejects backwards transitions', () => {
    expect(() => assertForwardTransition('delivered', 'in_transit')).toThrow(
      ApiError,
    );
  });

  it('rejects moves from an already-delivered order with ORDER_ALREADY_DELIVERED (409)', () => {
    try {
      assertForwardTransition('delivered', 'whatever');
      fail('should have thrown');
    } catch (error) {
      expect((error as ApiError).code).toBe('ORDER_ALREADY_DELIVERED');
      expect((error as ApiError).getStatus()).toBe(409);
    }
  });
});
