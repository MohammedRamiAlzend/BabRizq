/**
 * Warehouse entity — mock API.
 *
 * Simulates the store-owner warehouse endpoints from
 * `docs/needed-endpoints-from-backend.md` (`GET/POST /api/store-owner/warehouse/…`).
 * Seed data is copied verbatim from the legacy monolith.
 */
import { Supplier, StockMovement } from './model';

/** In-memory suppliers. TODO(migration): replaced by `GET /api/store-owner/warehouse/suppliers`. */
export const STORE_SUPPLIERS: Supplier[] = [
  {
    id: 'sup1', nameEn: 'Al-Noor Electronics', nameAr: 'شركة النور للإلكترونيات',
    contactName: 'Mohammed Al-Ghamdi', phone: '+966 55 111 2233',
    email: 'contact@alnoor-elec.com', address: 'Riyadh Industrial City',
    productsSupplied: 2,
  },
  {
    id: 'sup2', nameEn: 'Gulf Accessories Co.', nameAr: 'شركة الخليج للإكسسوارات',
    contactName: 'Khalid Bin Saud', phone: '+966 50 222 3344',
    email: 'info@gulfacc.com', address: 'Jeddah, Al Hamra',
    productsSupplied: 3,
  },
  {
    id: 'sup3', nameEn: 'Arabian Scents Trading', nameAr: 'تجارة العطور العربية',
    contactName: 'Fatima Al-Zahrani', phone: '+971 4 333 4455',
    email: 'sales@arabianscents.ae', address: 'Dubai, Deira',
    productsSupplied: 1,
  },
  {
    id: 'sup4', nameEn: 'Fashion House KSA', nameAr: 'بيت الأزياء للمملكة',
    contactName: 'Nora Al-Dosari', phone: '+966 56 444 5566',
    email: 'orders@fashionhouseksa.com', address: 'Riyadh, Malaz',
    productsSupplied: 2,
  },
];

/** In-memory stock movements. TODO(migration): replaced by `GET /api/store-owner/warehouse/movements`. */
export const STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'sm1', productId: 'sp1', productNameEn: 'Premium Wireless Headphones', productNameAr: 'سماعات لاسلكية فاخرة',
    type: 'in', quantity: 30, reason: 'Purchase from supplier', reasonAr: 'شراء من المورد',
    date: '2026-04-01', supplierId: 'sup1', supplierNameEn: 'Al-Noor Electronics', supplierNameAr: 'شركة النور للإلكترونيات',
    reference: 'PO-2026-041',
  },
  {
    id: 'sm2', productId: 'sp7', productNameEn: 'Flagship Smartphone', productNameAr: 'هاتف ذكي رائد',
    type: 'in', quantity: 15, reason: 'Purchase from supplier', reasonAr: 'شراء من المورد',
    date: '2026-04-02', supplierId: 'sup1', supplierNameEn: 'Al-Noor Electronics', supplierNameAr: 'شركة النور للإلكترونيات',
    reference: 'PO-2026-042',
  },
  {
    id: 'sm3', productId: 'sp1', productNameEn: 'Premium Wireless Headphones', productNameAr: 'سماعات لاسلكية فاخرة',
    type: 'out', quantity: 5, reason: 'Sales', reasonAr: 'مبيعات',
    date: '2026-04-03',
  },
  {
    id: 'sm4', productId: 'sp3', productNameEn: 'Gold Wristwatch', productNameAr: 'ساعة يد ذهبية',
    type: 'in', quantity: 10, reason: 'Purchase from supplier', reasonAr: 'شراء من المورد',
    date: '2026-04-03', supplierId: 'sup2', supplierNameEn: 'Gulf Accessories Co.', supplierNameAr: 'شركة الخليج للإكسسوارات',
    reference: 'PO-2026-043',
  },
  {
    id: 'sm5', productId: 'sp5', productNameEn: 'Classic White Sneakers', productNameAr: 'حذاء رياضي أبيض',
    type: 'adjustment', quantity: -2, reason: 'Damaged items removed', reasonAr: 'إزالة بضاعة تالفة',
    date: '2026-04-04',
  },
  {
    id: 'sm6', productId: 'sp6', productNameEn: 'Arabian Oud Perfume', productNameAr: 'عطر عود عربي',
    type: 'in', quantity: 20, reason: 'Purchase from supplier', reasonAr: 'شراء من المورد',
    date: '2026-04-05', supplierId: 'sup3', supplierNameEn: 'Arabian Scents Trading', supplierNameAr: 'تجارة العطور العربية',
    reference: 'PO-2026-044',
  },
  {
    id: 'sm7', productId: 'sp7', productNameEn: 'Flagship Smartphone', productNameAr: 'هاتف ذكي رائد',
    type: 'out', quantity: 3, reason: 'Sales', reasonAr: 'مبيعات',
    date: '2026-04-06',
  },
  {
    id: 'sm8', productId: 'sp8', productNameEn: 'Wool Knitted Scarf', productNameAr: 'وشاح صوف محبوك',
    type: 'out', quantity: 4, reason: 'Sales', reasonAr: 'مبيعات',
    date: '2026-04-06',
  },
];

/** Simulates `GET /api/store-owner/warehouse/suppliers`. */
export async function getSuppliers(): Promise<Supplier[]> {
  return new Promise(resolve => setTimeout(() => resolve(STORE_SUPPLIERS), 100));
}

/** Simulates `POST /api/store-owner/warehouse/suppliers`. */
export async function createSupplier(
  input: Omit<Supplier, 'id' | 'productsSupplied'>
): Promise<Supplier> {
  return new Promise(resolve =>
    setTimeout(() => {
      const supplier: Supplier = { ...input, id: `sup${STORE_SUPPLIERS.length + 1}`, productsSupplied: 0 };
      STORE_SUPPLIERS.push(supplier);
      resolve(supplier);
    }, 100)
  );
}

/** Simulates `GET /api/store-owner/warehouse/movements`. */
export async function getStockMovements(): Promise<StockMovement[]> {
  return new Promise(resolve => setTimeout(() => resolve(STOCK_MOVEMENTS), 100));
}

/** Simulates `POST /api/store-owner/warehouse/movements`. */
export async function createStockMovement(
  input: Omit<StockMovement, 'id'>
): Promise<StockMovement> {
  return new Promise(resolve =>
    setTimeout(() => {
      const movement: StockMovement = { ...input, id: `sm${STOCK_MOVEMENTS.length + 1}` };
      STOCK_MOVEMENTS.push(movement);
      resolve(movement);
    }, 100)
  );
}
