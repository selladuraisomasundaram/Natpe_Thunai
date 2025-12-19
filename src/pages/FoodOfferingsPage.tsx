"use client";

import React from 'react';
import { MadeWithDyad } from '@/components/made-with-dyad';

const FoodOfferingsPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Food Offerings</h1>
      <p className="text-lg text-muted-foreground mb-8 text-center">
        Delicious meals and wellness items from your campus community.
      </p>
      <MadeWithDyad />
    </div>
  );
};

export default FoodOfferingsPage;