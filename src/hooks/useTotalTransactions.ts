"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from '@/lib/appwrite';
import { Query, Models } from 'appwrite';

export interface Transaction extends Models.Document {
  buyerId: string;
  sellerId: string;
  itemId: string;
  itemType: 'food-offering' | 'errand' | 'exchange-listing' | 'cash-exchange';
  amount: number;
  commission: number;
  status: 'initiated' | 'payment_confirmed_to_developer' | 'commission_deducted' | 'paid_to_seller' | 'failed';
  timestamp: string;
  collegeName: string;
}

export const useTotalTransactions = (collegeName?: string) => {
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalTransactions = useCallback(async () => {
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
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        queries
      );

      const transactions = response.documents as unknown as Transaction[]; // Corrected type assertion

      let totalCount = 0;
      let totalAmount = 0;

      transactions.forEach(transaction => {
        totalCount++;
        totalAmount += transaction.amount;
      });

      setTotalTransactions(totalCount);
      setTotalValue(totalAmount);

    } catch (e: any) {
      console.error("Error fetching total transactions:", e);
      setError(e.message || "Failed to load total transactions.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeName]);

  useEffect(() => {
    fetchTotalTransactions();
  }, [fetchTotalTransactions]);

  return { totalTransactions, totalValue, isLoading, error, refetch: fetchTotalTransactions };
};