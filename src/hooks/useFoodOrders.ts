"use client";

import { useState, useEffect } from 'react';
import { Databases, Query, Models, ID } from 'appwrite';
import { client } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AppwriteDocument } from '@/types/appwrite';

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const FOOD_ORDERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FOOD_ORDERS_COLLECTION_ID;

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'picked_up' | 'cancelled';

export interface FoodOrder extends AppwriteDocument {
  offeringId: string;
  offeringName: string;
  canteenName: string;
  collegeName: string;
  buyerId: string;
  buyerName: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  pickupTime: string; // e.g., "12:30 PM"
  notes?: string;
}

const useFoodOrders = () => {
  const { user, userPreferences } = useAuth();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (userPreferences?.collegeName && userPreferences.collegeName !== 'N/A') {
        queries.push(Query.equal('collegeName', userPreferences.collegeName));
      }
      queries.push(Query.equal('buyerId', user.$id));

      const response = await databases.listDocuments(
        DATABASE_ID,
        FOOD_ORDERS_COLLECTION_ID,
        queries
      );
      setOrders(response.documents as FoodOrder[]); // Type assertion is now safer
    } catch (err: any) {
      setError('Failed to fetch food orders.');
      console.error('Error fetching food orders:', err);
      toast.error('Failed to load food orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, userPreferences?.collegeName]);

  const placeOrder = async (
    offeringId: string,
    offeringName: string,
    canteenName: string,
    quantity: number,
    totalPrice: number,
    pickupTime: string,
    notes?: string
  ) => {
    if (!user || !userPreferences) {
      toast.error("You must be logged in to place an order.");
      return;
    }

    try {
      const newOrder = await databases.createDocument(
        DATABASE_ID,
        FOOD_ORDERS_COLLECTION_ID,
        ID.unique(),
        {
          offeringId,
          offeringName,
          canteenName,
          collegeName: userPreferences.collegeName,
          buyerId: user.$id,
          buyerName: user.name,
          quantity,
          totalPrice,
          status: 'pending',
          pickupTime,
          notes,
        },
        [
          Models.Permission.read(Models.Role.user(user.$id)),
          Models.Permission.write(Models.Role.user(user.$id)),
          // Potentially add read/write for canteen manager role
        ]
      );
      setOrders(prev => [newOrder as FoodOrder, ...prev]); // Type assertion is now safer
      toast.success("Order placed successfully!");
    } catch (err: any) {
      toast.error("Failed to place order: " + err.message);
      console.error("Error placing order:", err);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!user) {
      toast.error("You must be logged in to update order status.");
      return;
    }
    try {
      await databases.updateDocument(
        DATABASE_ID,
        FOOD_ORDERS_COLLECTION_ID,
        orderId,
        { status: newStatus },
        [Models.Permission.write(Models.Role.user(user.$id))] // Only buyer or canteen manager can update
      );
      setOrders(prev =>
        prev.map(order =>
          order.$id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success("Order status updated.");
    } catch (err: any) {
      toast.error("Failed to update order status: " + err.message);
      console.error("Error updating order status:", err);
    }
  };

  return { orders, isLoading, error, refetch: fetchOrders, placeOrder, updateOrderStatus };
};

export default useFoodOrders;