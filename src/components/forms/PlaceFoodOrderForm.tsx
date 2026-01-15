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
import { Loader2, DollarSign, Truck, AlertTriangle, Info } from "lucide-react"; 
import { DEVELOPER_UPI_ID } from "@/lib/config"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch"; 

interface PlaceFoodOrderFormProps {
  offering: ServicePost;
  onOrderPlaced: () => void;
  onCancel: () => void;
}

const PlaceFoodOrderForm: React.FC<PlaceFoodOrderFormProps> = ({ offering, onOrderPlaced, onCancel }) => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  
  // Form State
  const [quantity, setQuantity] = useState(1);
  const [deliveryLocation, setDeliveryLocation] = useState(userProfile?.mobileNumber || ""); 
  const [notes, setNotes] = useState("");
  
  // Ambassador State
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");
  
  // Processing State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Price Calculation
  const priceMatch = offering.price.match(/₹(\d+(\.\d+)?)/);
  const unitPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
  const totalAmount = unitPrice * quantity;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      toast.error("You must be logged in to place an order.");
      return;
    }
    if (quantity <= 0 || !deliveryLocation.trim()) {
      toast.error("Please specify a valid quantity and delivery location.");
      return;
    }
    setIsConfirming(true);
  };

  const handlePaymentInitiation = async () => {
    setIsConfirming(false);
    setIsSubmitting(true);

    if (!user || !userProfile) return;

    const orderTitle = `${offering.title} x${quantity}`;
    const transactionNote = `Food: ${orderTitle}`;

    try {
      // 1. Create Appwrite Document
      const newOrder = await databases.createDocument(
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
          status: "Pending Confirmation",
          collegeName: userProfile.collegeName,
          ambassadorDelivery: ambassadorDelivery,
          ambassadorMessage: ambassadorMessage || null,
        }
      );
      
      const orderId = newOrder.$id;

      // 2. Increment Ambassador Stats (if applicable)
      if (ambassadorDelivery && incrementAmbassadorDeliveriesCount) {
        await incrementAmbassadorDeliveriesCount();
      }

      // 3. Generate UPI Deep Link
      // Ensure DEVELOPER_UPI_ID is set in your config
      const targetUPI = DEVELOPER_UPI_ID || "example@upi"; 
      const upiDeepLink = `upi://pay?pa=${targetUPI}&pn=NatpeThunai&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote + ` #${orderId.substring(0,6)}`)}`;

      // 4. Open Payment
      window.open(upiDeepLink, "_blank");
      
      toast.success("Order Placed! Please complete the payment in your UPI app.");
      onOrderPlaced();

    } catch (e: any) {
      console.error("Error placing food order:", e);
      toast.error(e.message || "Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleFormSubmit} className="grid gap-4 py-2">
        
        {/* Warning Alert */}
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-xs font-bold">No Cancellation</AlertTitle>
          <AlertDescription className="text-[10px] leading-tight">
            Orders cannot be cancelled once preparation starts.
          </AlertDescription>
        </Alert>

        {/* Inputs */}
        <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 space-y-2">
                <Label htmlFor="quantity">Qty</Label>
                <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    className="text-center"
                    required
                />
            </div>
            <div className="col-span-3 space-y-2">
                <Label htmlFor="location">Delivery Spot (Block/Room)</Label>
                <Input
                    id="location"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="e.g. Block C, Room 404"
                    required
                />
            </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Cooking Instructions</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Less spicy, extra sauce..."
            className="h-16 resize-none"
          />
        </div>

        {/* Ambassador Delivery Option (Embedded) */}
        <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-secondary-neon" />
                    <Label htmlFor="ambassador-mode" className="font-semibold cursor-pointer">Ambassador Delivery</Label>
                </div>
                <Switch 
                    id="ambassador-mode" 
                    checked={ambassadorDelivery} 
                    onCheckedChange={setAmbassadorDelivery} 
                />
            </div>
            {ambassadorDelivery && (
                 <Input 
                    placeholder="Instructions for the runner (e.g. Call upon arrival)"
                    value={ambassadorMessage}
                    onChange={(e) => setAmbassadorMessage(e.target.value)}
                    className="text-xs h-8"
                 />
            )}
            <p className="text-[10px] text-muted-foreground">
                <Info className="h-3 w-3 inline mr-1"/>
                A student ambassador will verify quality and deliver to your spot.
            </p>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Pay ₹${totalAmount}`}
          </Button>
        </DialogFooter>
      </form>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary-neon" /> Confirm Payment
            </DialogTitle>
            <DialogDescription>
              You will be redirected to your UPI app.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
             <div className="flex justify-between">
                <span>Item:</span>
                <span className="font-semibold">{offering.title} x{quantity}</span>
             </div>
             {ambassadorDelivery && (
                <div className="flex justify-between text-secondary-neon">
                    <span>Delivery:</span>
                    <span className="font-semibold">Ambassador Assigned</span>
                </div>
             )}
             <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="font-bold text-lg">Total:</span>
                <span className="font-black text-lg">₹{totalAmount.toFixed(2)}</span>
             </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirming(false)}>Back</Button>
            <Button onClick={handlePaymentInitiation} className="bg-secondary-neon text-primary-foreground">
               Pay Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlaceFoodOrderForm;