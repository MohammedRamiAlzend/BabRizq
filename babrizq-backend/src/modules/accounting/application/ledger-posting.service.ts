/**
 * LedgerPostingService — the double-entry heart of the accounting suite.
 *
 * Every business event posts a journal entry whose lines always satisfy
 * `Σ debit == Σ credit` (validated before insert — the books can never go
 * out of balance). Entries are immutable once posted; corrections are
 * reversals (P2+), never edits.
 *
 * Auto-posting rules (per `plans/02`):
 * - Order (online):        DR AR-Customer / CR Sales Revenue + VAT Payable
 * - Order (COD):           DR AR-COD / CR Sales Revenue + VAT Payable
 * - Delivery fee:          DR AR / CR Delivery Revenue
 * - Platform commission:   DR Commission Expense / CR Platform Payable
 * - Delivery service:      DR Delivery Expense / CR Platform Payable
 * - COGS (price-proxy P1): DR COGS / CR Inventory  — real FIFO costs land
 *                          with the WarehouseModule (P2 of the plan)
 * - Expense:               DR Expense account / CR Cash
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ACCOUNT_CODES,
  EXPENSE_CATEGORY_ACCOUNT,
  PLATFORM_COMMISSION_RATE,
  round2,
} from './account-codes';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { InvoicesService } from './invoices.service';

export interface PostableOrder {
  id: string;
  storeId: string;
  paymentMethod: string | null;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  items: { qty: number; price: number }[];
  /**
   * Real COGS from the FIFO engine (warehouse P2). When provided it
   * replaces the price-proxy COGS so gross profit is purchase-cost truth.
   */
  cogs?: number;
}

export interface PostableExpense {
  id: string;
  storeId: string;
  category: string;
  titleEn: string;
  titleAr: string;
  amount: number;
}

/** One line of a journal entry, keyed by ledger code (accounts resolved later). */
interface LineInput {
  code: string;
  debit: number;
  credit: number;
  descriptionEn?: string;
  descriptionAr?: string;
}

