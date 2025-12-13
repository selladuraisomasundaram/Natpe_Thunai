"use client";

import React from 'react';
import { MadeWithDyad } from '@/components/made-with-dyad';

const TrackingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20 flex flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold text-foreground mb-4">Tracking Your Activity</h1>
      <p className="text-muted-foreground mb-8">
        This page will allow you to track the status of your orders, service requests, and deliveries.
        Tracking features coming soon!
      </p>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;