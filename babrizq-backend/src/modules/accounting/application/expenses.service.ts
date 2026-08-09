/**
 * ExpensesService — expense capture for the store owner. Every expense posts
 * a balanced journal entry (DR expense account / CR cash) the moment it is
 * recorded; deleting an expense reverses the entry rather than editing it
 * (ledger rows are never hard-deleted — per `plans/02`).
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/common/errors/api-error';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveOwnedStore } from '../../store/application/store-context';
import { LedgerPostingService } from './ledger-posting.service';

export interface CreateExpenseInput {
  titleEn: string;
  titleAr: string;
  category: string;
  amount: number;
  expenseDate?: string;
  note?: string;
}

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posting: LedgerPostingService,
  ) {}

  /** Store-scoped create (ownership-checked). */
  async createExpenseForStore(
    ownerUserId: string,
    storeId: string | undefined,
    input: CreateExpenseInput,
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    return this.createExpense(store.id, input);
  }

  /** Store-scoped list (ownership-checked). */
  async listExpensesForStore(
    ownerUserId: string,
    storeId: string | undefined,
    query: { page: number; pageSize: number; category?: string },
  ) {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    return this.listExpenses(store.id, query);
  }

  /** Store-scoped delete (ownership-checked). */
  async deleteExpenseForStore(
    ownerUserId: string,
    storeId: string | undefined,
    expenseId: string,
  ): Promise<null> {
    const store = await resolveOwnedStore(this.prisma, ownerUserId, storeId);
    return this.deleteExpense(store.id, expenseId);
  }

  /** POST — create + post the journal entry atomically. */
  async createExpense(storeId: string, input: CreateExpenseInput) {
    const expense = await this.prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          storeId,
          titleEn: input.titleEn,
          titleAr: input.titleAr,
          category: input.category,
          amount: input.amount,
          expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
          note: input.note,
        },
      });
      await this.posting.postExpense(
        {
          id: created.id,
          storeId,
          category: created.category,
          titleEn: created.titleEn,
          titleAr: created.titleAr,
          amount: created.amount,
        },
        tx,
      );
      return created;
    });

    return this.toView(expense);
  }

  /** GET — paginated, filterable by category. */
  async listExpenses(
    storeId: string,
    query: { page: number; pageSize: number; category?: string },
  ) {
    const where: Prisma.ExpenseWhereInput = {
      storeId,
      ...(query.category ? { category: query.category } : {}),
    };
    const [total, expenses] = await this.prisma.$transaction([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        orderBy: { expenseDate: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      items: expenses.map((expense) => this.toView(expense)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  /** DELETE — reverse the posted entry, then remove the expense. */
  async deleteExpense(storeId: string, expenseId: string): Promise<null> {
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, storeId },
    });
    if (!expense) {
      throw ApiError.notFound('EXPENSE_NOT_FOUND', 'Expense not found');
    }
    await this.prisma.$transaction(async (tx) => {
      await this.posting.reverseExpenseEntry(storeId, expenseId, tx);
      await tx.expense.delete({ where: { id: expenseId } });
    });
    return null;
  }

  /** Maps the DB row to the frontend contract (`date`, not `expenseDate`). */
  private toView(expense: {
    id: string;
    titleEn: string;
    titleAr: string;
    category: string;
    amount: number;
    currency: string;
    expenseDate: Date;
    note: string | null;
  }) {
    return {
      id: expense.id,
      titleEn: expense.titleEn,
      titleAr: expense.titleAr,
      category: expense.category,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.expenseDate.toISOString(),
      note: expense.note,
    };
  }
}
