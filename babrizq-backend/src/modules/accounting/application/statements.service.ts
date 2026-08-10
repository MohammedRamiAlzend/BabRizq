/**
 * StatementsService — reads the ledger and produces the accountant-grade
 * reports (P1 scope): profit & loss (with prior-period comparison), trial
 * balance, general-ledger drill-down, and the journal audit trail.
 *
 * All statements are computed from posted journal lines, so they agree with
 * the books by construction. P2+ adds the balance sheet and cash flow.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveOwnedStore } from '../../store/application/store-context';
import { round2 } from './account-codes';

export interface PeriodInput {
  from: string;
  to: string;
}

@Injectable()
export class StatementsService {
  constructor(private readonly prisma: PrismaService) {}

  /** P&L: revenue − COGS − expenses, with Δ% vs the previous period. */
  async profitAndLoss(storeId: string, period: PeriodInput) {
    const from = new Date(period.from);
    const to = new Date(period.to);
    const spanMs = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(from.getTime() - spanMs);

    const current = await this.periodTotals(storeId, from, to);
    const previous = await this.periodTotals(storeId, prevFrom, prevTo);

    const revenue = current.revenue;
    const cogs = current.expenses['5100'] ?? 0;
    const grossProfit = round2(revenue - cogs);
    const operatingExpenses = round2(
      Object.entries(current.expenses)
        .filter(([code]) => code !== '5100')
        .reduce((sum, [, value]) => sum + value, 0),
    );
    const netProfit = round2(grossProfit - operatingExpenses);

    const prevNet = round2(
      (previous.revenue - (previous.expenses['5100'] ?? 0)) -
        Object.entries(previous.expenses)
          .filter(([code]) => code !== '5100')
          .reduce((sum, [, value]) => sum + value, 0),
    );

    return {
      from: period.from,
      to: period.to,
      revenue,
      cogs,
      grossProfit,
      operatingExpenses,
      netProfit,
      margin: revenue > 0 ? round2((netProfit / revenue) * 100) : 0,
      previous: {
        netProfit: round2(prevNet),
        changePercent: prevNet !== 0 ? round2(((netProfit - prevNet) / Math.abs(prevNet)) * 100) : 0,
      },
      expenseBreakdown: Object.entries(current.expenses)
        .sort((a, b) => b[1] - a[1])
        .map(([code, amount]) => ({
          code,
          amount,
          pctOfRevenue: revenue > 0 ? round2((amount / revenue) * 100) : 0,
        })),
    };
  }

  /** Trial balance: every account with its debit/credit totals (must balance). */
  async trialBalance(storeId: string, at?: string) {
    const accounts = await this.prisma.ledgerAccount.findMany({
      where: { storeId },
      orderBy: { code: 'asc' },
    });
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        entry: {
          storeId,
          ...(at ? { entryDate: { lte: new Date(at) } } : {}),
        },
      },
      select: { accountId: true, debit: true, credit: true },
    });

    const totals = new Map<string, { debit: number; credit: number }>();
    for (const line of lines) {
      const row = totals.get(line.accountId) ?? { debit: 0, credit: 0 };
      row.debit = round2(row.debit + line.debit);
      row.credit = round2(row.credit + line.credit);
      totals.set(line.accountId, row);
    }

    const rows = accounts.map((account) => {
      const row = totals.get(account.id) ?? { debit: 0, credit: 0 };
      return {
        accountId: account.id,
        code: account.code,
        nameEn: account.nameEn,
        nameAr: account.nameAr,
        type: account.type,
        openingBalance: account.openingBalance,
        debit: row.debit,
        credit: row.credit,
        balance: round2(
          account.openingBalance +
            (account.type === 'asset' || account.type === 'expense'
              ? row.debit - row.credit
              : row.credit - row.debit),
        ),
      };
    });

    const totalDebit = round2(rows.reduce((sum, r) => sum + r.debit, 0));
    const totalCredit = round2(rows.reduce((sum, r) => sum + r.credit, 0));
    return {
      asOf: at ?? new Date().toISOString(),
      rows,
      totalDebit,
      totalCredit,
      balanced: totalDebit === totalCredit,
    };
  }

  /** General-ledger drill-down for one account. */
  async ledger(
    storeId: string,
    accountId: string,
    period: PeriodInput,
  ) {
    const account = await this.prisma.ledgerAccount.findFirst({
      where: { id: accountId, storeId },
    });
    if (!account) return null;

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        accountId,
        entry: { storeId, entryDate: { gte: new Date(period.from), lte: new Date(period.to) } },
      },
      orderBy: { entry: { entryDate: 'asc' } },
      include: { entry: { select: { entryNumber: true, memoEn: true, memoAr: true, sourceType: true, entryDate: true } } },
    });

    let running = account.openingBalance;
    const entries = lines.map((line) => {
      running = round2(
        running +
          (account.type === 'asset' || account.type === 'expense'
            ? line.debit - line.credit
            : line.credit - line.debit),
      );
      return {
        entryNumber: line.entry.entryNumber,
        sourceType: line.entry.sourceType,
        date: line.entry.entryDate.toISOString(),
        memoEn: line.entry.memoEn,
        memoAr: line.entry.memoAr,
        debit: line.debit,
        credit: line.credit,
        balance: running,
      };
    });

    return {
      account: {
        id: account.id,
        code: account.code,
        nameEn: account.nameEn,
        nameAr: account.nameAr,
        type: account.type,
      },
      openingBalance: account.openingBalance,
      entries,
      closingBalance: entries.length > 0 ? entries[entries.length - 1].balance : account.openingBalance,
    };
  }

  /** Store-scoped summary: YTD revenue, expenses, profit, tax due, receivables. */
  async summary(ownerUserId: string, storeId: string | undefined) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const totals = await this.periodTotals(store.id, yearStart, now);
    const expenses = Object.values(totals.expenses).reduce((sum, value) => sum + value, 0);
    const netProfit = round2(totals.revenue - expenses);

    const [taxPayable, receivables, invoiceCount, expenseCount] = await this.prisma.$transaction([
      this.prisma.journalEntryLine.aggregate({
        where: { account: { storeId: store.id, code: '2300' } },
        _sum: { credit: true, debit: true },
      }),
      this.prisma.journalEntryLine.aggregate({
        where: {
          account: { storeId: store.id, code: { in: ['1300', '1400'] } },
        },
        _sum: { debit: true, credit: true },
      }),
      this.prisma.invoice.count({ where: { storeId: store.id } }),
      this.prisma.expense.count({ where: { storeId: store.id } }),
    ]);

    return {
      storeId: store.id,
      yearToDate: {
        revenue: totals.revenue,
        expenses: round2(expenses),
        netProfit,
        margin: totals.revenue > 0 ? round2((netProfit / totals.revenue) * 100) : 0,
      },
      taxPayable: round2((taxPayable._sum.credit ?? 0) - (taxPayable._sum.debit ?? 0)),
      receivables: round2((receivables._sum.debit ?? 0) - (receivables._sum.credit ?? 0)),
      invoiceCount,
      expenseCount,
    };
  }

  /** Store-scoped P&L (ownership-checked). */
  async pnlForStore(
    ownerUserId: string,
    storeId: string | undefined,
    period: PeriodInput,
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    return this.profitAndLoss(store.id, period);
  }

  /** Store-scoped trial balance (ownership-checked). */
  async trialBalanceForStore(
    ownerUserId: string,
    storeId: string | undefined,
    at?: string,
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    return this.trialBalance(store.id, at);
  }

  /** Store-scoped ledger drill-down (ownership-checked). */
  async ledgerForStore(
    ownerUserId: string,
    storeId: string | undefined,
    query: PeriodInput & { accountId: string },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    return this.ledger(store.id, query.accountId, query);
  }

  /** Store-scoped journal trail (ownership-checked). */
  async journalsForStore(
    ownerUserId: string,
    storeId: string | undefined,
    query: { page: number; pageSize: number; sourceType?: string },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    return this.journals(store.id, query);
  }

  /** Journal audit trail (paginated). */
  async journals(
    storeId: string,
    query: { page: number; pageSize: number; sourceType?: string },
  ) {
    const where: Prisma.JournalEntryWhereInput = {
      storeId,
      ...(query.sourceType ? { sourceType: query.sourceType } : {}),
    };
    const [total, entries] = await this.prisma.$transaction([
      this.prisma.journalEntry.count({ where }),
      this.prisma.journalEntry.findMany({
        where,
        orderBy: { entryDate: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          lines: {
            include: { account: { select: { code: true, nameEn: true, nameAr: true } } },
          },
        },
      }),
    ]);
    return {
      items: entries,
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  /** Reusable period totals grouped by expense code. */
  private async periodTotals(storeId: string, from: Date, to: Date) {
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        entry: { storeId, entryDate: { gte: from, lte: to } },
      },
      include: { account: { select: { code: true, type: true } } },
    });
    let revenue = 0;
    const expenses: Record<string, number> = {};
    for (const line of lines) {
      if (line.account.type === 'revenue') {
        revenue = round2(revenue + line.credit - line.debit);
      } else if (line.account.type === 'expense') {
        expenses[line.account.code] = round2(
          (expenses[line.account.code] ?? 0) + line.debit - line.credit,
        );
      }
    }
    return { revenue: round2(revenue), expenses };
  }
}
