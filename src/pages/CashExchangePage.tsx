"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from "@/lib/appwrite"; // Changed to PRODUCTS_COLLECTION_ID
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { useCashExchangeListings } from "@/hooks/useCashExchangeListings";
import CashExchangeListings from "@/components/CashExchangeListings"; // Assuming this component exists and uses the hook

const formSchema = z.object({
  amount: z.number().min(1, { message: "Amount must be at least 1." }),
  currency: z.string().min(1, { message: "Currency is required." }),
  exchangeForCurrency: z.string().min(1, { message: "Exchange for currency is required." }),
  exchangeRate: z.number().min(0.01, { message: "Exchange rate must be positive." }),
  contactInfo: z.string().min(5, { message: "Contact information is required." }),
  notes: z.string().optional(),
});

const CashExchangePage = () => {
  const { user, userProfile } = useAuth();
  const [isPostListingDialogOpen, setIsPostListingDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      currency: "INR",
      exchangeForCurrency: "USD",
      exchangeRate: 0,
      contactInfo: "",
      notes: "",
    },
  });

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePostListing = async (data: z.infer<typeof formSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a listing.");
      return;
    }

    try {
      const newListingData = {
        title: `Exchange ${data.amount} ${data.currency} for ${data.exchangeForCurrency}`,
        description: `Offering ${data.amount} ${data.currency} for ${data.exchangeForCurrency} at a rate of ${data.exchangeRate}. Contact: ${data.contactInfo}. Notes: ${data.notes || 'N/A'}`,
        price: data.amount, // Using 'price' field for the amount being exchanged
        type: "cash-exchange", // Crucial for filtering
        sellerId: user.$id,
        sellerName: user.name,
        collegeName: userProfile.collegeName,
        // Additional fields specific to cash exchange can be added here if the products collection schema allows
        // For now, putting details in description to fit generic product schema
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID, // Store in products collection
        ID.unique(),
        newListingData
      );
      
      toast.success("Your cash exchange listing has been posted!");
      setIsPostListingDialogOpen(false);
      form.reset();
    } catch (e: any) {
      console.error("Error posting cash exchange listing:", e);
      toast.error(e.message || "Failed to post cash exchange listing.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Cash Exchange</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-secondary-neon" /> Exchange Currency
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Need to exchange currency with peers? Post your offer here!
            </p>
            <Dialog open={isPostListingDialogOpen} onOpenChange={setIsPostListingDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post New Listing
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Cash Exchange Listing</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handlePostListing)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount Offering</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 1000" {...field} onChange={event => field.onChange(+event.target.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency Offering</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., INR" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="exchangeForCurrency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exchange For Currency</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., USD" {...field} />
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
                          <FormLabel>Exchange Rate (e.g., 83 for 1 USD)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g., 83.00" {...field} onChange={event => field.onChange(+event.target.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactInfo"
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
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Any specific conditions or details..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsPostListingDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Post Listing</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Cash Exchange Listings Component */}
        <CashExchangeListings />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default CashExchangePage;