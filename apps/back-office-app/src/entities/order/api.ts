/**
 * Order entity — mock API (back office).
 *
 * Simulates the fulfillment endpoints from
 * `docs/needed-endpoints-from-backend.md`:
 * `GET /api/backoffice/orders?page=&pageSize=&search=&status=` ·
 * `PUT /api/backoffice/orders/{id}/status` ·
 * `PUT /api/backoffice/orders/{id}/assign-driver`.
 * Seed data is copied verbatim from the legacy monolith.
 */
import { FullOrder, FullOrderStatus } from './model';
import { api, unwrapList } from '@/shared/lib/api';

/** In-memory order book. TODO(migration): replaced by `GET /api/backoffice/orders`. */
export const ALL_ORDERS: FullOrder[] = [
  {
    id: 'fo1', orderNumber: '#BRQ-1042',
    customerNameEn: 'Ahmed Al-Rashid', customerNameAr: 'أحمد الراشد',
    customerPhone: '+966 50 111 2222',
    addressEn: '45 King Fahd Rd, Riyadh', addressAr: '٤٥ طريق الملك فهد، الرياض',
    lat: 24.7136, lng: 46.6753,
    storeNameEn: 'Time Gallery', storeNameAr: 'معرض الوقت',
    storeAddressEn: 'Al Olaya, Riyadh', storeAddressAr: 'العليا، الرياض',
    items: [
      { nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', qty: 1, price: 459 },
      { nameEn: 'Aviator Sunglasses', nameAr: 'نظارات شمسية', qty: 2, price: 129 },
    ],
    total: 717, status: 'pending', assignedDriverId: null, assignedDriverEn: null, assignedDriverAr: null, date: '2026-04-06',
  },
  {
    id: 'fo2', orderNumber: '#BRQ-1041',
    customerNameEn: 'Sara Mansour', customerNameAr: 'سارة منصور',
    customerPhone: '+966 50 222 3333',
    addressEn: '12 Prince Sultan St, Jeddah', addressAr: '١٢ شارع الأمير سلطان، جدة',
    lat: 21.5433, lng: 39.1728,
    storeNameEn: 'TechZone', storeNameAr: 'تك زون',
    storeAddressEn: 'Al Hamra, Jeddah', storeAddressAr: 'الحمراء، جدة',
    items: [{ nameEn: 'Premium Headphones', nameAr: 'سماعات فاخرة', qty: 1, price: 299 }],
    total: 299, status: 'processing', assignedDriverId: null, assignedDriverEn: null, assignedDriverAr: null, date: '2026-04-05',
  },
  {
    id: 'fo3', orderNumber: '#BRQ-1039',
    customerNameEn: 'Khalid Nasser', customerNameAr: 'خالد ناصر',
    customerPhone: '+966 50 333 4444',
    addressEn: '78 Tahlia St, Riyadh', addressAr: '٧٨ شارع التحلية، الرياض',
    lat: 24.6877, lng: 46.7219,
    storeNameEn: 'Leather House', storeNameAr: 'بيت الجلود',
    storeAddressEn: 'Al Malaz, Riyadh', storeAddressAr: 'الملز، الرياض',
    items: [
      { nameEn: 'Leather Bag', nameAr: 'حقيبة جلدية', qty: 1, price: 189 },
      { nameEn: 'Wool Scarf', nameAr: 'وشاح صوف', qty: 1, price: 69 },
    ],
    total: 258, status: 'assigned', assignedDriverId: 'd1', assignedDriverEn: 'Yusuf Al-Mutairi', assignedDriverAr: 'يوسف المطيري', date: '2026-04-05',
  },
  {
    id: 'fo4', orderNumber: '#BRQ-1037',
    customerNameEn: 'Fatima Al-Harbi', customerNameAr: 'فاطمة الحربي',
    customerPhone: '+966 50 444 5555',
    addressEn: '33 Al Nakheel Rd, Dammam', addressAr: '٣٣ طريق النخيل، الدمام',
    lat: 26.4207, lng: 50.0888,
    storeNameEn: 'TechZone', storeNameAr: 'تك زون',
    storeAddressEn: 'Al Faisaliyah, Dammam', storeAddressAr: 'الفيصلية، الدمام',
    items: [{ nameEn: 'Flagship Smartphone', nameAr: 'هاتف ذكي رائد', qty: 1, price: 899 }],
    total: 899, status: 'picked_up', assignedDriverId: 'd2', assignedDriverEn: 'Hassan Farooq', assignedDriverAr: 'حسن فاروق', date: '2026-04-04',
  },
  {
    id: 'fo5', orderNumber: '#BRQ-1035',
    customerNameEn: 'Omar Yusuf', customerNameAr: 'عمر يوسف',
    customerPhone: '+966 50 555 6666',
    addressEn: '90 Corniche Rd, Jeddah', addressAr: '٩٠ طريق الكورنيش، جدة',
    lat: 21.4858, lng: 39.1925,
    storeNameEn: 'Step Up', storeNameAr: 'ستيب أب',
    storeAddressEn: 'Al Rawdah, Jeddah', storeAddressAr: 'الروضة، جدة',
    items: [
      { nameEn: 'White Sneakers', nameAr: 'حذاء أبيض', qty: 1, price: 159 },
      { nameEn: 'Arabian Oud', nameAr: 'عطر عود', qty: 1, price: 219 },
    ],
    total: 378, status: 'in_transit', assignedDriverId: 'd1', assignedDriverEn: 'Yusuf Al-Mutairi', assignedDriverAr: 'يوسف المطيري', date: '2026-04-03',
  },
  {
    id: 'fo6', orderNumber: '#BRQ-1033',
    customerNameEn: 'Nora Al-Qahtani', customerNameAr: 'نورة القحطاني',
    customerPhone: '+966 50 666 7777',
    addressEn: '15 Al Batha St, Riyadh', addressAr: '١٥ شارع البطحاء، الرياض',
    lat: 24.6319, lng: 46.7151,
    storeNameEn: 'Scent Palace', storeNameAr: 'قصر العطور',
    storeAddressEn: 'Al Murabba, Riyadh', storeAddressAr: 'المربع، الرياض',
    items: [{ nameEn: 'Arabian Oud Perfume', nameAr: 'عطر عود عربي', qty: 2, price: 219 }],
    total: 438, status: 'delivered', assignedDriverId: 'd2', assignedDriverEn: 'Hassan Farooq', assignedDriverAr: 'حسن فاروق', date: '2026-04-02',
  },
  {
    id: 'fo7', orderNumber: '#BRQ-1031',
    customerNameEn: 'Mohammed Ibrahim', customerNameAr: 'محمد إبراهيم',
    customerPhone: '+966 50 777 8888',
    addressEn: '22 Al Khobar Rd, Khobar', addressAr: '٢٢ طريق الخبر، الخبر',
    lat: 26.2172, lng: 50.1971,
    storeNameEn: 'Cozy Corner', storeNameAr: 'الركن الدافئ',
    storeAddressEn: 'Al Aqrabiyah, Khobar', storeAddressAr: 'العقربية، الخبر',
    items: [{ nameEn: 'Wool Knitted Scarf', nameAr: 'وشاح صوف محبوك', qty: 3, price: 69 }],
    total: 207, status: 'pending', assignedDriverId: null, assignedDriverEn: null, assignedDriverAr: null, date: '2026-04-06',
  },
];

/** Backend `FullOrderView` shape (back-office `_shared.md`) — DTO boundary. */
interface FullOrderDto {
  id: string;
  orderNumber: string;
  date: string;
  customerNameEn: string;
  customerNameAr: string;
  addressEn: string;
  addressAr: string;
  customerPhone: string;
  storeNameEn: string;
  storeNameAr: string;
  storeAddressEn: string;
  storeAddressAr: string;
  items: { nameEn: string; nameAr: string; qty: number; price: number }[];
  total: number;
  currency: string;
  status: string;
  assignedDriverId?: string;
  assignedDriverEn?: string;
  assignedDriverAr?: string;
  proofOfDelivery?: 'photo_uploaded' | 'signature_captured';
  stockWarnings?: {
    itemNameEn: string;
    itemNameAr: string;
    requestedQty: number;
    availableQty: number;
  }[];
}

/** Maps the backend view onto the shared `FullOrder` contract. */
function toFullOrder(dto: FullOrderDto): FullOrder {
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    date: dto.date,
    customerNameEn: dto.customerNameEn,
    customerNameAr: dto.customerNameAr,
    customerPhone: dto.customerPhone,
    addressEn: dto.addressEn,
    addressAr: dto.addressAr,
    storeNameEn: dto.storeNameEn,
    storeNameAr: dto.storeNameAr,
    storeAddressEn: dto.storeAddressEn,
    storeAddressAr: dto.storeAddressAr,
    items: dto.items,
    total: dto.total,
    status: dto.status as FullOrderStatus,
    assignedDriverId: dto.assignedDriverId ?? null,
    assignedDriverEn: dto.assignedDriverEn ?? null,
    assignedDriverAr: dto.assignedDriverAr ?? null,
    proofOfDelivery: dto.proofOfDelivery,
  };
}

/** GET /backoffice/orders?status=&search= — the fulfilment order book. */
export async function getBackOfficeOrders(
  status?: FullOrderStatus
): Promise<FullOrder[]> {
  const data = await api.get<FullOrderDto[] | { items: FullOrderDto[] }>('/backoffice/orders', {
    page: 1,
    pageSize: 100,
    status,
  });
  return unwrapList(data).map(toFullOrder);
}

/**
 * NOTE — deliberately NOT wired to the backend: the backend has no direct
 * back-office status advance. Order status is driven by the delivery driver
 * (`PUT /delivery/orders/{id}/status`), keeping every role in sync. This
 * legacy mock remains for page rendering until that flow is migrated.
 * @deprecated Prefer the delivery driver flow.
 */
export async function updateBackOfficeOrderStatus(
  id: string,
  status: FullOrderStatus
): Promise<FullOrder> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      const order = ALL_ORDERS.find(o => o.id === id);
      if (!order) {
        reject(new Error('Order not found'));
        return;
      }
      order.status = status;
      resolve(order);
    }, 100)
  );
}

/** PUT /backoffice/orders/{id}/assign-driver — assigns a driver and moves the order to `assigned`. */
export async function assignDriverToOrder(
  id: string,
  driver: { id: string; nameEn: string; nameAr: string }
): Promise<FullOrder> {
  const dto = await api.put<FullOrderDto>(`/backoffice/orders/${id}/assign-driver`, {
    driverId: driver.id,
  });
  return toFullOrder(dto);
}
