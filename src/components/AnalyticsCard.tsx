"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, Users, Utensils } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Mock data for analytics (In a real app, this would use hooks like useMarketListings)
const mockAnalytics = {
  totalListings: 145,
  activeUsers: 89,
  foodOrdersLastWeek: 42,
  totalTransactions: 210,
};

const AnalyticsCard = () => {
  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-secondary-neon" /> Campus Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground mb-3">Real-time insights into campus activity.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 p-2 border border-border rounded-md bg-background">
            <div className="flex items-center text-sm font-medium text-foreground">
              <Package className="h-4 w-4 mr-2 text-blue-500" /> Listings
            </div>
            <p className="text-2xl font-bold text-secondary-neon">{mockAnalytics.totalListings}</p>
            <p className="text-xs text-muted-foreground">Total Exchange Items</p>
          </div>
          <div className="space-y-1 p-2 border border-border rounded-md bg-background">
            <div className="flex items-center text-sm font-medium text-foreground">
              <Users className="h-4 w-4 mr-2 text-purple-500" /> Users
            </div>
            <p className="text-2xl font-bold text-secondary-neon">{mockAnalytics.activeUsers}</p>
            <p className="text-xs text-muted-foreground">Active This Week</p>
          </div>
          <div className="space-y-1 p-2 border border-border rounded-md bg-background">
            <div className="flex items-center text-sm font-medium text-foreground">
              <Utensils className="h-4 w-4 mr-2 text-red-500" /> Food Orders
            </div>
            <p className="text-2xl font-bold text-secondary-neon">{mockAnalytics.foodOrdersLastWeek}</p>
            <p className="text-xs text-muted-foreground">Last 7 Days</p>
          </div>
          <div className="space-y-1 p-2 border border-border rounded-md bg-background">
            <div className="flex items-center text-sm font-medium text-foreground">
              <TrendingUp className="h-4 w-4 mr-2 text-green-500" /> Transactions
            </div>
            <p className="text-2xl font-bold text-secondary-neon">{mockAnalytics.totalTransactions}</p>
            <p className="text-xs text-muted-foreground">Total Completed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsCard;