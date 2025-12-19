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
import { ID, Query } from 'appwrite';
import { ExchangeListing } from "@/pages/ExchangePage"; // Assuming ExchangeListing is defined here

const buyProductSchema = z.object({
  quantity: z.preprocess(
    (val) => Number(val),
    z.number().min(1, { message: "Quantity must be at least 1." })
  ),
  message: z.string().optional(),
  contactInfo: z.string().min(5, { message: "Contact information is required." }),
});

interface BuyProductDialogProps {
  product: ExchangeListing;
  onPurchaseSubmitted: () => void;
  onCancel: () => void;
}

const BuyProductDialog: React.FC<BuyProductDialogProps> = ({ product, onPurchaseSubmitted, onCancel }) => {
  const { user, userProfile } = useAuth();
  const form = useForm<z.infer<typeof buyProductSchema>>({
    resolver: zodResolver(buyProductSchema),
    defaultValues: {
      quantity: 1,
      message: "",
      contactInfo: user?.email || "", // Pre-fill with user email if available
    },
  });

  const onSubmit = async (data: z.infer<typeof buyProductSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to purchase an item.");
      return;
    }

    if (user.$id === product.posterId) {
      toast.error("You cannot purchase your own listing.");
      return;
    }

    try {
      // In a real app, this would create a 'Transaction' document
      // For now, we'll simulate and log
      console.log("Purchase submitted:", {
        productId: product.$id,
        productTitle: product.title,
        buyerId: user.$id,
        buyerName: user.name,
        sellerId: product.posterId,
        sellerName: product.posterName,
        quantity: data.quantity,
        totalPrice: (product.price * data.quantity).toFixed(2),
        message: data.message,
        contactInfo: data.contactInfo,
        collegeName: userProfile.collegeName,
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(`Purchase request for ${data.quantity}x "${product.title}" submitted!`);
      onPurchaseSubmitted();
    } catch (e: any) {
      console.error("Error submitting purchase:", e);
      toast.error(e.message || "Failed to submit purchase.");
    }
  };

  const totalPrice = (product.price * form.watch("quantity")).toFixed(2);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Item: <span className="font-semibold text-foreground">{product.title}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Price per item: <span className="font-semibold text-foreground">${product.price.toFixed(2)}</span>
        </p>

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
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
                <Textarea placeholder="e.g., When can I pick this up?" {...field} />
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
              <FormLabel>Your Contact Info</FormLabel>
              <FormControl>
                <Input placeholder="e.g., your email or phone" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="text-lg font-bold text-foreground mt-4">
          Total: ${totalPrice}
        </div>

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit">Request Purchase</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default BuyProductDialog;