"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CASH_EXCHANGE_COLLECTION_ID } from "@/lib/appwrite";
import { Models } from "appwrite";

export interface CashExchangeListing extends Models.Document {
  posterId: string;
  posterName: string;
  collegeName: string;
  amount: number;
  exchangeRate: number; // e.g., 1.0 for 1:1, 0.95 for 5% fee
  contact: string;
  status: 'available' | 'pending' | 'completed' | 'cancelled';
  description?: string;
  type: 'request' | 'offer' | 'group-contribution'; // Added type
}

interface CashExchangeListingsProps {
  listings: CashExchangeListing[]; // Added listings prop
  isLoading: boolean; // Added isLoading prop
  type: 'request' | 'offer' | 'group-contribution'; // Added type prop
}

const CashExchangeListings: React.FC<CashExchangeListingsProps> = ({ listings, isLoading, type }) => {
  const { user } = useAuth();

  const handleAcceptOffer = async (listingId: string) => {
    if (!user) {
      toast.error("You must be logged in to accept an offer.");
      return;
    }
    // Logic to accept offer, potentially create a transaction, update status
    toast.info("Accepting offer functionality not yet implemented.");
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-secondary-neon" /> {type === 'request' ? 'Cash Requests' : type === 'offer' ? 'Cash Offers' : 'Group Contributions'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
            <p className="ml-3 text-muted-foreground">Loading listings...</p>
          </div>
        ) : listings.length > 0 ? (
          listings.map((listing) => (
            <div key={listing.$id} className="p-3 border border-border rounded-md bg-background">
              <h3 className="font-semibold text-foreground">Amount: ${listing.amount.toFixed(2)}</h3>
              <p className="text-sm text-muted-foreground mt-1">Rate: {listing.exchangeRate}</p>
              <p className="text-xs text-muted-foreground">Contact: {listing.contact}</p>
              <p className="text-xs text-muted-foreground">Posted by: {listing.posterName}</p>
              <Button
                className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => handleAcceptOffer(listing.$id)}
                disabled={listing.posterId === user?.$id || listing.status !== 'available'}
              >
                Accept Offer
              </Button>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-4">No {type.replace('-', ' ')} listings available.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CashExchangeListings;