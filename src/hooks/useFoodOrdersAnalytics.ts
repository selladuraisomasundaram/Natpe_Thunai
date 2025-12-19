"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export interface FoodOrder {
  $id: string;
  $createdAt: string;
  offeringId: string;
  offeringTitle: string;
  quantity: number;
  totalPrice: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  collegeName: string;
}

export const useFoodOrdersAnalytics = (collegeName?: string) => {
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFoodOrdersAnalytics = useCallback(async () => {
    if (!collegeName) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.equal('collegeName', collegeName)];
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        queries
      );

      const orders = response.documents as unknown as FoodOrder[];

      let total = 0;
      let pending = 0;
      let completed = 0;
      let revenue = 0;

      orders.forEach(order => {
        total++;
        if (order.status === 'pending') {
          pending++;
        } else if (order.status === 'completed') {
          completed++;
          revenue += order.totalPrice;
        }
      });

      setTotalOrders(total);
      setPendingOrders(pending);
      setCompletedOrders(completed);
      setTotalRevenue(revenue);

    } catch (e: any) {
      console.error("Error fetching food orders analytics:", e);
      setError(e.message || "Failed to load food orders analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeName]);

  useEffect(() => {
    fetchFoodOrdersAnalytics();
  }, [fetchFoodOrdersAnalytics]);

  return { totalOrders, pendingOrders, completedOrders, totalRevenue, isLoading, error, refetch: fetchFoodOrdersAnalytics };
};