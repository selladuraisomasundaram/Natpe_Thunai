"use client";

import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, Models } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; // Ensure toast is imported

interface TotalTransactionsState {
  totalTransactions: number;
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
const MARKET_TRANSACTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MARKET_TRANSACTIONS_COLLECTION_ID || 'market_transactions';
const SERVICE_TRANSACTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SERVICE_TRANSACTIONS_COLLECTION_ID || 'service_transactions';
const FOOD_ORDERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_FOOD_ORDERS_COLLECTION_ID || 'food_orders';

export const useTotalTransactions = (collegeNameFilter?: string): TotalTransactionsState => {
  const { userPreferences, loading: isAuthLoading } = useAuth();
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveCollegeNameFilter = collegeNameFilter || userPreferences?.collegeName;

  const fetchTotalTransactions = useCallback(async () => {
    if (isAuthLoading) return; // Wait for auth to load

    setIsLoading(true);
    setError(null);
    try {
      let queries = [
        Query.equal('status', 'completed') // Only count completed transactions
      ];

      if (effectiveCollegeNameFilter) {
        queries.push(Query.equal('collegeName', effectiveCollegeNameFilter));
      }

      const marketResponse = await databases.listDocuments(
        DATABASE_ID,
        MARKET_TRANSACTIONS_COLLECTION_ID,
        queries
      );

      const serviceResponse = await databases.listDocuments(
        DATABASE_ID,
        SERVICE_TRANSACTIONS_COLLECTION_ID,
        queries
      );

      const foodResponse = await databases.listDocuments(
        DATABASE_ID,
        FOOD_ORDERS_COLLECTION_ID,
        queries
      );

      setTotalTransactions(marketResponse.total + serviceResponse.total + foodResponse.total);
    } catch (err: any) {
      console.error("Failed to fetch total transactions:", err);
      setError(err.message || "Failed to fetch total transactions.");
      toast.error(err.message || "Failed to fetch total transactions.");
    } finally {
      setIsLoading(false);
    }
  }, [effectiveCollegeNameFilter, isAuthLoading]);

  useEffect(() => {
    fetchTotalTransactions();
  }, [fetchTotalTransactions]);

  return { totalTransactions, isLoading, error, refetch: fetchTotalTransactions };
};