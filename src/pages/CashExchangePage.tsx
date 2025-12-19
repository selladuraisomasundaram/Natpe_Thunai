"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CASH_EXCHANGE_COLLECTION_ID } from "@/lib/appwrite";
import { ID, Models, Query } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Added Tabs
import CashExchangeListings from "@/components/CashExchangeListings"; // Import the component

// Define a type for a cash exchange listing
export interface CashExchangeRequest extends Models.Document {
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

const postListingSchema = z.object({
  amount: z.preprocess(
    (val) => Number(val),
    z.number().min(1, { message: "Amount must be at least 1." })
  ),
  exchangeRate: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, { message: "Exchange rate must be greater than 0." })
  ),
  contact: z.string().min(5, { message: "Contact information is required." }),
  description: z.string().optional(),
  type: z.enum(['request', 'offer', 'group-contribution'], { message: "Please select a type." }), // Added type to schema
});

const CashExchangePage = () => {
  const { user, userProfile } = useAuth();
  const [isPostListingDialogOpen, setIsPostListingDialogOpen] = useState(false);
  const [allListings, setAllListings] = useState<CashExchangeRequest[]>([]); // Renamed to allListings
  const [loading, setLoading] = useState(true); // Renamed isLoading to loading
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof postListingSchema>>({
    resolver: zodResolver(postListingSchema),
    defaultValues: {
      amount: 0,
      exchangeRate: 1.0,
      contact: user?.email || "",
      description: "",
      type: "request", // Default type
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCashExchangeListings();
  }, [userProfile]); // Refetch if userProfile changes (e.g., collegeName)

  const fetchCashExchangeListings = async () => {
    if (!userProfile?.collegeName) {
      setLoading(false);
      setError("User college information not available.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        [
          Query.equal('collegeName', userProfile.collegeName),
          Query.equal('status', 'available'), // Only show available listings
          Query.orderDesc('$createdAt'),
        ]
      );
      setAllListings(response.documents as unknown as CashExchangeRequest[]); // Updated state variable
    } catch (e: any) {
      console.error("Error fetching cash exchange listings:", e);
      setError(e.message || "Failed to load cash exchange listings.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostListing = async (data: z.infer<typeof postListingSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a listing.");
      return;
    }

    try {
      const newListingData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
        status: 'available',
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        ID.unique(),
        newListingData
      );
      
      toast.success(`Your cash exchange listing for $${data.amount.toFixed(2)} has been posted!`);
      setIsPostListingDialogOpen(false);
      form.reset(); // Reset form fields
      fetchCashExchangeListings(); // Refresh the list
    } catch (e: any) {
      console.error("Error posting listing:", e);
      toast.error(e.message || "Failed to post cash exchange listing.");
    }
  };

  const handleAcceptOffer = async (listing: CashExchangeRequest) => {
    if (!user) {
      toast.error("You must be logged in to accept an offer.");
      return;
    }
    if (user.$id === listing.posterId) {
      toast.error("You cannot accept your own listing.");
      return;
    }

    // In a real application, this would initiate a transaction process
    // For now, we'll simulate and update status
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        listing.$id,
        { status: 'pending' } // Mark as pending
      );
      toast.success(`You've expressed interest in ${listing.posterName}'s listing. Please contact them.`);
      fetchCashExchangeListings(); // Refresh the list
    } catch (e: any) {
      console.error("Error accepting offer:", e);
      toast.error(e.message || "Failed to accept offer.");
    }
  };

  const filteredRequests = (type: 'request' | 'offer' | 'group-contribution') => {
    return allListings.filter(listing => listing.type === type);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Cash Exchange</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-secondary-neon" /> Exchange Cash with Peers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Need to exchange cash for digital currency or vice-versa? Find peers in your college!
            </p>
            <Dialog open={isPostListingDialogOpen} onOpenChange={setIsPostListingDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post New Exchange
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Cash Exchange Listing</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handlePostListing)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Listing Type</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="request">Cash Request</option>
                              <option value="offer">Cash Offer</option>
                              <option value="group-contribution">Group Contribution</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount ($)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 50.00" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="exchangeRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exchange Rate (e.g., 1.0 for 1:1)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g., 0.98" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Information</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., @your_username, 123-456-7890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="e.g., Need to exchange cash for Venmo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter className="pt-4">
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type="submit">Post Listing</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card text-card-foreground">
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="group-contributions">Group Contributions</TabsTrigger>
          </TabsList>
          <TabsContent value="requests" className="mt-4">
            <Card className="bg-card text-card-foreground shadow-lg border-border">
              <CardContent className="p-4 space-y-3">
                  <CashExchangeListings listings={filteredRequests("request")} isLoading={loading} type="request" />
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="offers" className="mt-4">
            <Card className="bg-card text-card-foreground shadow-lg border-border">
              <CardContent className="p-4 space-y-3">
                  <CashExchangeListings listings={filteredRequests("offer")} isLoading={loading} type="offer" />
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="group-contributions" className="mt-4">
            <Card className="bg-card text-card-foreground shadow-lg border-border">
              <CardContent className="p-4 space-y-3">
                  <CashExchangeListings listings={filteredRequests("group-contribution")} isLoading={loading} type="group-contribution" />
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default CashExchangePage;