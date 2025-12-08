'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import type { Order } from '@/components/order-list';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from './AuthContext';

interface OrderContextType {
  orders: Order[];
  allOrders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'orderDate' | 'userId'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string, userId: string) => Promise<void>;
  loading: boolean;
  loadingAdmin: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const { profile, loading: profileLoading } = useAuth();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (profileLoading || !firestore || !user) {
      return null;
    }
    // All users, including admins, fetch from their own nested collection for the main app view.
    return query(collection(firestore, `users/${user.uid}/orders`), orderBy("orderDate", "desc"));
  }, [user, firestore, profileLoading]);
  
  const { data: ordersData, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

  // Admin-specific logic for fetching all orders. This should be used carefully on admin pages.
   const adminOrdersQuery = useMemoFirebase(async () => {
    if (profileLoading || !firestore || !user || !profile || profile.role !== 'admin') {
      return [];
    }
    
    // In a real-world, large-scale app, this is inefficient.
    // A better approach would be a separate 'allOrders' collection managed by backend functions.
    // For this project, we will fetch users and then their orders.
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    const allOrders: Order[] = [];
    for (const userDoc of usersSnapshot.docs) {
      const ordersSnapshot = await getDocs(collection(firestore, `users/${userDoc.id}/orders`));
      ordersSnapshot.forEach(orderDoc => {
        allOrders.push({ id: orderDoc.id, ...orderDoc.data() } as Order);
      });
    }
    return allOrders.sort((a, b) => b.orderDate.toMillis() - a.orderDate.toMillis());
  }, [firestore, profile, profileLoading, user]);

  const [allOrders, setAllOrders] = React.useState<Order[]>([]);
  const [loadingAdmin, setLoadingAdmin] = React.useState(true);

  React.useEffect(() => {
      adminOrdersQuery.then(data => {
          setAllOrders(data);
          setLoadingAdmin(false);
      })
  }, [adminOrdersQuery]);

  const addOrder = async (newOrderData: Omit<Order, 'id' | 'orderDate' | 'userId'>) => {
    if (!user || !firestore) return;

    const orderPayload = {
      ...newOrderData,
      orderDate: serverTimestamp(),
      userId: user.uid,
    };
    
    const ordersColRef = collection(firestore, `users/${user.uid}/orders`);
    addDoc(ordersColRef, orderPayload).catch(err => {
      console.error("Add order failed:", err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${user.uid}/orders`,
        operation: 'create',
        requestResourceData: orderPayload,
      }));
    });
  };

  const updateOrderStatus = async (orderId: string, status: string, userId: string) => {
    if (!firestore) return;

    // Admin updates the order in the specific user's subcollection.
    const orderRef = doc(firestore, `users/${userId}/orders`, orderId);
    
    updateDoc(orderRef, { status }).catch(err => {
        console.error("Order status update failed:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${userId}/orders/${orderId}`,
        operation: 'update',
        requestResourceData: { status },
        }));
    });
  };
  
  const memoizedOrders = useMemo(() => ordersData || [], [ordersData]);
  const isLoadingCombined = profileLoading || ordersLoading;

  return (
    <OrderContext.Provider value={{ orders: memoizedOrders, allOrders, addOrder, updateOrderStatus, loading: isLoadingCombined, loadingAdmin }}>
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
