"use client";

import React, { useState } from 'react';
import { useMarketListings } from '@/hooks/useMarketListings';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, PlusCircle, AlertTriangle } from 'lucide-react';
import MarketTabs from '@/components/MarketTabs'; // Assuming MarketTabs exists
import MarketListingFormWrapper from '@/components/forms/MarketListingFormWrapper'; // Assuming this component exists

const MarketPage = () => {
  const { userPreferences } = useAuth();
  const { products, isLoading, error, refetch } = useMarketListings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleListingPosted = () => {
    setIsDialogOpen(false);
    refetch(); // Refresh listings after a new one is posted
  };

  if (!userPreferences?.collegeName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-background-dark p-4">
        <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Marketplace</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground p-4">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p>Please set your college name in your profile to access the marketplace.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-background-dark p-4">
        <Loader2 className="h-16 w-16 animate-spin text-secondary-neon" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-background-dark p-4">
        <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Marketplace</CardTitle>
          </CardHeader>
          <CardContent className="text-destructive-foreground bg-destructive/10 p-4 rounded-lg">
            <p>Error loading marketplace: {error}</p>
            <Button onClick={refetch} className="mt-2">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Campus Marketplace</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 px-4 py-2">
              <PlusCircle className="mr-2 h-4 w-4" /> Post Listing
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Post a New Marketplace Listing</DialogTitle>
            </DialogHeader>
            <MarketListingFormWrapper onListingPosted={handleListingPosted} onCancel={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <MarketTabs products={products} />
    </div>
  );
};

export default MarketPage;