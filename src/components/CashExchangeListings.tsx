"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign } from "lucide-react";
import { useCashExchangeListings } from "@/hooks/useCashExchangeListings";
import { useAuth } from "@/context/AuthContext";

const CashExchangeListings = () => {
  const { userProfile } = useAuth();
  const { listings, isLoading, error } = useCashExchangeListings(userProfile?.collegeName);

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground">Available Exchange Listings</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
            <p className="ml-3 text-muted-foreground">Loading exchange listings...</p>
          </div>
        ) : error ? (
          <p className="text-center text-destructive py-4">Error loading listings: {error}</p>
        ) : listings.length > 0 ? (
          listings.map((listing) => (
            <div key={listing.$id} className="p-3 border border-border rounded-md bg-background">
              <h3 className="font-semibold text-foreground">{listing.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{listing.description}</p>
              <p className="text-xs text-muted-foreground mt-1">Amount: <span className="font-medium text-foreground">₹{listing.price.toFixed(2)}</span></p>
              <p className="text-xs text-muted-foreground">Posted by: <span className="font-medium text-foreground">{listing.sellerName} ({listing.collegeName})</span></p>
              <p className="text-xs text-muted-foreground">Posted: {new Date(listing.$createdAt).toLocaleDateString()}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-4">No cash exchange listings found for your college. Be the first to post!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CashExchangeListings;