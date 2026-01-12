"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductListingCard from "@/components/ProductListingCard";
import { Product } from "@/lib/mockData";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketListings } from '@/hooks/useMarketListings';
import { cn } from '@/lib/utils';
import { ShoppingBag, Tag, Clock, Gift, Dumbbell, Box, SearchX } from "lucide-react";

// Helper function to filter products by type
const filterProducts = (products: Product[], type: Product['type'] | 'all'): Product[] => {
  if (type === 'all') return products;
  if (type === 'gift') {
    return products.filter(p => p.type === 'gift' || p.type === 'gift-request');
  }
  return products.filter(p => p.type === type);
};

interface MarketTabsProps {
  initialTab?: Product['type'] | 'all';
}

const MarketTabs: React.FC<MarketTabsProps> = ({ initialTab = 'all' }) => {
  const [activeTab, setActiveTab] = useState<Product['type'] | 'all'>(initialTab);
  const { products, isLoading, error } = useMarketListings();

  const items = filterProducts(products, activeTab);

  // Tab Configuration for cleaner rendering
  const tabConfig = [
    { value: "all", label: "All Items", icon: ShoppingBag },
    { value: "sell", label: "For Sale", icon: Tag },
    { value: "rent", label: "Rentals", icon: Clock },
    { value: "gift", label: "Gifts & Crafts", icon: Gift },
    { value: "sports", label: "Sports Gear", icon: Dumbbell },
  ];

  const renderContent = () => {
    // --- LOADING STATE ---
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
               <Skeleton className="h-40 w-full rounded-xl" />
               <div className="space-y-2">
                 <Skeleton className="h-4 w-3/4" />
                 <Skeleton className="h-4 w-1/2" />
               </div>
            </div>
          ))}
        </div>
      );
    }
    
    // --- ERROR STATE ---
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-destructive bg-destructive/5 rounded-xl border border-destructive/20">
                <SearchX className="h-10 w-10 mb-2" />
                <p>Error loading listings: {error}</p>
            </div>
        );
    }

    // --- EMPTY STATE ---
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted/30 p-6 rounded-full mb-4">
                <Box className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No listings found</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-1">
                There are no items in this category yet. Be the first to list something!
            </p>
        </div>
      );
    }

    // --- LISTINGS GRID ---
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 py-2 animate-in fade-in zoom-in-95 duration-300">
        {items.map((product) => (
          <ProductListingCard key={product.$id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Product['type'] | 'all')} className="w-full space-y-6">
      
      {/* Scrollable Tab List */}
      <TabsList className="flex w-full justify-start overflow-x-auto bg-transparent p-0 gap-2 scrollbar-hide">
        {tabConfig.map((tab) => (
            <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground data-[state=active]:border-secondary-neon data-[state=active]:shadow-md transition-all duration-300 min-w-max hover:bg-muted"
            >
                <tab.icon className="h-4 w-4" />
                <span className="text-xs font-bold">{tab.label}</span>
            </TabsTrigger>
        ))}
      </TabsList>
      
      <TabsContent value={activeTab} className="mt-0 min-h-[300px]">
        {renderContent()}
      </TabsContent>
    </Tabs>
  );
};

export default MarketTabs;