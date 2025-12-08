'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import type { Order } from '@/components/order-list';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, orderBy, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from './AuthContext';

interface OrderContextType {
  orders: Order[];
  allOrders: Order[]; // For admin view
  addOrder: (order: Omit<Order, 'id' | 'orderDate'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string, userId: string) => Promise<void>; // Add userId for pathing
  loading: boolean;
  loadingAdmin: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const { profile, loading: profileLoading } = useAuth();
  const firestore = useFirestore();
  
  // --- Customer-specific orders query ---
  const userOrdersQuery = useMemoFirebase(() => {
    if (profileLoading || !user || !firestore || profile?.role === 'admin') {
      return null;
    }
    // Query the nested collection for the logged-in user
    return query(collection(firestore, `users/${user.uid}/orders`), orderBy("orderDate", "desc"));
  }, [user, firestore, profile, profileLoading]);

  const { data: ordersData, isLoading: loading } = useCollection<Order>(userOrdersQuery);

  // --- Admin query for all orders ---
  const allOrdersQuery = useMemoFirebase(() => {
    if (profileLoading || !firestore || profile?.role !== 'admin') {
      return null;
    }
    // Admin fetches from the top-level 'orders' collection
    return query(collection(firestore, 'orders'), orderBy("orderDate", "desc"));
  }, [firestore, profile, profileLoading]);

  const { data: allOrdersData, isLoading: loadingAdmin } = useCollection<Order>(allOrdersQuery);

  const addOrder = async (newOrderData: Omit<Order, 'id' | 'orderDate'>) => {
    if (!user || !firestore) return;

    const orderPayload = {
      ...newOrderData,
      orderDate: serverTimestamp(),
    };

    // Use a batch write to add the order to both locations atomically
    const batch = writeBatch(firestore);

    // 1. Add to the user's private subcollection
    const userOrderRef = doc(collection(firestore, `users/${user.uid}/orders`));
    batch.set(userOrderRef, orderPayload);

    // 2. Add to the global collection for admin view
    const globalOrderRef = doc(collection(firestore, 'orders'));
    batch.set(globalOrderRef, orderPayload);

    // Commit the batch
    batch.commit().catch(err => {
      console.error("Batch write failed:", err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${user.uid}/orders and /orders`,
        operation: 'create',
        requestResourceData: orderPayload,
      }));
    });
  };

  const updateOrderStatus = async (orderId: string, status: string, userId: string) => {
    if (!firestore || !profile || profile.role !== 'admin') return;

    const batch = writeBatch(firestore);
    
    // 1. Update in the global 'orders' collection
    const globalOrderRef = doc(firestore, 'orders', orderId);
    batch.update(globalOrderRef, { status });

    // 2. Update in the user's private subcollection
    // NOTE: This assumes the `orderId` is consistent between the two collections.
    // A robust implementation might require querying to find the corresponding doc.
    const userOrderRef = doc(firestore, `users/${userId}/orders`, orderId);
    batch.update(userOrderRef, { status });
    
    batch.commit().catch(err => {
        console.error("Order status update failed:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `orders/${orderId}`,
        operation: 'update',
        requestResourceData: { status },
        }));
    });
  };
  
  const memoizedOrders = useMemo(() => ordersData || [], [ordersData]);
  const memoizedAllOrders = useMemo(() => allOrdersData || [], [allOrdersData]);

  const isLoadingCombined = profileLoading || loading;
  const isAdminLoadingCombined = profileLoading || loadingAdmin;

  return (
    <OrderContext.Provider value={{ orders: memoizedOrders, allOrders: memoizedAllOrders, addOrder, updateOrderStatus, loading: isLoadingCombined, loadingAdmin: isAdminLoadingCombined }}>
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
