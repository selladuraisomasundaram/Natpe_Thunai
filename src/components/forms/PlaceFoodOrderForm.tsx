"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ServicePost } from "@/hooks/useServiceListings";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { Loader2 } from "lucide-react";

interface PlaceFoodOrderFormProps {
  offering: ServicePost;
  onOrderPlaced: () => void;
  onCancel: () => void;
}

const PlaceFoodOrderForm: React.FC<PlaceFoodOrderFormProps> = ({ offering, onOrderPlaced, onCancel }) => {
  const { user, userProfile } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [deliveryLocation, setDeliveryLocation] = useState(userProfile?.mobileNumber || ""); // Using mobile number field for location placeholder
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      toast.error("You must be logged in to place an order.");
      return;
    }
    if (quantity <= 0 || !deliveryLocation.trim()) {
      toast.error("Please specify a valid quantity and delivery location.");
      return;
    }

    setIsSubmitting(true);
    
    // Simple price parsing (assuming price is like "₹150" or "₹500/hour")
    const priceMatch = offering.price.match(/₹(\d+(\.\d+)?)/);
    const unitPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
    const totalAmount = unitPrice * quantity;

    if (totalAmount <= 0) {
        toast.error("Invalid price or quantity.");
        setIsSubmitting(false);
        return;
    }

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        ID.unique(),
        {
          offeringId: offering.$id,
          offeringTitle: offering.title,
          providerId: offering.posterId,
          providerName: offering.posterName,
          buyerId: user.$id,
          buyerName: user.name,
          quantity: quantity,
          totalAmount: totalAmount,
          deliveryLocation: deliveryLocation.trim(),
          notes: notes.trim(),
          status: "Pending Confirmation", // Initial status
        }
      );
      
      toast.success(`Order placed successfully! Total: ₹${totalAmount.toFixed(2)}. Provider will confirm shortly.`);
      onOrderPlaced();
    } catch (e: any) {
      console.error("Error placing food order:", e);
      toast.error(e.message || "Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="quantity" className="text-foreground">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          min="1"
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="deliveryLocation" className="text-foreground">Delivery Location (Hostel/Room/Block)</Label>
        <Input
          id="deliveryLocation"
          type="text"
          value={deliveryLocation}
          onChange={(e) => setDeliveryLocation(e.target.value)}
          placeholder="e.g., Block C, Room 404"
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-foreground">Special Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Make it spicy, deliver after 7 PM."
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled={isSubmitting}
        />
      </div>
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Order"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default PlaceFoodOrderForm;