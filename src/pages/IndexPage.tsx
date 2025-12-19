"use client";

import React from 'react';
import { MadeWithDyad } from '@/components/made-with-dyad';

const IndexPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Campus Connect!</h1>
      <p className="text-lg text-muted-foreground mb-8 text-center">
        Your hub for campus services, errands, exchange, and more.
      </p>
      <MadeWithDyad />
    </div>
  );
};

export default IndexPage;