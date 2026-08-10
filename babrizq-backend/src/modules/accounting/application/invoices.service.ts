/**
 * InvoicesService — ZATCA-shaped tax invoices, generated automatically at
 * checkout (P1 of the accounting plan). The QR payload follows the ZATCA
 * Phase-1 TLV layout (seller, VAT number, timestamp, total); the PNG QR
 * rendering is deferred to P3 (`ZatcaInvoiceProvider` interface in the plan).
 */
import { Injectable } from '@nestjs/common';
import { Invoice, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveOwnedStore } from '../../store/application/store-context';
import { round2 } from './account-codes';

export interface InvoiceForOrder {
  id: string;
  storeId: string;
  orderNumber: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

/** ZATCA TLV tag IDs for the simplified tax invoice QR. */
const TLV_TAGS = {
  SELLER_NAME: 1,
  VAT_NUMBER: 2,
  TIMESTAMP: 3,
  TOTAL_WITH_VAT: 4,
} as const;

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates the tax invoice inside the checkout transaction (idempotent). */
  async postInvoiceForOrder(
    order: InvoiceForOrder,
    tx: Prisma.TransactionClient,
  ) {
    const existing = await tx.invoice.findUnique({ where: { orderId: order.id } });
    if (existing) return existing;

    const settings = await tx.storeSettings.findUnique({
      where: { storeId: order.storeId },
      select: { contactEmail: true },
    });
    const store = await tx.store.findUnique({
      where: { id: order.storeId },
      select: { nameEn: true },
    });

    const invoiceNumber = await this.nextInvoiceNumber(order.storeId, tx);
    const qrPayload = this.buildQrPayload({
      sellerName: store?.nameEn ?? 'Bab Rizq Store',
      vatNumber: settings?.contactEmail ?? '',
      totalWithVat: order.total,
    });

    return tx.invoice.create({
      data: {
        storeId: order.storeId,
        orderId: order.id,
        invoiceNumber,
        subtotal: round2(order.subtotal),
        discount: round2(order.discount),
        tax: round2(order.tax),
        total: round2(order.total),
        currency: 'SAR',
        qrCode: qrPayload,
      },
    });
  }

  /** Store-scoped invoice list (ownership-checked). */
  async listInvoicesForStore(
    ownerUserId: string,
    storeId: string | undefined,
    query: { page: number; pageSize: number },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    return this.listInvoices(store.id, query);
  }

  /** Lists invoices with their orders, newest first (paginated envelope). */
  async listInvoices(storeId: string, query: { page: number; pageSize: number }) {
    const where = { storeId };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        orderBy: { issueDate: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          order: {
            select: {
              orderNumber: true,
              customerNameEn: true,
              customerNameAr: true,
              items: true,
            },
          },
        },
      }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  /** Builds the ZATCA Phase-1 TLV payload (base64 — QR image in P3). */
  buildQrPayload(input: {
    sellerName: string;
    vatNumber: string;
    totalWithVat: number;
    timestamp?: Date;
  }): string {
    const timestamp = input.timestamp ?? new Date();
    const fields: { tag: number; value: string }[] = [
      { tag: TLV_TAGS.SELLER_NAME, value: input.sellerName },
      { tag: TLV_TAGS.VAT_NUMBER, value: input.vatNumber },
      { tag: TLV_TAGS.TIMESTAMP, value: timestamp.toISOString() },
      { tag: TLV_TAGS.TOTAL_WITH_VAT, value: round2(input.totalWithVat).toFixed(2) },
    ];
    const tlv = fields
      .map((field) => {
        const tag = Buffer.from([field.tag]);
        const bytes = Buffer.from(field.value, 'utf8');
        const length = Buffer.alloc(1);
        length.writeUInt8(bytes.length);
        return Buffer.concat([tag, length, bytes]);
      })
      .reduce((acc, chunk) => Buffer.concat([acc, chunk]), Buffer.alloc(0));
    return tlv.toString('base64');
  }

  /** Sequential invoice number `INV-YYYY-NNNN` (matches the seeded style). */
  private async nextInvoiceNumber(
    storeId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const last = await tx.invoice.findFirst({
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });
    const match = /(\d+)$/.exec(last?.invoiceNumber ?? '');
    const next = match ? Number(match[1]) + 1 : 1;
    return `INV-${year}-${String(next).padStart(4, '0')}`;
  }
}
