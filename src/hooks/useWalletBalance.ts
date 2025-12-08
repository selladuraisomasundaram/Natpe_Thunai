"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query, Models } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { MarketTransactionItem, FoodOrderItem } from '@/pages/TrackingPage';

interface WalletBalanceState {
  earnedBalance: number;
  spentBalance: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useWalletBalance = (): WalletBalanceState => {
  const { user } = useAuth();
  const [earnedBalance, setEarnedBalance] = useState(0);
  const [spentBalance, setSpentBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!user?.$id) {
      setEarnedBalance(0);
      setSpentBalance(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    let totalEarned = 0;
    let totalSpent = 0;

    try {
      // Fetch Market Transactions (Buy/Sell)
      const marketTransactionsResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.or([
            Query.equal('buyerId', user.$id),
            Query.equal('sellerId', user.$id)
          ]),
          Query.limit(100)
        ]
      );

      marketTransactionsResponse.documents.forEach((doc: Models.Document) => {
        const tx = doc as unknown as MarketTransactionItem;
        if (tx.sellerId === user.$id && tx.status === 'paid_to_seller' && tx.netSellerAmount !== undefined) {
          totalEarned += tx.netSellerAmount;
        }
        if (tx.buyerId === user.$id && tx.status !== 'failed') {
          totalSpent += tx.amount;
        }
      });

      // Fetch Food Orders
      const foodOrdersResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        [
          Query.or([
            Query.equal('buyerId', user.$id),
            Query.equal('providerId', user.$id)
          ]),
          Query.limit(100)
        ]
      );

      foodOrdersResponse.documents.forEach((doc: Models.Document) => {
        const order = doc as unknown as FoodOrderItem;
        if (order.providerId === user.$id && order.status === 'Delivered') {
          totalEarned += order.totalAmount;
        }
        if (order.buyerId === user.$id && order.status === 'Delivered') {
          totalSpent += order.totalAmount;
        }
      });

      setEarnedBalance(totalEarned);
      setSpentBalance(totalSpent);

    } catch (err: any) {
      console.error("Error fetching wallet balances:", err);
      setError(err.message || "Failed to load wallet balances.");
      toast.error("Failed to load wallet balances.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalances();

    const unsubscribeTransactions = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`,
      () => {
        fetchBalances();
      }
    );

    const unsubscribeFoodOrders = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_FOOD_ORDERS_COLLECTION_ID}.documents`,
      () => {
        fetchBalances();
      }
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeFoodOrders();
    };
  }, [fetchBalances]);

  return { earnedBalance, spentBalance, isLoading, error, refetch: fetchBalances };
};