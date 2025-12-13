"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MarketTransactionItem, FoodOrderItem } from '@/types/activity'; // Corrected import path

// Placeholder for fetching wallet balance from Appwrite
const fetchWalletBalance = async (userId: string): Promise<number> => {
  // In a real application, you would fetch this from your Appwrite database
  // For now, we'll return a mock value
  console.log(`Fetching wallet balance for user: ${userId}`);
  return new Promise((resolve) => setTimeout(() => resolve(1500.75), 500)); // Mock API call
};

// Placeholder for fetching recent transactions
const fetchRecentTransactions = async (userId: string): Promise<(MarketTransactionItem | FoodOrderItem)[]> => {
  // In a real application, you would fetch this from your Appwrite database
  // For now, we'll return mock data
  console.log(`Fetching recent transactions for user: ${userId}`);
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve([
          {
            id: 'mkt-001',
            itemName: 'Textbook: Calculus I',
            sellerName: 'Alice Johnson',
            buyerName: 'You',
            amount: 350.00,
            date: '2023-10-26T10:00:00Z',
            status: 'completed',
          },
          {
            id: 'food-001',
            restaurantName: 'Campus Cafe',
            items: ['Latte', 'Croissant'],
            totalAmount: 120.50,
            date: '2023-10-25T14:30:00Z',
            status: 'delivered',
          },
          {
            id: 'mkt-002',
            itemName: 'Gaming Mouse',
            sellerName: 'You',
            buyerName: 'Bob Williams',
            amount: 800.00,
            date: '2023-10-24T18:00:00Z',
            status: 'pending',
          },
          {
            id: 'mkt-003',
            itemName: 'Used Bicycle',
            sellerName: 'You',
            buyerName: 'Charlie Brown',
            amount: 2000.00,
            date: '2023-10-23T12:00:00Z',
            status: 'completed',
          },
          {
            id: 'food-002',
            restaurantName: 'Pizza Palace',
            items: ['Large Pizza'],
            totalAmount: 450.00,
            date: '2023-10-22T19:00:00Z',
            status: 'delivered',
          },
        ]),
      700
    )
  );
};

export const useWalletBalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<(MarketTransactionItem | FoodOrderItem)[]>([]);
  const [earnedBalance, setEarnedBalance] = useState<number>(0);
  const [spentBalance, setSpentBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWalletData = async () => {
      if (!user?.$id) {
        setBalance(null);
        setTransactions([]);
        setEarnedBalance(0);
        setSpentBalance(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [userBalance, userTransactions] = await Promise.all([
          fetchWalletBalance(user.$id),
          fetchRecentTransactions(user.$id),
        ]);
        setBalance(userBalance);
        setTransactions(userTransactions);

        let totalEarned = 0;
        let totalSpent = 0;

        userTransactions.forEach(tx => {
          if ('buyerName' in tx && tx.buyerName === 'You' && tx.status === 'completed') {
            totalSpent += tx.amount;
          } else if ('sellerName' in tx && tx.sellerName === 'You' && tx.status === 'completed') {
            totalEarned += tx.amount;
          } else if ('restaurantName' in tx && tx.status === 'delivered') {
            totalSpent += tx.totalAmount;
          }
        });

        setEarnedBalance(totalEarned);
        setSpentBalance(totalSpent);

      } catch (err: any) {
        console.error("Failed to load wallet data:", err);
        setError(err.message || "Failed to load wallet data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadWalletData();
  }, [user?.$id]);

  return { balance, transactions, earnedBalance, spentBalance, isLoading, error };
};