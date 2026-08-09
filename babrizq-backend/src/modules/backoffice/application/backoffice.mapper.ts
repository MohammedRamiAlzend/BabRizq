/**
 * Back-office mapper — Prisma records → the `FullOrder` and `Driver` shapes
 * from the back-office `_shared.md` contract.
 */
import { Order, OrderItem, Store, User } from '@prisma/client';

/** Order with the relations the back-office queries load. */
export type BackofficeOrder = Order & {
  items: OrderItem[];
  store: Store & { settings: { addressEn: string | null; addressAr: string | null } | null };
  driver?: User | null;
};

/** `FullOrder` shape (back-office _shared.md). */
export interface FullOrderView {
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
  /** Optional (shipments.md): per-item stock availability warnings. */
  stockWarnings?: {
    itemNameEn: string;
    itemNameAr: string;
    requestedQty: number;
    availableQty: number;
  }[];
}

export function toFullOrderView(
  order: BackofficeOrder,
  stockWarnings?: FullOrderView['stockWarnings'],
): FullOrderView {
  const view: FullOrderView = {
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
    currency: order.currency,
    status: order.status,
  };

  if (order.assignedDriverId && order.driver) {
    view.assignedDriverId = order.assignedDriverId;
    view.assignedDriverEn = order.driver.nameEn;
    view.assignedDriverAr = order.driver.nameAr;
  }
  if (order.proofOfDeliveryUrl) {
    view.proofOfDelivery = 'photo_uploaded';
  }
  if (stockWarnings && stockWarnings.length > 0) {
    view.stockWarnings = stockWarnings;
  }
  return view;
}

/** `Driver` shape (back-office _shared.md + drivers.md). */
export interface DriverView {
  id: string;
  nameEn: string;
  nameAr: string;
  phone: string;
  available: boolean;
  activeOrderId?: string;
}

export function toDriverView(
  user: User & { driverProfile: { phone: string | null; available: boolean; activeOrderId: string | null } | null },
): DriverView {
  const view: DriverView = {
    id: user.id,
    nameEn: user.nameEn,
    nameAr: user.nameAr,
    phone: user.phone ?? user.driverProfile?.phone ?? '',
    available: user.driverProfile?.available ?? user.isAvailable,
  };
  if (user.driverProfile?.activeOrderId) {
    view.activeOrderId = user.driverProfile.activeOrderId;
  }
  return view;
}
