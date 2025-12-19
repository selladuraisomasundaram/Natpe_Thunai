"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';

export interface FoodOrder extends Models.Document {
  offeringId: string;
  offeringTitle: string;
  quantity: number;
  totalPrice: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  specialInstructions?: string;
  contactInfo: string;
  collegeName: string;
}

export const useFoodOrders = (userId?: string, collegeName?: string) => {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!collegeName) {
      setIsLoading(false);
      setError("College name is required to fetch food orders.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.equal('collegeName', collegeName)];
      if (userId) {
        queries.push(Query.or([Query.equal('buyerId', userId), Query.equal('sellerId', userId)]));
      }
      queries.push(Query.orderDesc('$createdAt'));

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        queries
      );
      setOrders(response.documents as unknown as FoodOrder[]);
    } catch (e: any) {
      console.error("Error fetching food orders:", e);
      setError(e.message || "Failed to load food orders.");
    } finally {
      setIsLoading(false);
    }
  }, [userId, collegeName]);

  const updateOrderStatus = async (orderId: string, status: FoodOrder['status']) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        orderId,
        { status }
      );
      fetchOrders(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error("Error updating order status:", e);
      setError(e.message || "Failed to update order status.");
      return false;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
    updateOrderStatus,
  };
};