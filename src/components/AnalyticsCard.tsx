"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext'; // NEW: Get userPreferences to access collegeName
import { useTotalUsers } from '@/hooks/useTotalUsers';
import { useFoodOrdersAnalytics } from '@/hooks/useFoodOrdersAnalytics';
import { useTotalTransactions } from '@/hooks/useTotalTransactions';
import { Loader2, Users, Utensils, DollarSign, AlertTriangle } from 'lucide-react';

const AnalyticsCard = () => {
  const { userPreferences } = useAuth(); // NEW: Get userPreferences to access collegeName
  // Determine the collegeName to pass to hooks. If developer, pass undefined to fetch all.
  const collegeNameForAnalytics = userPreferences?.isDeveloper ? undefined : userPreferences?.collegeName;

  const { totalUsers, isLoading: isLoadingUsers, error: usersError } = useTotalUsers(collegeNameForAnalytics);
  const { foodOrdersLastWeek, isLoading: isLoadingFood, error: foodError } = useFoodOrdersAnalytics(collegeNameForAnalytics);
  const { totalTransactions, isLoading: isLoadingTransactions, error: transactionsError } = useTotalTransactions(collegeNameForAnalytics);

  if (!userPreferences?.isDeveloper && !userPreferences?.collegeName) {
    return (
      <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground p-4">
          <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p>Please set your college name in your profile to view analytics.</p>
        </CardContent>
      </Card>
    );
  }

  const isLoading = isLoadingUsers || isLoadingFood || isLoadingTransactions;
  const error = usersError || foodError || transactionsError;

  return (
    <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Analytics Overview</CardTitle>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary-neon" />}
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="text-destructive-foreground bg-destructive/10 p-4 rounded-lg">
            <p>Error loading analytics: {error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-3" />
                <span className="font-medium">Total Users</span>
              </div>
              <span className="text-lg font-bold text-foreground">{totalUsers}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
              <div className="flex items-center">
                <Utensils className="h-5 w-5 text-green-500 mr-3" />
                <span className="font-medium">Food Orders (Last 7 Days)</span>
              </div>
              <span className="text-lg font-bold text-foreground">{foodOrdersLastWeek}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-yellow-500 mr-3" />
                <span className="font-medium">Total Transactions</span>
              </div>
              <span className="text-lg font-bold text-foreground">{totalTransactions}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsCard;