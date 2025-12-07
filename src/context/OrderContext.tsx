'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { Order } from '@/components/order-list';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'orderDate'>) => void;
  updateOrderStatus: (orderId: string, status: string) => void;
  loading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const ordersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/orders`);
  }, [user, firestore]);

  const { data: orders, isLoading: loading, error } = useCollection<Order>(ordersQuery);

  const addOrder = async (newOrderData: Omit<Order, 'id'| 'orderDate'>) => {
    if (!user || !firestore) return;

    const ordersCollectionRef = collection(firestore, 'orders');
    
    try {
      await addDoc(ordersCollectionRef, {
        ...newOrderData,
        orderDate: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error adding order:", e);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (!firestore) return;

    const orderDocRef = doc(firestore, 'orders', orderId);

    try {
       await updateDoc(orderDocRef, { status });
    } catch (e) {
       console.error('Error updating order status:', e);
    }
  };
  
  const memoizedOrders = useMemo(() => orders || [], [orders]);

  return (
    <OrderContext.Provider value={{ orders: memoizedOrders, addOrder, updateOrderStatus, loading }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
