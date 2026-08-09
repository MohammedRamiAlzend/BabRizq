import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ALL_ORDERS } from '~/entities/order';
import type { FullOrder, FullOrderStatus } from '~/entities/order';
import { MOCK_DRIVERS } from '~/entities/driver';
import { assignDriver as applyAssignDriver, setProofOfDelivery as applyProof, updateStatus as applyStatus } from './orderModel';

interface OrdersContextType {
  orders: FullOrder[];
  assignDriver: (orderId: string, driverId: string) => void;
  updateStatus: (orderId: string, status: FullOrderStatus) => void;
  setProofOfDelivery: (orderId: string, proof: string) => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

/**
 * Orders provider (delivery driver).
 *
 * Thin stateful wrapper over the pure functions in `./orderModel`; every
 * mutation is an immutable update.
 */
export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<FullOrder[]>(ALL_ORDERS);

  const assignDriver = useCallback((orderId: string, driverId: string) => {
    const driver = MOCK_DRIVERS.find(d => d.id === driverId);
    if (!driver) return;
    setOrders(prev => applyAssignDriver(prev, orderId, driver));
  }, []);

  const updateStatus = useCallback((orderId: string, status: FullOrderStatus) => {
    setOrders(prev => applyStatus(prev, orderId, status));
  }, []);

  const setProofOfDelivery = useCallback((orderId: string, proof: string) => {
    setOrders(prev => applyProof(prev, orderId, proof));
  }, []);

  return (
    <OrdersContext.Provider value={{ orders, assignDriver, updateStatus, setProofOfDelivery }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
};
