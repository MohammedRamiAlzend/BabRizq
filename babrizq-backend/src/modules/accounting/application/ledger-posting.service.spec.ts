/**
 * Unit tests for LedgerPostingService — the double-entry rules that keep the
 * books in balance. Golden scenarios per the plan (`plans/02` §2).
 */
import { LedgerPostingService } from './ledger-posting.service';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ACCOUNT_CODES } from './account-codes';

const chart = {} as unknown as ChartOfAccountsService;
const invoices = {} as unknown as InvoicesService;
const prisma = {} as unknown as PrismaService;
const service = new LedgerPostingService(prisma, chart, invoices);

describe('LedgerPostingService.buildOrderLines', () => {
  const order = {
    id: 'order-1',
    storeId: 'store-techzone',
    paymentMethod: 'cash',
    subtotal: 598,
    discount: 0,
    deliveryFee: 15,
    tax: 89.7,
    total: 702.7,
    items: [{ qty: 2, price: 299 }],
  };

  it('always produces balanced lines (Σ debit = Σ credit)', () => {
    const lines = service.buildOrderLines(order);
    const debit = lines.reduce((sum, line) => sum + line.debit, 0);
    const credit = lines.reduce((sum, line) => sum + line.credit, 0);
    expect(debit).toBeCloseTo(credit, 2);
  });

  it('recognizes revenue at the discounted taxable amount with VAT as a liability', () => {
    const lines = service.buildOrderLines(order);
    const revenue = lines.find((line) => line.code === ACCOUNT_CODES.SALES_REVENUE);
    const tax = lines.find((line) => line.code === ACCOUNT_CODES.TAX_PAYABLE);
    expect(revenue?.credit).toBe(598);
    expect(tax?.credit).toBe(89.7);
  });

  it('posts the receivable to COD clearing for cash orders and AR for online', () => {
    const codLines = service.buildOrderLines({ ...order, paymentMethod: 'cod' });
    expect(codLines.some((line) => line.code === ACCOUNT_CODES.AR_COD && line.debit === 702.7)).toBe(true);

    const onlineLines = service.buildOrderLines({ ...order, paymentMethod: 'card' });
    expect(onlineLines.some((line) => line.code === ACCOUNT_CODES.AR_CUSTOMER && line.debit === 702.7)).toBe(true);
  });

  it('books platform commission and delivery service against the platform payable', () => {
    const lines = service.buildOrderLines(order);
    const commission = lines.find((line) => line.code === ACCOUNT_CODES.COMMISSION_EXPENSE);
    const payable = lines.filter((line) => line.code === ACCOUNT_CODES.PLATFORM_PAYABLE);
    expect(commission?.debit).toBeCloseTo(59.8, 2); // 10% of 598
    expect(payable.reduce((sum, line) => sum + line.credit, 0)).toBeCloseTo(59.8 + 15, 2);
  });

  it('books COGS and inventory reduction (price proxy until FIFO in P2)', () => {
    const lines = service.buildOrderLines(order);
    const cogs = lines.find((line) => line.code === ACCOUNT_CODES.COGS);
    const inventory = lines.find((line) => line.code === ACCOUNT_CODES.INVENTORY);
    expect(cogs?.debit).toBe(598);
    expect(inventory?.credit).toBe(598);
  });

  it('honors discounts in the taxable amount', () => {
    const discounted = service.buildOrderLines({ ...order, subtotal: 598, discount: 50, tax: 82.2 });
    const revenue = discounted.find((line) => line.code === ACCOUNT_CODES.SALES_REVENUE);
    expect(revenue?.credit).toBe(548);
  });
});
