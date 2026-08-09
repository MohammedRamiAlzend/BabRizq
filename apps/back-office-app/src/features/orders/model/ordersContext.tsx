/**
 * Orders feature — React context.
 *
 * Thin stateful wrapper over the pure functions in `./orderModel.ts`. Keeps the
 * fulfillment order book in component state and exposes the same public API the
 * pages already consume (`useOrders()`). All business rules live in
 * `orderModel.ts` so they are unit-testable without React.
 */
import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ALL_ORDERS, FullOrder, FullOrderStatus } from '~/entities/order';
import { MOCK_DRIVERS } from '~/entities/driver';
import {
  assignDriver as assignDriverModel,
  updateStatus as updateStatusModel,
  setProofOfDelivery as setProofOfDeliveryModel,
} from './orderModel';

interface OrdersContextType {
  orders: FullOrder[];
  assignDriver: (orderId: string, driverId: string) => void;
  updateStatus: (orderId: string, status: FullOrderStatus) => void;
  setProofOfDelivery: (orderId: string, proof: string) => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<FullOrder[]>(ALL_ORDERS);

  const assignDriver = useCallback((orderId: string, driverId: string) => {
    const driver = MOCK_DRIVERS.find(d => d.id === driverId);
    if (!driver) return;
    setOrders(prev => assignDriverModel(prev, orderId, driver));
  }, []);

  const updateStatus = useCallback(
    (orderId: string, status: FullOrderStatus) =>
      setOrders(prev => updateStatusModel(prev, orderId, status)),
    []
  );

  const setProofOfDelivery = useCallback(
    (orderId: string, proof: string) =>
      setOrders(prev => setProofOfDeliveryModel(prev, orderId, proof)),
    []
  );

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
