/**
 * Unit tests for the accounting mock API (`./api.ts`).
 * Pins the invoice math invariant (subtotal − discount + tax = total) that the
 * Accounting page displays.
 */
import { describe, it, expect } from 'vitest';
import { STORE_EXPENSES, STORE_INVOICES, getExpenses, getInvoices, createExpense } from './api';

describe('store-owner accounting mock API', () => {
  it('exposes non-empty expenses and invoices', () => {
    expect(STORE_EXPENSES.length).toBeGreaterThan(0);
    expect(STORE_INVOICES.length).toBeGreaterThan(0);
  });

  it('every invoice satisfies subtotal - discount + tax = total', () => {
    for (const inv of STORE_INVOICES) {
      expect(inv.subtotal - inv.discount + inv.tax).toBeCloseTo(inv.total, 2);
    }
  });

  it('getExpenses and getInvoices resolve the seed data', async () => {
    expect(await getExpenses()).toEqual(STORE_EXPENSES);
    expect(await getInvoices()).toEqual(STORE_INVOICES);
  });

  it('createExpense appends an expense with a fresh id', async () => {
    const before = STORE_EXPENSES.length;
    const expense = await createExpense({
      titleEn: 'Test', titleAr: 'اختبار', category: 'other',
      amount: 50, currency: 'SAR', date: '2026-04-10',
    });
    expect(STORE_EXPENSES.length).toBe(before + 1);
    expect(STORE_EXPENSES.some(e => e.id === expense.id)).toBe(true);
  });
});
