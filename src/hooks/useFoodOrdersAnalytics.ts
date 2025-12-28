"use client";

import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, Models } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import { subDays, format } from 'date-fns';
import toast from 'react-hot-toast'; // Ensure toast is imported

interface FoodOrdersAnalyticsState {
  foodOrdersLastWeek: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default_database_id';
const FOOD_ORDERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_FOOD_ORDERS_COLLECTION_ID || 'food_orders';

export const useFoodOrdersAnalytics = (collegeNameFilter?: string): FoodOrdersAnalyticsState => {
  const { userPreferences, loading: isAuthLoading } = useAuth();
  const [foodOrdersLastWeek, setFoodOrdersLastWeek] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveCollegeNameFilter = collegeNameFilter || userPreferences?.collegeName;

  const fetchFoodOrdersAnalytics = useCallback(async () => {
    if (isAuthLoading) return; // Wait for auth to load

    setIsLoading(true);
    setError(null);
    try {
      const sevenDaysAgo = subDays(new Date(), 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      let queries = [
        Query.greaterThan('$createdAt', sevenDaysAgoISO),
        Query.equal('status', 'Delivered'), // Only count delivered orders
      ];

      if (effectiveCollegeNameFilter) {
        queries.push(Query.equal('collegeName', effectiveCollegeNameFilter));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        FOOD_ORDERS_COLLECTION_ID,
        queries
      );
      setFoodOrdersLastWeek(response.total);
    } catch (err: any) {
      console.error("Failed to fetch food orders analytics:", err);
      setError(err.message || "Failed to fetch food orders analytics.");
      toast.error(err.message || "Failed to fetch food orders analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [effectiveCollegeNameFilter, isAuthLoading]);

  useEffect(() => {
    fetchFoodOrdersAnalytics();
  }, [fetchFoodOrdersAnalytics]);

  return { foodOrdersLastWeek, isLoading, error, refetch: fetchFoodOrdersAnalytics };
};