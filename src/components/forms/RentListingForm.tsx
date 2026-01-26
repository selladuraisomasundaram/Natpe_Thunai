"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";
import { Brain, IndianRupee, MapPin, Loader2 } from "lucide-react";
import { usePriceAnalysis } from "@/hooks/usePriceAnalysis";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface RentListingFormProps {
  onSubmit: (product: {
    title: string;
    price: string;
    description: string;
    policies: string;
    imageUrl: string;
    location: string;
    ambassadorDelivery: boolean;
    ambassadorMessage: string;
  }) => void;
  onCancel: () => void;
}

const RentListingForm: React.FC<RentListingFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [rentPriceValue, setRentPriceValue] = useState("");
  const [rentUnit, setRentUnit] = useState<"day" | "hour">("day");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [policies, setPolicies] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false); // Local loading state for button feedback

  const { isPriceAnalyzed, isPriceReasonable, aiSuggestion, aiLoading, analyzePrice, resetAnalysis } = usePriceAnalysis();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocalSubmitting) return; // Prevent double clicks locally

    if (!title || !rentPriceValue || !description || !policies || !location) {
      toast.error("All fields are required.");
      return;
    }
    if (!isPriceAnalyzed) { toast.error("Please verify price first."); return; }

    setIsLocalSubmitting(true);
    
    // Pass data up to wrapper
    onSubmit({ 
        title, 
        price: `₹${rentPriceValue}/${rentUnit}`, 
        description, 
        policies, 
        location, // Correctly passing location state
        imageUrl: imageUrl.trim() || "/app-logo.png", 
        ambassadorDelivery, 
        ambassadorMessage 
    });
    
    // Note: We don't set isLocalSubmitting false here because the component might unmount or the wrapper handles the async logic
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <div className="space-y-1.5">
        <Label className="text-foreground font-semibold">Item Name</Label>
        <Input
          placeholder="e.g. Scientific Calculator, DSLR Camera"
          value={title}
          onChange={(e) => { setTitle(e.target.value); resetAnalysis(); }}
          className="h-12 bg-secondary/5 border-border focus:ring-secondary-neon"
          disabled={isLocalSubmitting}
        />
      </div>

      {/* Price & Unit Row */}
      <div className="space-y-1.5">
        <Label className="text-foreground font-semibold">Rental Rate</Label>
        <div className="flex gap-2">
            <div className="relative flex-grow">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    type="number"
                    placeholder="50"
                    value={rentPriceValue}
                    onChange={(e) => { setRentPriceValue(e.target.value); resetAnalysis(); }}
                    className="pl-9 h-11 bg-secondary/5 border-border"
                    disabled={isLocalSubmitting}
                />
            </div>
            <Select value={rentUnit} onValueChange={(v: any) => { setRentUnit(v); resetAnalysis(); }} disabled={isLocalSubmitting}>
                <SelectTrigger className="w-[110px] h-11 bg-secondary/5 border-border">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="day">/ Day</SelectItem>
                    <SelectItem value="hour">/ Hour</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* AI Price Check */}
      <div className={cn("rounded-lg border p-3 transition-all", isPriceAnalyzed ? (isPriceReasonable ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20") : "bg-muted/30 border-dashed")}>
        <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Brain className="h-3 w-3" /> Price Check
            </h4>
            <Button
                type="button" variant="ghost" size="sm"
                onClick={() => analyzePrice(title, rentPriceValue, undefined, rentUnit)}
                disabled={aiLoading || !title || !rentPriceValue || isLocalSubmitting}
                className="h-6 text-xs text-secondary-neon p-0 hover:bg-transparent"
            >
                {aiLoading ? "Scanning..." : "Verify Rate"}
            </Button>
        </div>
        {isPriceAnalyzed && <p className="text-xs mt-2 text-foreground/80">{aiSuggestion}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-foreground font-semibold">Pickup / Return Location</Label>
        <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
            placeholder="e.g. Block A Hostel Warden Office"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-9 h-11 bg-secondary/5 border-border"
            disabled={isLocalSubmitting}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
            <Label className="text-foreground font-semibold">Description</Label>
            <Textarea
                placeholder="Condition, included accessories..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary/5 border-border h-24"
                disabled={isLocalSubmitting}
            />
        </div>
        <div className="space-y-1.5">
            <Label className="text-foreground font-semibold">Policies / Terms</Label>
            <Textarea
                placeholder="e.g. ID card deposit required, return by 8 PM..."
                value={policies}
                onChange={(e) => setPolicies(e.target.value)}
                className="bg-secondary/5 border-border h-24"
                disabled={isLocalSubmitting}
            />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
            <Label className="text-foreground font-semibold">Image URL (Optional)</Label>
            <Link to="/help/image-to-url" className="text-[10px] text-secondary-neon hover:underline">How?</Link>
        </div>
        <Input placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="h-11 bg-secondary/5 border-border" disabled={isLocalSubmitting} />
      </div>

      <AmbassadorDeliveryOption ambassadorDelivery={ambassadorDelivery} setAmbassadorDelivery={setAmbassadorDelivery} ambassadorMessage={ambassadorMessage} setAmbassadorMessage={setAmbassadorMessage} />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-11" disabled={isLocalSubmitting}>Cancel</Button>
        <Button 
            type="submit" 
            className="flex-[2] h-11 bg-secondary-neon text-primary-foreground font-bold" 
            disabled={!isPriceReasonable && isPriceAnalyzed || isLocalSubmitting}
        >
          {isLocalSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          List for Rent
        </Button>
      </div>
    </form>
  );
};

export default RentListingForm;