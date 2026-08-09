/**
 * Unit tests for InvoicesService — ZATCA Phase-1 QR payload structure and
 * the sequential invoice number generator.
 */
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../prisma/prisma.service';

const prisma = {} as unknown as PrismaService;
const service = new InvoicesService(prisma);

/** Walks the TLV buffer and returns `{ tag: string }[]` for assertion. */
function walkTlv(payload: string): { tag: number; value: string }[] {
  const buffer = Buffer.from(payload, 'base64');
  const fields: { tag: number; value: string }[] = [];
  let offset = 0;
  while (offset < buffer.length) {
    const tag = buffer[offset];
    const length = buffer[offset + 1];
    const value = buffer.subarray(offset + 2, offset + 2 + length).toString('utf8');
    fields.push({ tag, value });
    offset += 2 + length;
  }
  return fields;
}

describe('InvoicesService.buildQrPayload', () => {
  it('encodes the four ZATCA TLV fields (seller, VAT, timestamp, total)', () => {
    const payload = service.buildQrPayload({
      sellerName: 'TechZone',
      vatNumber: '310122393500003',
      totalWithVat: 702.7,
      timestamp: new Date('2026-04-06T10:00:00Z'),
    });

    const fields = walkTlv(payload);
    expect(fields).toHaveLength(4);
    expect(fields[0]).toEqual({ tag: 1, value: 'TechZone' });
    expect(fields[1]).toEqual({ tag: 2, value: '310122393500003' });
    expect(fields[2].tag).toBe(3);
    expect(fields[2].value).toContain('2026-04-06T10:00:00');
    expect(fields[3]).toEqual({ tag: 4, value: '702.70' });
  });
});

describe('InvoicesService.nextInvoiceNumber', () => {
  it('increments the last invoice number within the year', async () => {
    const tx = {
      invoice: {
        findFirst: jest.fn().mockResolvedValue({ invoiceNumber: 'INV-2026-0042' }),
      },
    };
    const local = new InvoicesService({} as unknown as PrismaService);
    const number = await local['nextInvoiceNumber']('store-1', tx as never);
    expect(number).toBe('INV-2026-0043');
  });

  it('starts at 1 when no invoices exist', async () => {
    const tx = {
      invoice: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const local = new InvoicesService({} as unknown as PrismaService);
    const number = await local['nextInvoiceNumber']('store-1', tx as never);
    expect(number).toMatch(/^INV-\d{4}-0001$/);
  });
});
