"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostExchangeListingForm from "@/components/forms/PostExchangeListingForm";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from "@/lib/appwrite";
import { ID, Query } from 'appwrite';
import { useAuth } from "@/context/AuthContext";

// Define a type for an exchange listing (product)
export interface ExchangeListing {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  title: string;
  description: string;
  category: string;
  price: number; // Assuming price is a number
  condition: string;
  contact: string;
  posterId: string;
  posterName: string;
  collegeName: string;
  imageUrl?: string; // Optional image URL
}

const ExchangePage = () => {
  const { user, userProfile } = useAuth();
  const [isPostListingDialogOpen, setIsPostListingDialogOpen] = useState(false);
  const [exchangeListings, setExchangeListings] = useState<ExchangeListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchExchangeListings();
  }, [userProfile]); // Refetch if userProfile changes (e.g., collegeName)

  const fetchExchangeListings = async () => {
    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setError("User college information not available.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID,
        [
          Query.equal('collegeName', userProfile.collegeName),
          Query.orderDesc('$createdAt'),
        ]
      );
      setExchangeListings(response.documents as unknown as ExchangeListing[]);
    } catch (e: any) {
      console.error("Error fetching exchange listings:", e);
      setError(e.message || "Failed to load exchange listings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostListing = async (data: Omit<ExchangeListing, "$id" | "$createdAt" | "$updatedAt" | "posterId" | "posterName" | "collegeName">) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a listing.");
      return;
    }

    try {
      const newListingData = {
        ...data,
        price: Number(data.price), // Ensure price is a number
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
        // userId: user.$id, // Assuming 'userId' is the correct attribute name in Appwrite
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID,
        ID.unique(),
        newListingData
      );
      
      toast.success(`Your listing "${data.title}" has been posted!`);
      setIsPostListingDialogOpen(false);
      fetchExchangeListings(); // Refresh the list
    } catch (e: any) {
      console.error("Error posting listing:", e);
      toast.error(e.message || "Failed to post exchange listing.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Exchange Hub</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-secondary-neon" /> Buy, Sell, Trade
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              List items you want to sell, buy, or trade with other students in your college!
            </p>
            <Dialog open={isPostListingDialogOpen} onOpenChange={setIsPostListingDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post New Listing
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Exchange Listing</DialogTitle>
                </DialogHeader>
                <PostExchangeListingForm 
                  onSubmit={handlePostListing} 
                  onCancel={() => setIsPostListingDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recent Listings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading listings...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading listings: {error}</p>
            ) : exchangeListings.length > 0 ? (
              exchangeListings.map((listing) => (
                <div key={listing.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{listing.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{listing.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{listing.category}</span></p>
                  <p className="text-xs text-muted-foreground">Price: <span className="font-medium text-foreground">${listing.price.toFixed(2)}</span></p>
                  <p className="text-xs text-muted-foreground">Condition: <span className="font-medium text-foreground">{listing.condition}</span></p>
                  <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{listing.contact}</span></p>
                  <p className="text-xs text-muted-foreground">Posted by: {listing.posterName} on {new Date(listing.$createdAt).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No listings posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ExchangePage;