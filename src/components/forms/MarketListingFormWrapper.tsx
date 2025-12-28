"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import MarketListingForm from './MarketListingForm'; // Assuming this component exists
import toast from 'react-hot-toast'; // Ensure toast is imported
import { Loader2 } from 'lucide-react';

interface MarketListingFormWrapperProps {
  onListingPosted: () => void;
  onCancel: () => void;
}

const MarketListingFormWrapper: React.FC<MarketListingFormWrapperProps> = ({ onListingPosted, onCancel }) => {
  const [activeTab, setActiveTab] = useState<"sell" | "rent" | "gift" | "sports">("sell");
  const { user, userPreferences, recordMarketListing } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    if (!user || !userPreferences?.collegeName) {
      toast.error("Please log in and set your college name to post a listing.");
      return;
    }

    setIsSubmitting(true);
    try {
      const listingData = {
        ...formData,
        category: activeTab,
        // Seller Info (from Auth Context)
        userId: user.$id,
        sellerName: userPreferences.name,
        collegeName: userPreferences.collegeName,
        status: 'available', // Default status
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await recordMarketListing(listingData); // Use the context function
      onListingPosted();
    } catch (error: any) {
      console.error("Failed to post market listing:", error);
      toast.error(error.message || "Failed to post listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full bg-card text-foreground shadow-lg rounded-lg border-border">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Post a New Listing</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "sell" | "rent" | "gift" | "sports")} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sell">Sell</TabsTrigger>
            <TabsTrigger value="rent">Rent</TabsTrigger>
            <TabsTrigger value="gift">Gift</TabsTrigger>
            <TabsTrigger value="sports">Sports</TabsTrigger>
          </TabsList>
          <TabsContent value="sell" className="mt-4">
            <MarketListingForm onSubmit={handleSubmit} onCancel={onCancel} loading={isSubmitting} category="sell" />
          </TabsContent>
          <TabsContent value="rent" className="mt-4">
            <MarketListingForm onSubmit={handleSubmit} onCancel={onCancel} loading={isSubmitting} category="rent" />
          </TabsContent>
          <TabsContent value="gift" className="mt-4">
            <MarketListingForm onSubmit={handleSubmit} onCancel={onCancel} loading={isSubmitting} category="gift" />
          </TabsContent>
          <TabsContent value="sports" className="mt-4">
            <MarketListingForm onSubmit={handleSubmit} onCancel={onCancel} loading={isSubmitting} category="sports" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MarketListingFormWrapper;