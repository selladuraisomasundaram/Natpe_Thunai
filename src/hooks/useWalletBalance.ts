"use client";

import { useState, useEffect } from 'react';
import { Databases, Query, Models } from 'appwrite';
import { client } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AppwriteDocument } from '@/types/appwrite';

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const MARKET_TRANSACTIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MARKET_TRANSACTIONS_COLLECTION_ID;
const FOOD_ORDERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FOOD_ORDERS_COLLECTION_ID;

// Define these interfaces here or import from a shared types file
export interface MarketTransactionItem extends AppwriteDocument {
  productId: string;
  productTitle: string;
  sellerId: string;
  buyerId: string;
  amount: number;
  transactionType: 'sale' | 'purchase';
  status: 'completed' | 'pending' | 'cancelled';
  collegeName: string;
}

export interface FoodOrderItem extends AppwriteDocument {
  offeringId: string;
  offeringName: string;
  canteenName: string;
  buyerId: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'preparing' | 'ready' | 'picked_up' | 'cancelled';
  collegeName: string;
}

const useWalletBalance = () => {
  const { user, userPreferences } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<MarketTransactionItem[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = async () => {
    setIsLoading(true);
    setError(null);
    if (!user) {
      setBalance(0);
      setTransactions([]);
      setFoodOrders([]);
      setIsLoading(false);
      return;
    }

    try {
      const commonQueries = [Query.orderDesc('$createdAt')];
      if (userPreferences?.collegeName && userPreferences.collegeName !== 'N/A') {
        commonQueries.push(Query.equal('collegeName', userPreferences.collegeName));
      }

      // Fetch market transactions
      const marketTransactionsResponse = await databases.listDocuments(
        DATABASE_ID,
        MARKET_TRANSACTIONS_COLLECTION_ID,
        [
          ...commonQueries,
          Query.or([
            Query.equal('buyerId', user.$id),
            Query.equal('sellerId', user.$id)
          ])
        ]
      );
      const fetchedTransactions = marketTransactionsResponse.documents as MarketTransactionItem[];
      setTransactions(fetchedTransactions);

      // Fetch food orders
      const foodOrdersResponse = await databases.listDocuments(
        DATABASE_ID,
        FOOD_ORDERS_COLLECTION_ID,
        [
          ...commonQueries,
          Query.equal('buyerId', user.$id)
        ]
      );
      const fetchedFoodOrders = foodOrdersResponse.documents as FoodOrderItem[];
      setFoodOrders(fetchedFoodOrders);

      // Calculate balance (simplified example)
      let currentBalance = 0;
      fetchedTransactions.forEach(tx => {
        if (tx.status === 'completed') {
          if (tx.buyerId === user.$id) {
            currentBalance -= tx.amount; // Buyer spends
          } else if (tx.sellerId === user.$id) {
            currentBalance += tx.amount; // Seller earns
          }
        }
      });
      // Deduct for food orders (assuming they are paid from wallet)
      fetchedFoodOrders.forEach(order => {
        if (order.status === 'picked_up') { // Only deduct if picked up
          currentBalance -= order.totalPrice;
        }
      });

      setBalance(currentBalance);

    } catch (err: any) {
      setError('Failed to fetch wallet data.');
      console.error('Error fetching wallet data:', err);
      toast.error('Failed to load wallet data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user, userPreferences?.collegeName]);

  return { balance, transactions, foodOrders, isLoading, error, refetch: fetchWalletData };
};

export default useWalletBalance;