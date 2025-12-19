"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query, Models } from 'appwrite';
import { Transaction } from './useTotalTransactions'; // Re-use Transaction type
import { FoodOrder } from './useFoodOrders'; // Re-use FoodOrder type

export const useWalletBalance = (userId?: string) => {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!userId) {
      setBalance(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Fetch transactions where user is seller and transaction is completed
      const sellerTransactions = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.equal('sellerId', userId),
          Query.equal('status', 'paid_to_seller'),
        ]
      );

      // Fetch transactions where user is buyer and transaction is completed
      const buyerTransactions = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.equal('buyerId', userId),
          Query.equal('status', 'payment_confirmed_to_developer'), // Or 'paid_to_seller' if buyer pays directly
        ]
      );

      let totalEarned = 0;
      sellerTransactions.documents.forEach((doc: Models.Document) => {
        const tx = doc as Transaction;
        totalEarned += tx.amount - tx.commission; // Amount received after commission
      });

      let totalSpent = 0;
      buyerTransactions.documents.forEach((doc: Models.Document) => {
        const tx = doc as Transaction;
        totalSpent += tx.amount;
      });

      setBalance(totalEarned - totalSpent);

    } catch (e: any) {
      console.error("Error fetching wallet balance:", e);
      setError(e.message || "Failed to load wallet balance.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, isLoading, error, refetch: fetchBalance };
};