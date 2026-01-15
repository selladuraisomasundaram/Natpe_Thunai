"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogFooter } from "@/components/ui/dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Utensils, Clock, IndianRupee, Leaf, Beef, Info, MapPin, Truck, DollarSign, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { DEVELOPER_UPI_ID } from "@/lib/config";

// Unified Interface
export interface PlaceFoodOrderFormProps {
  mode: "buy" | "sell" | "request"; // Controls the form type
  offering?: any; // Required only for 'buy' mode
  onSubmit?: (data: any) => void; // Required for 'sell'/'request' (handled by parent)
  onCancel: () => void;
  onOrderPlaced?: () => void; // Only for 'buy'
}

const PlaceFoodOrderForm: React.FC<PlaceFoodOrderFormProps> = ({ 
  mode, 
  offering, 
  onSubmit, 
  onCancel,
  onOrderPlaced 
}) => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // --- STATE: SELL / REQUEST MODE ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("homemade-meals");
  const [dietaryType, setDietaryType] = useState("veg");
  const [timeEstimate, setTimeEstimate] = useState("");

  // --- STATE: BUY MODE ---
  const [quantity, setQuantity] = useState(1);
  const [deliveryLocation, setDeliveryLocation] = useState(userProfile?.mobileNumber || ""); 
  const [notes, setNotes] = useState("");
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  // --- LOGIC: SUBMIT LISTING (Sell/Request) ---
  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !price || !timeEstimate) {
      toast.error("Please fill in all details.");
      return;
    }
    
    setLoading(true);
    const data = {
      title,
      description,
      price: `₹${price}`,
      category,
      dietaryType,
      timeEstimate,
      isCustomOrder: mode === 'request',
      status: "Active"
    };

    if (onSubmit) await onSubmit(data);
    setLoading(false);
  };

  // --- LOGIC: BUY ITEM (Payment Flow) ---
  const handleBuySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) { toast.error("Login required."); return; }
    if (quantity <= 0 || !deliveryLocation.trim()) { toast.error("Invalid details."); return; }
    setIsConfirmingPayment(true);
  };

  const handlePaymentInitiation = async () => {
    if (!offering || !user || !userProfile) return;
    setIsConfirmingPayment(false);
    setLoading(true);

    const priceMatch = offering.price.match(/₹(\d+(\.\d+)?)/);
    const unitPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
    const totalAmount = unitPrice * quantity;
    const orderTitle = `${offering.title} x${quantity}`;

    try {
      // 1. Create Order
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
          quantity,
          totalAmount,
          deliveryLocation: deliveryLocation.trim(),
          notes: notes.trim(),
          status: "Pending Confirmation",
          collegeName: userProfile.collegeName,
          ambassadorDelivery,
          ambassadorMessage: ambassadorMessage || null,
        }
      );

      // 2. Stats
      if (ambassadorDelivery && incrementAmbassadorDeliveriesCount) {
        await incrementAmbassadorDeliveriesCount();
      }

      // 3. UPI Link
      const targetUPI = DEVELOPER_UPI_ID || "example@upi"; 
      const upiDeepLink = `upi://pay?pa=${targetUPI}&pn=NatpeThunai&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Food: ${orderTitle} #${newOrder.$id.substring(0,6)}`)}`;
      window.open(upiDeepLink, "_blank");
      
      toast.success("Order Placed! Please complete payment.");
      if (onOrderPlaced) onOrderPlaced();

    } catch (e: any) {
      toast.error(e.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER: SELL / REQUEST FORM ---
  if (mode === 'sell' || mode === 'request') {
    return (
      <form onSubmit={handleListingSubmit} className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="homemade-meals">Homemade Meal</SelectItem>
              <SelectItem value="wellness-remedies">Home Remedy</SelectItem>
              <SelectItem value="snacks">Snacks</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">{mode === 'request' ? "What are you craving?" : "Dish Name"}</Label>
          <div className="relative">
              <Utensils className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="title" placeholder={mode === 'request' ? "e.g. Spicy Paneer Roll" : "e.g. Chicken Biryani"} className="pl-9" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Type</Label>
          <RadioGroup defaultValue="veg" value={dietaryType} onValueChange={setDietaryType} className="flex gap-4">
              <div className={`flex items-center space-x-2 border p-2 rounded-md cursor-pointer ${dietaryType === 'veg' ? 'bg-green-50 border-green-500' : 'border-border'}`}>
                  <RadioGroupItem value="veg" id="veg" className="text-green-600 border-green-600" />
                  <Label htmlFor="veg" className="flex items-center gap-1 cursor-pointer text-green-700">
                      <Leaf className="h-3 w-3" /> Veg
                  </Label>
              </div>
              <div className={`flex items-center space-x-2 border p-2 rounded-md cursor-pointer ${dietaryType === 'non-veg' ? 'bg-red-50 border-red-500' : 'border-border'}`}>
                  <RadioGroupItem value="non-veg" id="non-veg" className="text-red-600 border-red-600" />
                  <Label htmlFor="non-veg" className="flex items-center gap-1 cursor-pointer text-red-700">
                      <Beef className="h-3 w-3" /> Non-Veg
                  </Label>
              </div>
          </RadioGroup>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desc">{mode === 'request' ? "Preferences" : "Description"}</Label>
          <Textarea id="desc" placeholder="Ingredients, spiciness level, etc." className="h-16 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
              <Label htmlFor="price">{mode === 'request' ? "Budget (₹)" : "Price (₹)"}</Label>
              <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="price" type="number" placeholder="100" className="pl-9" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
          </div>
          <div className="space-y-1.5">
              <Label htmlFor="time">{mode === 'request' ? "Needed By" : "Prep Time"}</Label>
              <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="time" placeholder="30 Mins" className="pl-9" value={timeEstimate} onChange={(e) => setTimeEstimate(e.target.value)} />
              </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="submit" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === 'request' ? "Post Request" : "Start Selling")}
          </Button>
        </DialogFooter>
      </form>
    );
  }

  // --- RENDER: BUY FORM ---
  return (
    <>
      <form onSubmit={handleBuySubmit} className="grid gap-4 py-2">
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-xs font-bold">No Cancellation</AlertTitle>
          <AlertDescription className="text-[10px]">Orders cannot be cancelled once preparation starts.</AlertDescription>
        </Alert>

        <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 space-y-2">
                <Label htmlFor="quantity">Qty</Label>
                <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} min="1" className="text-center" required />
            </div>
            <div className="col-span-3 space-y-2">
                <Label htmlFor="location">Delivery Spot</Label>
                <Input id="location" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} placeholder="e.g. Block C, Room 404" required />
            </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Instructions</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Extra spicy..." className="h-16 resize-none" />
        </div>

        <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-secondary-neon" />
                    <Label htmlFor="ambassador-mode" className="font-semibold cursor-pointer">Ambassador Delivery</Label>
                </div>
                <Switch id="ambassador-mode" checked={ambassadorDelivery} onCheckedChange={setAmbassadorDelivery} />
            </div>
            {ambassadorDelivery && (
                 <Input placeholder="Instructions for runner" value={ambassadorMessage} onChange={(e) => setAmbassadorMessage(e.target.value)} className="text-xs h-8" />
            )}
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 w-full sm:w-auto">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Proceed to Pay"}
          </Button>
        </DialogFooter>
      </form>

      <Dialog open={isConfirmingPayment} onOpenChange={setIsConfirmingPayment}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Confirm Payment</DialogTitle></DialogHeader>
          <div className="py-2 text-sm space-y-2">
             <div className="flex justify-between"><span>Item:</span><span className="font-bold">{offering?.title} x{quantity}</span></div>
             <div className="flex justify-between pt-2 border-t font-bold text-lg text-secondary-neon"><span>Total:</span><span>₹{(parseFloat(offering?.price?.match(/₹(\d+(\.\d+)?)/)?.[1] || '0') * quantity).toFixed(0)}</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmingPayment(false)}>Back</Button>
            <Button onClick={handlePaymentInitiation} className="bg-secondary-neon text-primary-foreground">Pay Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlaceFoodOrderForm;