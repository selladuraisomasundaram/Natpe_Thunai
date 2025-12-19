"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, Utensils, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { Query, Models } from "appwrite";
import { Transaction } from "@/hooks/useTotalTransactions"; // Re-use Transaction type
import { FoodOrder } from "@/hooks/useFoodOrders"; // Re-use FoodOrder type
import { MadeWithDyad } from "@/components/made-with-dyad";

const TrackingPage = () => {
  const { user, userProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user && userProfile?.collegeName) {
      fetchTrackingData(user.$id, userProfile.collegeName);
    } else if (!user) {
      setIsLoading(false);
      setError("Please log in to view your tracking data.");
    }
  }, [user, userProfile]);

  const fetchTrackingData = async (userId: string, collegeName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch Transactions
      const transactionsResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.or([Query.equal('buyerId', userId), Query.equal('sellerId', userId)]),
          Query.equal('collegeName', collegeName),
          Query.orderDesc('$createdAt'),
        ]
      );
      setTransactions(transactionsResponse.documents as unknown as Transaction[]);

      // Fetch Food Orders
      const foodOrdersResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        [
          Query.or([Query.equal('buyerId', userId), Query.equal('sellerId', userId)]),
          Query.equal('collegeName', collegeName),
          Query.orderDesc('$createdAt'),
        ]
      );
      setFoodOrders(foodOrdersResponse.documents as unknown as FoodOrder[]);

    } catch (e: any) {
      console.error("Error fetching tracking data:", e);
      setError(e.message || "Failed to load tracking data.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
      case 'initiated':
        return "bg-yellow-500 text-white";
      case 'accepted':
      case 'payment_confirmed_to_developer':
      case 'commission_deducted':
        return "bg-blue-500 text-white";
      case 'completed':
      case 'paid_to_seller':
        return "bg-green-500 text-white";
      case 'rejected':
      case 'failed':
      case 'cancelled':
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-neon" />
        <p className="ml-3 text-muted-foreground">Loading your tracking data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 flex items-center justify-center">
        <p className="text-center text-destructive text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">My Tracking</h1>
      <div className="max-w-2xl mx-auto space-y-6">
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card text-card-foreground">
            <TabsTrigger value="transactions" className="flex items-center justify-center gap-2">
              <DollarSign className="h-4 w-4" /> Transactions
            </TabsTrigger>
            <TabsTrigger value="food-orders" className="flex items-center justify-center gap-2">
              <Utensils className="h-4 w-4" /> Food Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4">
            <Card className="bg-card text-card-foreground shadow-lg border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl font-semibold text-card-foreground">My Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <div key={tx.$id} className="p-3 border border-border rounded-md bg-background">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-foreground">
                          {tx.itemType === 'food-offering' ? 'Food Order' :
                           tx.itemType === 'errand' ? 'Errand' :
                           tx.itemType === 'exchange-listing' ? 'Exchange' :
                           tx.itemType === 'cash-exchange' ? 'Cash Exchange' : 'Transaction'}
                        </h3>
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusClass(tx.status))}>
                          {tx.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Amount: <span className="font-medium text-foreground">${tx.amount.toFixed(2)}</span></p>
                      <p className="text-xs text-muted-foreground">Date: {new Date(tx.timestamp).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">Role: {tx.buyerId === user?.$id ? 'Buyer' : 'Seller'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No transactions found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="food-orders" className="mt-4">
            <Card className="bg-card text-card-foreground shadow-lg border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl font-semibold text-card-foreground">My Food Orders</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {foodOrders.length > 0 ? (
                  foodOrders.map((order) => (
                    <div key={order.$id} className="p-3 border border-border rounded-md bg-background">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-foreground">{order.offeringTitle}</h3>
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusClass(order.status))}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Quantity: {order.quantity}</p>
                      <p className="text-sm text-muted-foreground">Total: <span className="font-medium text-foreground">${order.totalPrice.toFixed(2)}</span></p>
                      <p className="text-xs text-muted-foreground">Date: {new Date(order.$createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">Role: {order.buyerId === user?.$id ? 'Buyer' : 'Seller'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No food orders found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;