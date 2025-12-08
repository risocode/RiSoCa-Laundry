'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import type { Order } from '@/components/order-list';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from './AuthContext';

interface OrderContextType {
  orders: Order[]; // Customer's own orders
  allOrders: Order[]; // Aggregated orders for admin
  addOrder: (order: Omit<Order, 'id' | 'orderDate'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string, userId: string) => Promise<void>;
  loading: boolean; // Loading state for customer orders
  loadingAdmin: boolean; // Loading state for admin orders
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const { profile, loading: profileLoading } = useAuth();
  const firestore = useFirestore();

  // --- Customer-specific data fetching ---
  const customerOrdersQuery = useMemoFirebase(() => {
    // Only create the query if we are certain the user is a logged-in customer.
    if (profileLoading || !firestore || !user || profile?.role === 'admin') {
      return null;
    }
    return query(collection(firestore, `users/${user.uid}/orders`), orderBy("orderDate", "desc"));
  }, [firestore, user, profile, profileLoading]);
  
  const { data: customerOrdersData, isLoading: customerOrdersLoading } = useCollection<Order>(customerOrdersQuery);

  // --- Admin-specific data fetching ---
  const adminOrdersQuery = useMemoFirebase(() => {
    // Only create the query if we are certain the user is an admin.
    if (profileLoading || !firestore || !profile || profile.role !== 'admin') {
      return null;
    }
    return query(collection(firestore, 'orders'), orderBy("orderDate", "desc"));
  }, [firestore, profile, profileLoading]);

  const { data: allOrdersData, isLoading: adminOrdersLoading } = useCollection<Order>(adminOrdersQuery);


  const addOrder = async (newOrderData: Omit<Order, 'id' | 'orderDate'>) => {
    if (!user || !firestore) return;

    const orderPayload = {
      ...newOrderData,
      orderDate: serverTimestamp(),
      userId: user.uid,
    };
    
    const newOrderId = doc(collection(firestore, 'id_generator')).id;

    const userOrderRef = doc(firestore, `users/${user.uid}/orders`, newOrderId);
    const adminOrderRef = doc(firestore, 'orders', newOrderId);

    const batch = writeBatch(firestore);
    
    batch.set(userOrderRef, { ...orderPayload, id: newOrderId });
    batch.set(adminOrderRef, { ...orderPayload, id: newOrderId });

    batch.commit().catch(err => {
      console.error("Batch order creation failed:", err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${user.uid}/orders`,
        operation: 'create',
        requestResourceData: orderPayload,
      }));
    });
  };

  const updateOrderStatus = async (orderId: string, status: string, userId: string) => {
    if (!firestore || !userId) return;

    const userOrderRef = doc(firestore, `users/${userId}/orders`, orderId);
    const adminOrderRef = doc(firestore, 'orders', orderId);

    const batch = writeBatch(firestore);

    batch.update(userOrderRef, { status });
    batch.update(adminOrderRef, { status });

    batch.commit().catch(err => {
        console.error("Order status update failed:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `orders/${orderId}`,
        operation: 'update',
        requestResourceData: { status },
        }));
    });
  };
  
  const memoizedCustomerOrders = useMemo(() => customerOrdersData || [], [customerOrdersData]);
  const memoizedAdminOrders = useMemo(() => allOrdersData || [], [allOrdersData]);
  
  return (
    <OrderContext.Provider value={{ 
        orders: memoizedCustomerOrders, 
        allOrders: memoizedAdminOrders,
        addOrder, 
        updateOrderStatus, 
        loading: customerOrdersLoading, 
        loadingAdmin: adminOrdersLoading
    }}>
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
