"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, ArrowRight, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CASH_EXCHANGE_COLLECTION_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from "appwrite";

interface Listing {
  $id: string;
  $createdAt: string; // FIX: Added this property to resolve the error
  type: "request" | "offer" | "group-contribution";
  amount: number;
  notes: string;
  status: string;
  meetingLocation: string;
  meetingTime: string;
  posterId: string;
  posterName: string;
  contributions?: any[];
  collegeName: string;
}

interface CashExchangeListingsProps {
  listings: Listing[];
  isLoading: boolean;
  type: "request" | "offer" | "group-contribution";
}

const CashExchangeListings: React.FC<CashExchangeListingsProps> = ({ listings, isLoading, type }) => {
  const { user } = useAuth();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleActionClick = (listing: Listing) => {
    if (!user) {
      toast.error("Please log in to participate.");
      return;
    }
    if (user.$id === listing.posterId) {
      toast.info("You cannot accept your own post.");
      return;
    }
    setSelectedListing(listing);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedListing || !user) return;

    setIsProcessing(true);
    try {
      // 1. Update the listing status to "Accepted"
      if (selectedListing.type !== 'group-contribution') {
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
          selectedListing.$id,
          { status: "Accepted" }
        );
      }

      // 2. Create a Transaction Record for the Tracking Page
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: selectedListing.$id,
          productTitle: `Cash Exchange: ${selectedListing.type === 'request' ? 'Request' : 'Offer'}`,
          amount: selectedListing.amount,
          buyerId: user.$id, 
          buyerName: user.name,
          sellerId: selectedListing.posterId, 
          sellerName: selectedListing.posterName,
          status: "seller_confirmed_delivery", 
          type: "cash-exchange",
          collegeName: selectedListing.collegeName,
          ambassadorDelivery: false,
          ambassadorMessage: `Meeting at ${selectedListing.meetingLocation} @ ${selectedListing.meetingTime}`
        }
      );

      toast.success("Exchange accepted! Check your Tracking page for details.");
      setIsConfirmDialogOpen(false);
    } catch (error: any) {
      console.error("Error accepting exchange:", error);
      toast.error("Failed to accept exchange.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-neon" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No active {type}s found. Be the first to post!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <Card key={listing.$id} className="bg-background border border-border hover:border-secondary-neon/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${listing.posterName}`} />
                  <AvatarFallback>{listing.posterName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{listing.posterName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(listing.$createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge variant={listing.type === 'request' ? 'destructive' : 'default'} className="uppercase text-[10px]">
                {listing.type}
              </Badge>
            </div>

            <div className="flex justify-between items-center my-3">
              <span className="text-2xl font-bold text-foreground">₹{listing.amount}</span>
              {listing.status === "Open" ? (
                <Badge variant="outline" className="text-green-500 border-green-500">Open</Badge>
              ) : (
                <Badge variant="secondary">{listing.status}</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-4 bg-muted/50 p-2 rounded-md italic">
              "{listing.notes}"
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {listing.meetingLocation}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {listing.meetingTime}
              </div>
            </div>

            {user?.$id !== listing.posterId && listing.status === "Open" && (
              <Button 
                className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
                onClick={() => handleActionClick(listing)}
              >
                {listing.type === 'request' ? 'I have Cash (Help)' : 'I need Cash (Accept)'} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-secondary-neon" /> Confirm Exchange
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-md mb-3 text-yellow-600 dark:text-yellow-400 text-xs">
                <span className="font-bold flex items-center gap-1 mb-1"><AlertTriangle className="h-3 w-3" /> Important:</span>
                This is strictly a <strong>Physical-to-Digital</strong> or <strong>Digital-to-Physical</strong> exchange. 
                <br/>
                Do NOT lend money. Ensure you meet in a public place.
              </div>
              You are agreeing to meet <strong>{selectedListing?.posterName}</strong> at <strong>{selectedListing?.meetingLocation}</strong> around <strong>{selectedListing?.meetingTime}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)} disabled={isProcessing}>Cancel</Button>
            <Button onClick={handleConfirmAction} disabled={isProcessing} className="bg-secondary-neon text-primary-foreground">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Notify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashExchangeListings;