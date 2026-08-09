/**
 * Order entity — mock API (delivery driver).
 *
 * Simulates the delivery endpoints from
 * `docs/needed-endpoints-from-backend.md`:
 * `GET /api/delivery/orders?status=` ·
 * `PUT /api/delivery/orders/{id}/status` ·
 * `POST /api/delivery/orders/{id}/proof-of-delivery`.
 * Seed data is copied verbatim from the legacy monolith.
 */
import { FullOrder, FullOrderStatus } from './model';

/** In-memory order book. TODO(migration): replaced by `GET /api/delivery/orders`. */
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

/** Simulates `GET /api/delivery/orders?status={status}`. */
export async function getDeliveryOrders(status?: FullOrderStatus): Promise<FullOrder[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve(status ? ALL_ORDERS.filter(o => o.status === status) : ALL_ORDERS), 100)
  );
}

/** Simulates `PUT /api/delivery/orders/{id}/status`. */
export async function updateDeliveryOrderStatus(
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

/** Simulates `POST /api/delivery/orders/{id}/proof-of-delivery`. */
export async function setOrderProofOfDelivery(id: string, proof: string): Promise<FullOrder> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      const order = ALL_ORDERS.find(o => o.id === id);
      if (!order) {
        reject(new Error('Order not found'));
        return;
      }
      order.proofOfDelivery = proof;
      resolve(order);
    }, 100)
  );
}
