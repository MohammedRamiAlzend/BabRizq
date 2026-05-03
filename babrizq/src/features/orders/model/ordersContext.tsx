import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ALL_ORDERS, FullOrder, FullOrderStatus, MOCK_DRIVERS } from '~/entities/fulfillmentData';

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
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, assignedDriverId: driverId, assignedDriverEn: driver.nameEn, assignedDriverAr: driver.nameAr, status: 'assigned' as FullOrderStatus }
        : o
    ));
  }, []);

  const updateStatus = useCallback((orderId: string, status: FullOrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }, []);

  const setProofOfDelivery = useCallback((orderId: string, proof: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, proofOfDelivery: proof } : o));
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









