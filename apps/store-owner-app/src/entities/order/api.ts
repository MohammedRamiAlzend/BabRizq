/**
 * Order entity — mock API.
 *
 * Simulates the store-owner order endpoints from
 * `docs/needed-endpoints-from-backend.md`:
 * `GET /api/store-owner/orders?status=` · `PUT /api/store-owner/orders/{id}/status`.
 * Seed data is copied verbatim from the legacy monolith.
 */
import { StoreOrder } from './model';
import { api, unwrapList } from '@/shared/lib/api';

/** In-memory orders. TODO(migration): replaced by `GET /api/store-owner/orders`. */
export const STORE_ORDERS: StoreOrder[] = [
  {
    id: 'o1', orderNumber: '#BRQ-1042',
    customerNameEn: 'Ahmed Al-Rashid', customerNameAr: 'أحمد الراشد',
    customerAddress: 'Riyadh, Al Olaya, Street 12',
    items: [
      { nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', qty: 1, price: 459 },
      { nameEn: 'Aviator Sunglasses', nameAr: 'نظارات شمسية', qty: 2, price: 129 },
    ],
    total: 717, currency: 'SAR', status: 'pending', date: '2026-04-06',
  },
  {
    id: 'o2', orderNumber: '#BRQ-1041',
    customerNameEn: 'Sara Mansour', customerNameAr: 'سارة منصور',
    customerAddress: 'Jeddah, Al Hamra District',
    items: [{ nameEn: 'Premium Headphones', nameAr: 'سماعات فاخرة', qty: 1, price: 299 }],
    total: 299, currency: 'SAR', status: 'processing', date: '2026-04-05',
  },
  {
    id: 'o3', orderNumber: '#BRQ-1039',
    customerNameEn: 'Khalid Nasser', customerNameAr: 'خالد ناصر',
    customerAddress: 'Dammam, Al Faisaliyah',
    items: [
      { nameEn: 'Leather Bag', nameAr: 'حقيبة جلدية', qty: 1, price: 189 },
      { nameEn: 'Wool Scarf', nameAr: 'وشاح صوف', qty: 1, price: 69 },
    ],
    total: 258, currency: 'SAR', status: 'pending', date: '2026-04-05',
  },
  {
    id: 'o4', orderNumber: '#BRQ-1037',
    customerNameEn: 'Fatima Al-Harbi', customerNameAr: 'فاطمة الحربي',
    customerAddress: 'Riyadh, Al Malaz',
    items: [{ nameEn: 'Flagship Smartphone', nameAr: 'هاتف ذكي رائد', qty: 1, price: 899 }],
    total: 899, currency: 'SAR', status: 'processing', date: '2026-04-04',
  },
  {
    id: 'o5', orderNumber: '#BRQ-1035',
    customerNameEn: 'Omar Yusuf', customerNameAr: 'عمر يوسف',
    customerAddress: 'Mecca, Al Aziziyah',
    items: [
      { nameEn: 'White Sneakers', nameAr: 'حذاء أبيض', qty: 1, price: 159 },
      { nameEn: 'Arabian Oud', nameAr: 'عطر عود', qty: 1, price: 219 },
    ],
    total: 378, currency: 'SAR', status: 'shipped', date: '2026-04-03',
  },
  {
    id: 'o6', orderNumber: '#BRQ-1032',
    customerNameEn: 'Nora Al-Qahtani', customerNameAr: 'نورة القحطاني',
    customerAddress: 'Riyadh, King Fahd Road',
    items: [{ nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', qty: 1, price: 459 }],
    total: 459, currency: 'SAR', status: 'delivered', date: '2026-04-01',
  },
  {
    id: 'o7', orderNumber: '#BRQ-1030',
    customerNameEn: 'Tariq Al-Amri', customerNameAr: 'طارق العمري',
    customerAddress: 'Medina, Al Anbariyah',
    items: [
      { nameEn: 'Premium Headphones', nameAr: 'سماعات فاخرة', qty: 2, price: 299 },
      { nameEn: 'Leather Bag', nameAr: 'حقيبة جلدية', qty: 1, price: 189 },
    ],
    total: 787, currency: 'SAR', status: 'delivered', date: '2026-03-29',
  },
  {
    id: 'o8', orderNumber: '#BRQ-1028',
    customerNameEn: 'Hessa Al-Subaie', customerNameAr: 'حصة السبيعي',
    customerAddress: 'Riyadh, Hittin',
    items: [{ nameEn: 'Aviator Sunglasses', nameAr: 'نظارات شمسية', qty: 1, price: 129 }],
    total: 129, currency: 'SAR', status: 'delivered', date: '2026-03-27',
  },
  {
    id: 'o9', orderNumber: '#BRQ-1025',
    customerNameEn: 'Rayan Al-Dosari', customerNameAr: 'ريان الدوسري',
    customerAddress: 'Abha, Al Marooj',
    items: [
      { nameEn: 'Flagship Smartphone', nameAr: 'هاتف ذكي رائد', qty: 1, price: 899 },
      { nameEn: 'Arabian Oud', nameAr: 'عطر عود', qty: 1, price: 219 },
    ],
    total: 1118, currency: 'SAR', status: 'delivered', date: '2026-03-24',
  },
  {
    id: 'o10', orderNumber: '#BRQ-1020',
    customerNameEn: 'Layla Mahmoud', customerNameAr: 'ليلى محمود',
    customerAddress: 'Jeddah, Al Rawdah',
    items: [{ nameEn: 'Leather Bag', nameAr: 'حقيبة جلدية', qty: 1, price: 189 }],
    total: 189, currency: 'SAR', status: 'delivered', date: '2026-03-20',
  },
];

/** Backend `StoreOrderView` shape (store `orders.md`) — DTO boundary. */
interface StoreOrderDto {
  id: string;
  orderNumber: string;
  date: string;
  customerNameEn: string;
  customerNameAr: string;
  customerAddress?: string;
  items: { nameEn: string; nameAr: string; qty: number; price: number }[];
  total: number;
  currency: string;
  status: string;
}

/**
 * Maps the backend view onto the frontend `StoreOrder` model. NOTE: the
 * backend runs the canonical 6-step flow (`assigned`/`picked_up`/`in_transit`
 * replace the legacy `shipped`), so the status is cast to the legacy union.
 */
function toStoreOrder(dto: StoreOrderDto): StoreOrder {
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    date: dto.date,
    customerNameEn: dto.customerNameEn,
    customerNameAr: dto.customerNameAr,
    customerAddress: dto.customerAddress,
    items: dto.items,
    total: dto.total,
    currency: dto.currency,
    status: dto.status as StoreOrder['status'],
  };
}

/** GET /store/orders?status= — the store owner's incoming orders. */
export async function getStoreOrders(
  status?: StoreOrder['status']
): Promise<StoreOrder[]> {
  const data = await api.get<StoreOrderDto[] | { items: StoreOrderDto[] }>('/store/orders', {
    page: 1,
    pageSize: 100,
    status,
  });
  return unwrapList(data).map(toStoreOrder);
}

/**
 * PUT /store/orders/{id}/status — advance the order one step forward in the
 * canonical flow (invalid jumps are rejected by the backend with 422).
 */
export async function updateOrderStatus(
  id: string,
  status: StoreOrder['status']
): Promise<StoreOrder> {
  const dto = await api.put<StoreOrderDto>(`/store/orders/${id}/status`, { status });
  return toStoreOrder(dto);
}
