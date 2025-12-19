"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ServicePost } from "@/hooks/useServiceListings";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_OFFERINGS_COLLECTION_ID } from "@/lib/appwrite"; // Assuming orders might be stored or update service post
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { DialogClose } from "@/components/ui/dialog"; // Import DialogClose

// Define the schema for the order form
const orderFormSchema = z.object({
  quantity: z.preprocess(
    (val) => Number(val),
    z.number().min(1, { message: "Quantity must be at least 1." })
  ),
  specialInstructions: z.string().optional(),
  contactInfo: z.string().min(5, { message: "Contact information is required." }),
});

interface PlaceFoodOrderFormProps {
  offering: ServicePost;
  onOrderPlaced: () => void;
  onCancel: () => void;
}

const PlaceFoodOrderForm: React.FC<PlaceFoodOrderFormProps> = ({ offering, onOrderPlaced, onCancel }) => {
  const { user } = useAuth();
  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      quantity: 1,
      specialInstructions: "",
      contactInfo: user?.email || "", // Pre-fill with user email if available
    },
  });

  const onSubmit = async (data: z.infer<typeof orderFormSchema>) => {
    if (!user) {
      toast.error("You must be logged in to place an order.");
      return;
    }

    try {
      // In a real application, you would likely create an "Order" document
      // in a separate collection, or update the service post with order details.
      // For this example, we'll just simulate the order placement and show a toast.

      // Example: Create an order document (you'd need an APPWRITE_ORDERS_COLLECTION_ID)
      // For now, we'll just log and toast.
      console.log("Placing order for:", offering.title, "with data:", data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      toast.success(`Order for ${data.quantity}x "${offering.title}" placed successfully!`);
      onOrderPlaced();
    } catch (e: any) {
      console.error("Error placing order:", e);
      toast.error(e.message || "Failed to place order.");
    }
  };

  const numericPrice = typeof offering.price === 'string' ? parseFloat(offering.price) : offering.price;
  const totalPrice = (numericPrice * form.watch("quantity")).toFixed(2);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You are ordering: <span className="font-semibold text-foreground">{offering.title}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Price per item: <span className="font-semibold text-foreground">${numericPrice.toFixed(2)}</span>
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
                  onChange={e => field.onChange(e.target.valueAsNumber)} // Ensure number type
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Instructions (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., no nuts, extra sauce" {...field} />
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

        <div className="flex justify-end space-x-2 pt-4">
          <DialogClose asChild> {/* Dismissible button */}
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit">Place Order</Button>
        </div>
      </form>
    </Form>
  );
};

export default PlaceFoodOrderForm;