"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketListings } from '@/hooks/useMarketListings';
import { useAuth } from '@/context/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';
import ProductCard from './ProductCard'; // Assuming ProductCard exists

const DiscoveryFeed: React.FC = () => {
  const { userPreferences } = useAuth();
  const { products: listings, isLoading, error } = useMarketListings(); // useMarketListings already filters by collegeName internally

  if (!userPreferences?.collegeName) {
    return (
      <Card className="w-full bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Marketplace</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground p-4">
          <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p>Please set your college name in your profile to view marketplace listings.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Marketplace</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary-neon" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Marketplace</CardTitle>
        </CardHeader>
        <CardContent className="text-destructive-foreground bg-destructive/10 p-4 rounded-lg">
          <p>Error loading listings: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Marketplace</CardTitle>
      </CardHeader>
      <CardContent>
        {listings.length === 0 ? (
          <p className="text-muted-foreground text-center">No marketplace listings found for your college.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((product) => (
              <ProductCard key={product.$id} product={product} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscoveryFeed;