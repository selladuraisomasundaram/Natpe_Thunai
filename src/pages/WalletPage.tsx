"use client";

import React from 'react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Wallet as WalletIcon } from 'lucide-react';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { MarketTransactionItem, FoodOrderItem } from '@/types/activity';

const WalletPage = () => {
  const { balance, transactions, earnedBalance, spentBalance, isLoading, error } = useWalletBalance();

  const renderTransactionItem = (item: MarketTransactionItem | FoodOrderItem) => {
    const isMarketItem = 'itemName' in item;
    const isEarned = isMarketItem && item.sellerName === 'You' && item.status === 'completed';
    const isSpent = (isMarketItem && item.buyerName === 'You' && item.status === 'completed') || (!isMarketItem && item.status === 'delivered');

    return (
      <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
        <div className="flex items-center gap-3">
          {isEarned ? (
            <TrendingUp className="h-5 w-5 text-green-500" />
          ) : isSpent ? (
            <TrendingDown className="h-5 w-5 text-red-500" />
          ) : (
            <WalletIcon className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium text-foreground">
              {isMarketItem ? item.itemName : item.restaurantName}
            </p>
            <p className="text-sm text-muted-foreground">
              {isMarketItem
                ? `Transaction with ${item.sellerName === 'You' ? item.buyerName : item.sellerName}`
                : `Order: ${item.items.join(', ')}`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "font-semibold",
            isEarned && "text-green-500",
            isSpent && "text-red-500"
          )}>
            {isEarned ? '+' : isSpent ? '-' : ''}₹{(isMarketItem ? item.amount : item.totalAmount).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(item.date).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">My Wallet</h1>

      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-gradient-to-br from-primary-blue-light to-secondary-neon text-white shadow-lg border-none">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <WalletIcon className="h-10 w-10 text-white/80" />
            <p className="text-lg font-medium text-white/90">Current Balance</p>
            {isLoading ? (
              <Skeleton className="h-10 w-40 bg-white/30" />
            ) : error ? (
              <p className="text-xl font-bold text-red-300">Error</p>
            ) : (
              <p className="text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
                ₹{balance?.toFixed(2) || '0.00'}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <div className="text-2xl font-bold text-foreground">₹{earnedBalance.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Spent</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <div className="text-2xl font-bold text-foreground">₹{spentBalance.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading transactions: {error}</p>
            ) : transactions.length > 0 ? (
              <div className="divide-y divide-border">
                {transactions.map(renderTransactionItem)}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent transactions.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default WalletPage;