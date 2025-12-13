"use client";

import React from 'react';
import { MadeWithDyad } from '@/components/made-with-dyad';

const MarketPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20 flex flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold text-foreground mb-4">Campus Market</h1>
      <p className="text-muted-foreground mb-8">
        Browse and list items for sale or exchange within the campus community.
        Marketplace features coming soon!
      </p>
      <MadeWithDyad />
    </div>
  );
};

export default MarketPage;