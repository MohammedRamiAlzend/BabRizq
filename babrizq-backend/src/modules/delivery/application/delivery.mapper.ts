/**
 * Delivery mapper — Prisma order → the `DeliveryOrder` shape from the
 * delivery app's `_shared.md` contract.
 */
import { Order, OrderItem, Store } from '@prisma/client';

export type DeliveryOrderRow = Order & {
  items: OrderItem[];
  store: Store & { settings: { addressEn: string | null; addressAr: string | null } | null };
};

/** `DeliveryOrder` shape (delivery _shared.md). */
export interface DeliveryOrderView {
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
  items: { nameEn: string; nameAr: string; qty: number; price?: number }[];
  total: number;
  status: string;
  assignedDriverId?: string;
  proofOfDelivery?: string;
}

export function toDeliveryOrderView(order: DeliveryOrderRow): DeliveryOrderView {
  const view: DeliveryOrderView = {
    id: order.id,
    orderNumber: order.orderNumber,
    date: order.createdAt.toISOString().slice(0, 10),
    customerNameEn: order.customerNameEn,
    customerNameAr: order.customerNameAr,
    addressEn: order.addressEn,
    addressAr: order.addressAr,
    customerPhone: order.customerPhone,
    storeNameEn: order.store.nameEn,
    storeNameAr: order.store.nameAr,
    storeAddressEn: order.store.settings?.addressEn ?? '',
    storeAddressAr: order.store.settings?.addressAr ?? '',
    items: order.items.map((item) => ({
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      qty: item.qty,
      price: item.price,
    })),
    total: order.total,
    status: order.status,
  };
  if (order.assignedDriverId) view.assignedDriverId = order.assignedDriverId;
  if (order.proofOfDeliveryUrl) view.proofOfDelivery = order.proofOfDeliveryUrl;
  return view;
}
