"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { ID, Query } from 'appwrite'; // NEW: Import Query
import { ServicePost } from "@/hooks/useServiceListings"; // Assuming ServicePost is defined here

const bargainSchema = z.object({
  proposedPrice: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, { message: "Proposed price must be greater than 0." })
  ),
  message: z.string().optional(),
});

interface BargainServiceDialogProps {
  service: ServicePost;
  onBargainSubmitted: () => void;
  onCancel: () => void;
}

const BargainServiceDialog: React.FC<BargainServiceDialogProps> = ({ service, onBargainSubmitted, onCancel }) => {
  const { user, userProfile } = useAuth();
  const form = useForm<z.infer<typeof bargainSchema>>({
    resolver: zodResolver(bargainSchema),
    defaultValues: {
      proposedPrice: service.price, // Default to current price
      message: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof bargainSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to make a bargain offer.");
      return;
    }

    if (user.$id === service.posterId) {
      toast.error("You cannot bargain on your own service.");
      return;
    }

    try {
      // In a real app, this would create a 'BargainRequest' document
      // For now, we'll simulate and log
      console.log("Bargain offer submitted:", {
        serviceId: service.$id,
        serviceTitle: service.title,
        buyerId: user.$id,
        buyerName: user.name,
        sellerId: service.posterId,
        sellerName: service.posterName,
        proposedPrice: data.proposedPrice,
        message: data.message,
        collegeName: userProfile.collegeName,
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(`Bargain offer of $${data.proposedPrice.toFixed(2)} submitted for "${service.title}"!`);
      onBargainSubmitted();
    } catch (e: any) {
      console.error("Error submitting bargain offer:", e);
      toast.error(e.message || "Failed to submit bargain offer.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Service: <span className="font-semibold text-foreground">{service.title}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Current Price: <span className="font-semibold text-foreground">${service.price.toFixed(2)}</span>
        </p>

        <FormField
          control={form.control}
          name="proposedPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Proposed Price ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 15.00"
                  {...field}
                  onChange={e => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message to Seller (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., I'm a student on a budget..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit">Make Offer</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default BargainServiceDialog;