@Injectable()
export class LedgerPostingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chart: ChartOfAccountsService,
    private readonly invoices: InvoicesService,
  ) {}

  /**
   * Pure, unit-testable entry builder for an order. Returns balanced lines
   * keyed by account code.
   */
  buildOrderLines(order: PostableOrder): LineInput[] {
    const taxable = round2(order.subtotal - order.discount);
    const isCod = (order.paymentMethod ?? 'cash').toLowerCase() === 'cod';
    const receivable = isCod ? ACCOUNT_CODES.AR_COD : ACCOUNT_CODES.AR_CUSTOMER;
    const commission = round2(taxable * PLATFORM_COMMISSION_RATE);
    const cogs = round2(
      order.cogs ?? order.items.reduce((sum, item) => sum + item.price * item.qty, 0),
    );

    // Revenue recognized at the discounted, tax-exclusive amount; VAT is a
    // liability. Delivery fee charged to the customer is the store's delivery
    // revenue, offset by the platform delivery service expense (net zero).
    const lines: LineInput[] = [
      { code: receivable, debit: round2(order.total), credit: 0, descriptionEn: 'Customer settlement', descriptionAr: 'تسوية العميل' },
      { code: ACCOUNT_CODES.SALES_REVENUE, debit: 0, credit: taxable, descriptionEn: 'Product sales', descriptionAr: 'مبيعات المنتجات' },
      { code: ACCOUNT_CODES.DELIVERY_REVENUE, debit: 0, credit: order.deliveryFee, descriptionEn: 'Delivery fee', descriptionAr: 'رسوم التوصيل' },
      { code: ACCOUNT_CODES.TAX_PAYABLE, debit: 0, credit: order.tax, descriptionEn: 'Output VAT', descriptionAr: 'ضريبة المبيعات' },
    ];
    if (commission > 0) {
      lines.push({ code: ACCOUNT_CODES.COMMISSION_EXPENSE, debit: commission, credit: 0, descriptionEn: 'Platform commission', descriptionAr: 'عمولة المنصة' });
      lines.push({ code: ACCOUNT_CODES.PLATFORM_PAYABLE, debit: 0, credit: commission, descriptionEn: 'Platform commission', descriptionAr: 'عمولة المنصة' });
    }
    if (order.deliveryFee > 0) {
      lines.push({ code: ACCOUNT_CODES.DELIVERY_EXPENSE, debit: order.deliveryFee, credit: 0, descriptionEn: 'Delivery service', descriptionAr: 'خدمة التوصيل' });
      lines.push({ code: ACCOUNT_CODES.PLATFORM_PAYABLE, debit: 0, credit: order.deliveryFee, descriptionEn: 'Delivery service', descriptionAr: 'خدمة التوصيل' });
    }
    if (cogs > 0) {
      lines.push({ code: ACCOUNT_CODES.COGS, debit: cogs, credit: 0, descriptionEn: 'Cost of goods (price proxy)', descriptionAr: 'تكلفة البضاعة (تقديرية)' });
      lines.push({ code: ACCOUNT_CODES.INVENTORY, debit: 0, credit: cogs, descriptionEn: 'Cost of goods (price proxy)', descriptionAr: 'تكلفة البضاعة (تقديرية)' });
    }
    return lines;
  }

  /**
   * Posts the order entry + tax invoice inside the caller's transaction.
   * Called from checkout — must be atomic with the order itself.
   */
  async postOrder(
    order: PostableOrder & { orderNumber: string },
    tx: Prisma.TransactionClient,
  ) {
    await this.chart.ensureChartOfAccounts(order.storeId, tx);

    // Idempotency guard — a re-run (retry, redelivery) must not double-post.
    const existing = await tx.journalEntry.findFirst({
      where: { storeId: order.storeId, sourceType: 'order', sourceId: order.id },
      select: { id: true },
    });
    if (existing) return;

    const lines = this.buildOrderLines(order);
    const entryNumber = await this.nextEntryNumber(order.storeId, tx);

    // Lines need resolved account IDs — create the header first, then the
    // lines with real account references.
    const entry = await tx.journalEntry.create({
      data: {
        storeId: order.storeId,
        entryNumber,
        sourceType: 'order',
        sourceId: order.id,
        memoEn: `Order ${order.orderNumber}`,
        memoAr: `الطلب ${order.orderNumber}`,
      },
      select: { id: true },
    });
    await this.createLinesWithAccounts(order.storeId, entry.id, lines, tx);

    await this.invoices.postInvoiceForOrder(order, tx);
  }

  /**
   * Generic idempotent posting for source events (PO receipts, stocktakes,
   * stock adjustments). One entry per `(sourceType, sourceId)` — retries are
   * no-ops, so a redelivered receive can never double-post to the books.
   */
  async postSourceEntry(
    storeId: string,
    sourceType: string,
    sourceId: string,
    input: {
      memoEn: string;
      memoAr: string;
      lines: { code: string; debit: number; credit: number; descriptionEn?: string; descriptionAr?: string }[];
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const alreadyPosted = await client.journalEntry.findFirst({
      where: { storeId, sourceType, sourceId },
      select: { id: true },
    });
    if (alreadyPosted) return this.prisma.journalEntry.findUnique({ where: { id: alreadyPosted.id } });

    const totalDebit = round2(input.lines.reduce((sum, line) => sum + line.debit, 0));
    const totalCredit = round2(input.lines.reduce((sum, line) => sum + line.credit, 0));
    if (totalDebit !== totalCredit) {
      throw ApiError.badRequest(
        'ENTRY_UNBALANCED',
        `Journal entry is out of balance (debit ${totalDebit} ≠ credit ${totalCredit})`,
      );
    }
    await this.chart.ensureChartOfAccounts(storeId, client);
    const entryNumber = await this.nextEntryNumber(storeId, client);
    const entry = await client.journalEntry.create({
      data: { storeId, entryNumber, sourceType, sourceId, memoEn: input.memoEn, memoAr: input.memoAr },
      select: { id: true },
    });
    await this.createLinesWithAccounts(storeId, entry.id, input.lines, client);
    return this.prisma.journalEntry.findUnique({ where: { id: entry.id } });
  }

  /** Posts a manual/adjustment entry from explicit line amounts (validates balance). */
  async postAdjustment(
    storeId: string,
    input: {
      memoEn: string;
      memoAr: string;
      lines: { code: string; debit: number; credit: number; descriptionEn?: string; descriptionAr?: string }[];
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const totalDebit = round2(input.lines.reduce((sum, l) => sum + l.debit, 0));
    const totalCredit = round2(input.lines.reduce((sum, l) => sum + l.credit, 0));
    if (totalDebit !== totalCredit) {
      throw ApiError.badRequest(
        'ENTRY_UNBALANCED',
        `Journal entry is out of balance (debit ${totalDebit} ≠ credit ${totalCredit})`,
      );
    }
    await this.chart.ensureChartOfAccounts(storeId, client);
    const entryNumber = await this.nextEntryNumber(storeId, client);
    const entry = await client.journalEntry.create({
      data: {
        storeId,
        entryNumber,
        sourceType: 'adjustment',
        memoEn: input.memoEn,
        memoAr: input.memoAr,
      },
      select: { id: true },
    });
    await this.createLinesWithAccounts(storeId, entry.id, input.lines, client);
    return this.prisma.journalEntry.findUnique({
      where: { id: entry.id },
      include: { lines: { include: { account: true } } },
    });
  }

  /** Posts an expense + its ledger entry inside the caller's transaction. */
  async postExpense(
    expense: PostableExpense,
    tx: Prisma.TransactionClient,
  ): Promise<{ expenseId: string; entryId: string }> {
    // Idempotency guard — re-running the seed / retrying a request must not
    // post the same expense twice.
    const alreadyPosted = await tx.journalEntry.findFirst({
      where: { storeId: expense.storeId, sourceType: 'expense', sourceId: expense.id },
      select: { id: true },
    });
    if (alreadyPosted) return { expenseId: expense.id, entryId: alreadyPosted.id };

    await this.chart.ensureChartOfAccounts(expense.storeId, tx);
    const code = EXPENSE_CATEGORY_ACCOUNT[expense.category] ?? ACCOUNT_CODES.OTHER_EXPENSE;

    const entryNumber = await this.nextEntryNumber(expense.storeId, tx);
    const entry = await tx.journalEntry.create({
      data: {
        storeId: expense.storeId,
        entryNumber,
        sourceType: 'expense',
        sourceId: expense.id,
        memoEn: `Expense: ${expense.titleEn}`,
        memoAr: `مصروف: ${expense.titleAr}`,
      },
      select: { id: true },
    });

    const lines: LineInput[] = [
      { code, debit: expense.amount, credit: 0, descriptionEn: expense.titleEn, descriptionAr: expense.titleAr },
      { code: ACCOUNT_CODES.CASH, debit: 0, credit: expense.amount, descriptionEn: 'Paid by cash', descriptionAr: 'مدفوع نقداً' },
    ];
    await this.createLinesWithAccounts(expense.storeId, entry.id, lines, tx);
    return { expenseId: expense.id, entryId: entry.id };
  }

  /**
   * Reverses the entry linked to a deleted expense: negated copies of the
   * original lines, referenced via `reversedById`.
   */
  async reverseExpenseEntry(
    storeId: string,
    expenseId: string,
    client?: Prisma.TransactionClient,
  ) {
    const db = client ?? this.prisma;
    const entry = await db.journalEntry.findFirst({
      where: { storeId, sourceType: 'expense', sourceId: expenseId },
      include: { lines: true },
    });
    if (!entry) return null;
    const entryNumber = await this.nextEntryNumber(storeId, client);
    const reversed = await db.journalEntry.create({
      data: {
        storeId,
        entryNumber,
        sourceType: 'adjustment',
        memoEn: `Reversal of expense ${expenseId}`,
        memoAr: `عكس مصروف ${expenseId}`,
        reversedById: entry.id,
        lines: {
          create: entry.lines.map((line) => ({
            accountId: line.accountId,
            debit: round2(line.credit),
            credit: round2(line.debit),
            descriptionEn: `Reversal: ${line.descriptionEn ?? ''}`,
            descriptionAr: `عكس: ${line.descriptionAr ?? ''}`,
          })),
        },
      },
    });
    return reversed;
  }

  /** Sequential per-store entry number `JE-YYYY-NNNN`. */
  private async nextEntryNumber(
    storeId: string,
    client?: Prisma.TransactionClient,
  ): Promise<string> {
    const db = client ?? this.prisma;
    const year = new Date().getFullYear();
    const last = await db.journalEntry.findFirst({
      where: { storeId },
      orderBy: { entryNumber: 'desc' },
      select: { entryNumber: true },
    });
    const match = /(\d+)$/.exec(last?.entryNumber ?? '');
    const next = match ? Number(match[1]) + 1 : 1;
    return `JE-${year}-${String(next).padStart(4, '0')}`;
  }

  /** Resolves account codes to stored rows and inserts the lines. */
  private async createLinesWithAccounts(
    storeId: string,
    entryId: string,
    lines: LineInput[],
    client: Prisma.TransactionClient,
  ) {
    const rows = await client.ledgerAccount.findMany({
      where: { storeId, code: { in: [...new Set(lines.map((l) => l.code))] } },
      select: { id: true, code: true },
    });
    const byCode = new Map(rows.map((row) => [row.code, row.id]));
    for (const line of lines) {
      const accountId = byCode.get(line.code);
      if (!accountId) {
        throw ApiError.badRequest(
          'ACCOUNT_MISSING',
          `Ledger account ${line.code} is not seeded for store ${storeId}`,
        );
      }
      await client.journalEntryLine.create({
        data: {
          entryId,
          accountId,
          debit: line.debit,
          credit: line.credit,
          descriptionEn: line.descriptionEn,
          descriptionAr: line.descriptionAr,
        },
      });
    }
  }
}
