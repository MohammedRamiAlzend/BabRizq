/**
 * Chart of accounts — KSA-standard template codes, shared by the ledger
 * engine and the reports. Every store gets a copy of these accounts on first
 * use (see `chart-of-accounts.service.ts`); the codes are stable so report
 * queries can group on `account.code` without joins.
 *
 * Ledger types follow the plan (`02-store-owner-accounting-suite.md`):
 * asset | liability | equity | revenue | expense.
 */
export const ACCOUNT_CODES = {
  // ---- Assets ----
  CASH: '1100',
  BANK: '1200',
  AR_CUSTOMER: '1300', // receivables from orders paid online
  AR_COD: '1400', // cash due from COD orders handed to drivers
  INVENTORY: '1500',
  PLATFORM_RECEIVABLE: '1600', // payouts owed by the platform to the store
  // ---- Liabilities ----
  PLATFORM_PAYABLE: '2100', // commission + delivery owed to the platform
  SUPPLIER_PAYABLE: '2200',
  TAX_PAYABLE: '2300',
  // ---- Equity ----
  OWNER_CAPITAL: '3100',
  RETAINED_EARNINGS: '3200',
  // ---- Revenue ----
  SALES_REVENUE: '4100',
  SALES_RETURNS: '4200',
  DELIVERY_REVENUE: '4300',
  // ---- Expenses ----
  COGS: '5100',
  COMMISSION_EXPENSE: '5200',
  DELIVERY_EXPENSE: '5300',
  RENT_EXPENSE: '5400',
  SALARY_EXPENSE: '5500',
  MARKETING_EXPENSE: '5600',
  SHIPPING_EXPENSE: '5700',
  UTILITIES_EXPENSE: '5800',
  OTHER_EXPENSE: '5900',
} as const;

/** Ledger account type — used by the trial balance and statement grouping. */
export type LedgerAccountType =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'expense';

export interface AccountTemplate {
  code: string;
  nameEn: string;
  nameAr: string;
  type: LedgerAccountType;
}

/** Seeded per store. `isSystem: true` — cannot be deleted, only edited. */
export const ACCOUNT_TEMPLATE: readonly AccountTemplate[] = [
  // Assets
  { code: ACCOUNT_CODES.CASH, nameEn: 'Cash', nameAr: 'النقدية', type: 'asset' },
  { code: ACCOUNT_CODES.BANK, nameEn: 'Bank', nameAr: 'البنك', type: 'asset' },
  { code: ACCOUNT_CODES.AR_CUSTOMER, nameEn: 'Accounts Receivable — Customers', nameAr: 'ذمم مدينة — عملاء', type: 'asset' },
  { code: ACCOUNT_CODES.AR_COD, nameEn: 'Cash on Delivery Clearing', nameAr: 'مقبوضات الدفع عند الاستلام', type: 'asset' },
  { code: ACCOUNT_CODES.INVENTORY, nameEn: 'Inventory', nameAr: 'المخزون', type: 'asset' },
  { code: ACCOUNT_CODES.PLATFORM_RECEIVABLE, nameEn: 'Platform Receivable', nameAr: 'مستحقات المنصة', type: 'asset' },
  // Liabilities
  { code: ACCOUNT_CODES.PLATFORM_PAYABLE, nameEn: 'Platform Payable', nameAr: 'مستحقات للمنصة', type: 'liability' },
  { code: ACCOUNT_CODES.SUPPLIER_PAYABLE, nameEn: 'Accounts Payable — Suppliers', nameAr: 'ذمم دائنة — موردين', type: 'liability' },
  { code: ACCOUNT_CODES.TAX_PAYABLE, nameEn: 'VAT Payable', nameAr: 'ضريبة القيمة المضافة المستحقة', type: 'liability' },
  // Equity
  { code: ACCOUNT_CODES.OWNER_CAPITAL, nameEn: 'Owner Capital', nameAr: 'رأس مال المالك', type: 'equity' },
  { code: ACCOUNT_CODES.RETAINED_EARNINGS, nameEn: 'Retained Earnings', nameAr: 'الأرباح المبقاة', type: 'equity' },
  // Revenue
  { code: ACCOUNT_CODES.SALES_REVENUE, nameEn: 'Sales Revenue', nameAr: 'إيرادات المبيعات', type: 'revenue' },
  { code: ACCOUNT_CODES.SALES_RETURNS, nameEn: 'Sales Returns', nameAr: 'مرتجعات المبيعات', type: 'revenue' },
  { code: ACCOUNT_CODES.DELIVERY_REVENUE, nameEn: 'Delivery Revenue', nameAr: 'إيرادات التوصيل', type: 'revenue' },
  // Expenses
  { code: ACCOUNT_CODES.COGS, nameEn: 'Cost of Goods Sold', nameAr: 'تكلفة البضاعة المباعة', type: 'expense' },
  { code: ACCOUNT_CODES.COMMISSION_EXPENSE, nameEn: 'Platform Commission', nameAr: 'عمولة المنصة', type: 'expense' },
  { code: ACCOUNT_CODES.DELIVERY_EXPENSE, nameEn: 'Delivery Services', nameAr: 'خدمات التوصيل', type: 'expense' },
  { code: ACCOUNT_CODES.RENT_EXPENSE, nameEn: 'Rent', nameAr: 'إيجار', type: 'expense' },
  { code: ACCOUNT_CODES.SALARY_EXPENSE, nameEn: 'Salaries', nameAr: 'رواتب', type: 'expense' },
  { code: ACCOUNT_CODES.MARKETING_EXPENSE, nameEn: 'Marketing & Ads', nameAr: 'تسويق وإعلانات', type: 'expense' },
  { code: ACCOUNT_CODES.SHIPPING_EXPENSE, nameEn: 'Shipping & Logistics', nameAr: 'شحن ولوجستيات', type: 'expense' },
  { code: ACCOUNT_CODES.UTILITIES_EXPENSE, nameEn: 'Utilities', nameAr: 'مرافق', type: 'expense' },
  { code: ACCOUNT_CODES.OTHER_EXPENSE, nameEn: 'Other Expenses', nameAr: 'مصاريف أخرى', type: 'expense' },
] as const;

/** Maps an expense category (frontend contract) to a ledger account code. */
export const EXPENSE_CATEGORY_ACCOUNT: Record<string, string> = {
  rent: ACCOUNT_CODES.RENT_EXPENSE,
  salary: ACCOUNT_CODES.SALARY_EXPENSE,
  marketing: ACCOUNT_CODES.MARKETING_EXPENSE,
  shipping: ACCOUNT_CODES.SHIPPING_EXPENSE,
  utilities: ACCOUNT_CODES.UTILITIES_EXPENSE,
  other: ACCOUNT_CODES.OTHER_EXPENSE,
};

/** Platform commission rate on the taxable order subtotal (10% default). */
export const PLATFORM_COMMISSION_RATE = 0.1;

/** Rounding helper for money (SAR): two decimals. */
export const round2 = (value: number): number => Math.round(value * 100) / 100;
