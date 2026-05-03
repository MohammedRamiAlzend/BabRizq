// Mock API for Order entity
import { Order, OrderStatus } from './model';

// Mock data
const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    orderNumber: '#BRQ-1042',
    customerId: 'c1',
    customerNameEn: 'Ahmed Al-Rashid',
    customerNameAr: 'أحمد الراشد',
    customerPhone: '+966 50 111 2222',
    customerAddressEn: '45 King Fahd Rd, Riyadh',
    customerAddressAr: '٤٥ طريق الملك فهد، الرياض',
    storeId: 'time-gallery',
    storeNameEn: 'Time Gallery',
    storeNameAr: 'معرض الوقت',
    storeAddressEn: 'Al Olaya, Riyadh',
    storeAddressAr: 'العليا، الرياض',
    items: [
      { productId: 'p1', nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', quantity: 1, price: 459 },
      { productId: 'p2', nameEn: 'Aviator Sunglasses', nameAr: 'نظارات شمسية', quantity: 2, price: 129 },
    ],
    subtotal: 717,
    discount: 0,
    tax: 107.55,
    total: 824.55,
    currency: 'SAR',
    status: 'pending',
    createdAt: '2026-04-06T00:00:00Z',
    updatedAt: '2026-04-06T00:00:00Z',
  },
  // Add more orders...
];

// API functions
export async function getOrders(): Promise<Order[]> {
  return new Promise(resolve => setTimeout(() => resolve(MOCK_ORDERS), 100));
}

export async function getOrderById(id: string): Promise<Order | null> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_ORDERS.find(o => o.id === id) || null), 100)
  );
}

export async function getOrdersByStore(storeId: string): Promise<Order[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_ORDERS.filter(o => o.storeId === storeId)), 100)
  );
}

export async function getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_ORDERS.filter(o => o.status === status)), 100)
  );
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const order = MOCK_ORDERS.find(o => o.id === id);
  if (!order) throw new Error('Order not found');
  order.status = status;
  order.updatedAt = new Date().toISOString();
  return order;
}

export async function assignDriverToOrder(orderId: string, driverId: string, driverNameEn: string, driverNameAr: string): Promise<Order> {
  const order = MOCK_ORDERS.find(o => o.id === orderId);
  if (!order) throw new Error('Order not found');
  order.assignedDriverId = driverId;
  order.assignedDriverNameEn = driverNameEn;
  order.assignedDriverNameAr = driverNameAr;
  order.status = 'assigned';
  order.updatedAt = new Date().toISOString();
  return order;
}