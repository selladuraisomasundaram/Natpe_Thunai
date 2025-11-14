"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SellListingForm from "./SellListingForm";
import RentListingForm from "./RentListingForm";
import GiftCraftListingForm from "./GiftCraftListingForm";
import SportsGearListingForm from "./SportsGearListingForm";
import { toast } from "sonner";

interface MarketListingFormWrapperProps {
  onClose: () => void;
}

const MarketListingFormWrapper: React.FC<MarketListingFormWrapperProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"sell" | "rent" | "gift" | "sports">("sell");

  const handleListingSubmit = (data: any, type: string) => {
    console.log(`New ${type} listing submitted:`, data);
    toast.success(`New ${type} listing created successfully!`);
    // In a real app, this data would be sent to Appwrite databases.
    onClose();
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-foreground">Create New Listing</DialogTitle>
      </DialogHeader>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "sell" | "rent" | "gift" | "sports")}>
        <TabsList className="grid w-full grid-cols-4 h-auto bg-muted">
          <TabsTrigger value="sell" className="text-xs sm:text-sm">Sell</TabsTrigger>
          <TabsTrigger value="rent" className="text-xs sm:text-sm">Rent</TabsTrigger>
          <TabsTrigger value="gift" className="text-xs sm:text-sm">Gift/Craft</TabsTrigger>
          <TabsTrigger value="sports" className="text-xs sm:text-sm">Sports Gear</TabsTrigger>
        </TabsList>

        <TabsContent value="sell" className="mt-4">
          <SellListingForm 
            onSubmit={(data) => handleListingSubmit(data, "Sell")} 
            onCancel={onClose} 
          />
        </TabsContent>
        
        <TabsContent value="rent" className="mt-4">
          <RentListingForm 
            onSubmit={(data) => handleListingSubmit(data, "Rent")} 
            onCancel={onClose} 
          />
        </TabsContent>
        
        <TabsContent value="gift" className="mt-4">
          <GiftCraftListingForm 
            onSubmit={(data) => handleListingSubmit(data, "Gift/Craft")} 
            onCancel={onClose} 
          />
        </TabsContent>
        
        <TabsContent value="sports" className="mt-4">
          <SportsGearListingForm 
            onSubmit={(data) => handleListingSubmit(data, "Sports Gear")} 
            onCancel={onClose} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketListingFormWrapper;