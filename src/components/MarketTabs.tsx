"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product } from '@/hooks/useMarketListings'; // Import Product from useMarketListings
import ProductCard from './ProductCard'; // Assuming ProductCard exists and uses this Product type

interface MarketTabsProps {
  products: Product[];
}

// Helper function to filter products by category
const filterProducts = (products: Product[], category: string) => {
  if (category === 'all') {
    return products;
  }
  return products.filter(product => product.category === category);
};

const MarketTabs: React.FC<MarketTabsProps> = ({ products }) => {
  const [activeTab, setActiveTab] = useState<string>('all');

  const items = filterProducts(products, activeTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="sell">Sell</TabsTrigger>
        <TabsTrigger value="rent">Rent</TabsTrigger>
        <TabsTrigger value="gift">Gift</TabsTrigger>
        <TabsTrigger value="sports">Sports</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground">No listings found.</p>
          ) : (
            items.map((product) => (
              <ProductCard key={product.$id} product={product} />
            ))
          )}
        </div>
      </TabsContent>
      <TabsContent value="sell" className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground">No listings for sale found.</p>
          ) : (
            items.map((product) => (
              <ProductCard key={product.$id} product={product} />
            ))
          )}
        </div>
      </TabsContent>
      <TabsContent value="rent" className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground">No listings for rent found.</p>
          ) : (
            items.map((product) => (
              <ProductCard key={product.$id} product={product} />
            ))
          )}
        </div>
      </TabsContent>
      <TabsContent value="gift" className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground">No gift listings found.</p>
          ) : (
            items.map((product) => (
              <ProductCard key={product.$id} product={product} />
            ))
          )}
        </div>
      </TabsContent>
      <TabsContent value="sports" className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground">No sports equipment listings found.</p>
          ) : (
            items.map((product) => (
              <ProductCard key={product.$id} product={product} />
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default MarketTabs;