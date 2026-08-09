/**
 * Accounting entity — mock API.
 *
 * Simulates the store-owner accounting endpoints from
 * `docs/needed-endpoints-from-backend.md` (`GET/POST /api/store-owner/accounting/…`).
 * Seed data is copied verbatim from the legacy monolith.
 */
import { Expense, Invoice } from './model';

/** In-memory expenses. TODO(migration): replaced by `GET /api/store-owner/accounting/expenses`. */
export const STORE_EXPENSES: Expense[] = [
  { id: 'exp1', titleEn: 'Store Rent', titleAr: 'إيجار المستودع', category: 'rent', amount: 3500, currency: 'SAR', date: '2026-04-01' },
  { id: 'exp2', titleEn: 'Staff Salaries', titleAr: 'رواتب الموظفين', category: 'salary', amount: 8000, currency: 'SAR', date: '2026-04-01' },
  { id: 'exp3', titleEn: 'Social Media Ads', titleAr: 'إعلانات السوشيال ميديا', category: 'marketing', amount: 1200, currency: 'SAR', date: '2026-04-03' },
  { id: 'exp4', titleEn: 'Shipping & Logistics', titleAr: 'الشحن والخدمات اللوجستية', category: 'shipping', amount: 950, currency: 'SAR', date: '2026-04-05' },
  { id: 'exp5', titleEn: 'Electricity & Internet', titleAr: 'الكهرباء والإنترنت', category: 'utilities', amount: 420, currency: 'SAR', date: '2026-04-02' },
  { id: 'exp6', titleEn: 'Packaging Materials', titleAr: 'مواد التغليف', category: 'other', amount: 380, currency: 'SAR', date: '2026-04-04' },
  { id: 'exp7', titleEn: 'Store Rent (March)', titleAr: 'إيجار المستودع (مارس)', category: 'rent', amount: 3500, currency: 'SAR', date: '2026-03-01' },
  { id: 'exp8', titleEn: 'Staff Salaries (March)', titleAr: 'رواتب الموظفين (مارس)', category: 'salary', amount: 8000, currency: 'SAR', date: '2026-03-01' },
  { id: 'exp9', titleEn: 'Google Ads Campaign', titleAr: 'حملة إعلانية على جوجل', category: 'marketing', amount: 800, currency: 'SAR', date: '2026-03-15' },
  { id: 'exp10', titleEn: 'Delivery Services (March)', titleAr: 'خدمات التوصيل (مارس)', category: 'shipping', amount: 780, currency: 'SAR', date: '2026-03-20' },
];

/** In-memory invoices. TODO(migration): replaced by `GET /api/store-owner/accounting/invoices`. */
export const STORE_INVOICES: Invoice[] = [
  {
    id: 'inv1', invoiceNumber: 'INV-2026-042', orderId: 'o1', orderNumber: '#BRQ-1042',
    customerNameEn: 'Ahmed Al-Rashid', customerNameAr: 'أحمد الراشد',
    items: [
      { nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', qty: 1, price: 459 },
      { nameEn: 'Aviator Sunglasses', nameAr: 'نظارات شمسية', qty: 2, price: 129 },
    ],
    subtotal: 717, discount: 0, tax: 107.55, total: 824.55,
    currency: 'SAR', date: '2026-04-06', status: 'unpaid',
  },
  {
    id: 'inv2', invoiceNumber: 'INV-2026-041', orderId: 'o2', orderNumber: '#BRQ-1041',
    customerNameEn: 'Sara Mansour', customerNameAr: 'سارة منصور',
    items: [{ nameEn: 'Premium Headphones', nameAr: 'سماعات فاخرة', qty: 1, price: 299 }],
    subtotal: 299, discount: 0, tax: 44.85, total: 343.85,
    currency: 'SAR', date: '2026-04-05', status: 'unpaid',
  },
  {
    id: 'inv3', invoiceNumber: 'INV-2026-039', orderId: 'o3', orderNumber: '#BRQ-1039',
    customerNameEn: 'Khalid Nasser', customerNameAr: 'خالد ناصر',
    items: [
      { nameEn: 'Leather Bag', nameAr: 'حقيبة جلدية', qty: 1, price: 189 },
      { nameEn: 'Wool Scarf', nameAr: 'وشاح صوف', qty: 1, price: 69 },
    ],
    subtotal: 258, discount: 0, tax: 38.7, total: 296.7,
    currency: 'SAR', date: '2026-04-05', status: 'unpaid',
  },
  {
    id: 'inv4', invoiceNumber: 'INV-2026-032', orderId: 'o6', orderNumber: '#BRQ-1032',
    customerNameEn: 'Nora Al-Qahtani', customerNameAr: 'نورة القحطاني',
    items: [{ nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', qty: 1, price: 459 }],
    subtotal: 459, discount: 50, tax: 61.35, total: 470.35,
    currency: 'SAR', date: '2026-04-01', status: 'paid',
  },
  {
    id: 'inv5', invoiceNumber: 'INV-2026-030', orderId: 'o7', orderNumber: '#BRQ-1030',
    customerNameEn: 'Tariq Al-Amri', customerNameAr: 'طارق العمري',
    items: [
      { nameEn: 'Premium Headphones', nameAr: 'سماعات فاخرة', qty: 2, price: 299 },
      { nameEn: 'Leather Bag', nameAr: 'حقيبة جلدية', qty: 1, price: 189 },
    ],
    subtotal: 787, discount: 0, tax: 118.05, total: 905.05,
    currency: 'SAR', date: '2026-03-29', status: 'paid',
  },
  {
    id: 'inv6', invoiceNumber: 'INV-2026-025', orderId: 'o9', orderNumber: '#BRQ-1025',
    customerNameEn: 'Rayan Al-Dosari', customerNameAr: 'ريان الدوسري',
    items: [
      { nameEn: 'Flagship Smartphone', nameAr: 'هاتف ذكي رائد', qty: 1, price: 899 },
      { nameEn: 'Arabian Oud', nameAr: 'عطر عود', qty: 1, price: 219 },
    ],
    subtotal: 1118, discount: 0, tax: 167.7, total: 1285.7,
    currency: 'SAR', date: '2026-03-24', status: 'paid',
  },
];

/** Simulates `GET /api/store-owner/accounting/expenses`. */
export async function getExpenses(): Promise<Expense[]> {
  return new Promise(resolve => setTimeout(() => resolve(STORE_EXPENSES), 100));
}

/** Simulates `POST /api/store-owner/accounting/expenses`. */
export async function createExpense(input: Omit<Expense, 'id'>): Promise<Expense> {
  return new Promise(resolve =>
    setTimeout(() => {
      const expense: Expense = { ...input, id: `exp${STORE_EXPENSES.length + 1}` };
      STORE_EXPENSES.push(expense);
      resolve(expense);
    }, 100)
  );
}

/** Simulates `GET /api/store-owner/accounting/invoices`. */
export async function getInvoices(): Promise<Invoice[]> {
  return new Promise(resolve => setTimeout(() => resolve(STORE_INVOICES), 100));
}

/** Simulates `POST /api/store-owner/accounting/invoices`. */
export async function createInvoice(input: Omit<Invoice, 'id'>): Promise<Invoice> {
  return new Promise(resolve =>
    setTimeout(() => {
      const invoice: Invoice = { ...input, id: `inv${STORE_INVOICES.length + 1}` };
      STORE_INVOICES.push(invoice);
      resolve(invoice);
    }, 100)
  );
}
