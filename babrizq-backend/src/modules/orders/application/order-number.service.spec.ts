/**
 * Unit tests for OrderNumberService — number parsing and sequence bumps.
 */
import { OrderNumberService } from './order-number.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('OrderNumberService', () => {
  const prisma = {
    order: { findFirst: jest.fn() },
  } as unknown as PrismaService;

  const service = new OrderNumberService(prisma);

  beforeEach(() => jest.clearAllMocks());

  describe('parseNumber', () => {
    it('extracts the numeric part of an order number', () => {
      expect(service.parseNumber('#BRQ-1042')).toBe(1042);
      expect(service.parseNumber('#BRQ-1042')).toBe(1042);
      expect(service.parseNumber('BRQ-999')).toBe(999);
    });

    it('falls back to the seed base for garbage or missing input', () => {
      expect(service.parseNumber()).toBe(1042);
      expect(service.parseNumber('nope')).toBe(1042);
      expect(service.parseNumber('#BRQ-0')).toBe(1042);
    });
  });

  describe('nextOrderNumber', () => {
    it('increments the highest existing order number', async () => {
      (prisma.order.findFirst as jest.Mock).mockResolvedValue({
        orderNumber: '#BRQ-1042',
      });
      await expect(service.nextOrderNumber()).resolves.toBe('#BRQ-1043');
    });

    it('starts at #BRQ-1043 when no orders exist', async () => {
      (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(service.nextOrderNumber()).resolves.toBe('#BRQ-1043');
    });
  });
});
