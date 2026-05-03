// Domain model for Order entity
export type OrderStatus = 'pending' | 'processing' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  nameEn: string;
  nameAr: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerNameEn: string;
  customerNameAr: string;
  customerPhone: string;
  customerAddressEn: string;
  customerAddressAr: string;
  customerLat?: number;
  customerLng?: number;
  storeId: string;
  storeNameEn: string;
  storeNameAr: string;
  storeAddressEn: string;
  storeAddressAr: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: OrderStatus;
  assignedDriverId?: string;
  assignedDriverNameEn?: string;
  assignedDriverNameAr?: string;
  proofOfDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

// Business logic for Order
export class OrderEntity {
  constructor(private order: Order) {}

  canAssignDriver(): boolean {
    return ['pending', 'processing'].includes(this.order.status);
  }

  canUpdateStatus(newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['processing', 'cancelled'],
      processing: ['assigned', 'cancelled'],
      assigned: ['picked_up', 'cancelled'],
      picked_up: ['in_transit', 'cancelled'],
      in_transit: ['delivered'],
      delivered: [],
      cancelled: [],
    };
    return validTransitions[this.order.status]?.includes(newStatus) ?? false;
  }

  updateStatus(newStatus: OrderStatus): Order {
    if (!this.canUpdateStatus(newStatus)) throw new Error('Invalid status transition');
    return {
      ...this.order,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
  }

  assignDriver(driverId: string, driverNameEn: string, driverNameAr: string): Order {
    if (!this.canAssignDriver()) throw new Error('Cannot assign driver to this order');
    return {
      ...this.order,
      status: 'assigned',
      assignedDriverId: driverId,
      assignedDriverNameEn: driverNameEn,
      assignedDriverNameAr: driverNameAr,
      updatedAt: new Date().toISOString(),
    };
  }

  calculateTotal(): number {
    return this.order.subtotal - this.order.discount + this.order.tax;
  }
}

// Validation
export function validateOrder(order: Partial<Order>): string[] {
  const errors: string[] = [];
  if (!order.customerId) errors.push('Customer ID is required');
  if (!order.storeId) errors.push('Store ID is required');
  if (!order.items || order.items.length === 0) errors.push('At least one item is required');
  if (order.total == null || order.total < 0) errors.push('Valid total is required');
  return errors;
}