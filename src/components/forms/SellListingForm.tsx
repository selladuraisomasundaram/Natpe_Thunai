"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";
import { Brain, CheckCircle, XCircle, MapPin, IndianRupee, Image as ImageIcon, Tag, AlertCircle, HelpCircle } from "lucide-react";
import { usePriceAnalysis } from "@/hooks/usePriceAnalysis";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SellListingFormProps {
  onSubmit: (product: {
    title: string;
    price: string;
    description: string;
    category: string;
    damages: string;
    imageUrl: string;
    location: string; // Added Location
    ambassadorDelivery: boolean;
    ambassadorMessage: string;
  }) => void;
  onCancel: () => void;
}

const SellListingForm: React.FC<SellListingFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [location, setLocation] = useState(""); // Location State
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [damages, setDamages] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");

  const {
    isPriceAnalyzed,
    isPriceReasonable,
    aiSuggestion,
    aiLoading,
    analyzePrice,
    resetAnalysis,
  } = usePriceAnalysis();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !priceValue || !description || !category || !location) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!isPriceAnalyzed) {
      toast.error("Please analyze the price first.");
      return;
    }
    
    // Allow submission even if unreasonable, but warn user via UI logic before this
    onSubmit({ 
      title, 
      price: `₹${priceValue}`, 
      description, 
      category, 
      damages, 
      location, 
      imageUrl: imageUrl.trim() || "/app-logo.png", 
      ambassadorDelivery, 
      ambassadorMessage 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Title */}
      <div className="space-y-1.5">
        <Label className="text-foreground font-semibold">What are you selling?</Label>
        <Input
          placeholder="e.g. Mechanical Keyboard, Semester 3 Books"
          value={title}
          onChange={(e) => { setTitle(e.target.value); resetAnalysis(); }}
          className="h-12 bg-secondary/5 border-border focus:ring-secondary-neon"
        />
      </div>

      {/* Price & Category Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-foreground font-semibold">Price</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="500"
              value={priceValue}
              onChange={(e) => { setPriceValue(e.target.value); resetAnalysis(); }}
              className="pl-9 h-11 bg-secondary/5 border-border"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground font-semibold">Category</Label>
          <Select value={category} onValueChange={(v) => { setCategory(v); resetAnalysis(); }}>
            <SelectTrigger className="h-11 bg-secondary/5 border-border">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="books">Books & Notes</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* AI Price Analysis Card */}
      <div className={cn("rounded-lg border p-3 transition-all", isPriceAnalyzed ? (isPriceReasonable ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20") : "bg-muted/30 border-dashed")}>
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Brain className="h-3 w-3" /> Price Check
            </h4>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => analyzePrice(title, priceValue, category)}
                disabled={aiLoading || !title || !priceValue}
                className="h-6 text-xs text-secondary-neon hover:text-secondary-neon/80 p-0 hover:bg-transparent"
            >
                {aiLoading ? "Scanning..." : "Check Price"}
            </Button>
        </div>
        {isPriceAnalyzed && (
            <div className="flex items-start gap-2 text-sm">
                {isPriceReasonable ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /> : <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />}
                <p className="text-foreground/90 text-xs leading-relaxed">{aiSuggestion}</p>
            </div>
        )}
        {!isPriceAnalyzed && <p className="text-xs text-muted-foreground italic">Enter title and price to verify market value.</p>}
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label className="text-foreground font-semibold">Preferred Meeting Spot</Label>
        <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
            placeholder="e.g. Library Entrance, Main Canteen"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-9 h-11 bg-secondary/5 border-border"
            />
        </div>
      </div>

      {/* Description & Damages */}
      <div className="space-y-4">
        <div className="space-y-1.5">
            <Label className="text-foreground font-semibold">Description</Label>
            <Textarea
            placeholder="Item condition, age, reason for selling..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-secondary/5 border-border min-h-[80px]"
            />
        </div>
        <div className="space-y-1.5">
            <Label className="text-foreground font-semibold">Any Damages/Issues?</Label>
            <Input
            placeholder="e.g. Minor scratch on screen, loose binding"
            value={damages}
            onChange={(e) => setDamages(e.target.value)}
            className="h-11 bg-secondary/5 border-border"
            />
        </div>
      </div>

      {/* Image URL */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
            <Label className="text-foreground font-semibold">Image URL</Label>
            <Link to="/help/image-to-url" className="text-[10px] text-secondary-neon flex items-center gap-1 hover:underline">
                <HelpCircle className="h-3 w-3" /> Get Link?
            </Link>
        </div>
        <div className="relative">
            <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="pl-9 h-11 bg-secondary/5 border-border"
            />
        </div>
      </div>

      <AmbassadorDeliveryOption
        ambassadorDelivery={ambassadorDelivery}
        setAmbassadorDelivery={setAmbassadorDelivery}
        ambassadorMessage={ambassadorMessage}
        setAmbassadorMessage={setAmbassadorMessage}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-11 border-border">
          Cancel
        </Button>
        <Button 
            type="submit" 
            className="flex-[2] h-11 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-bold shadow-md"
            disabled={!isPriceReasonable && isPriceAnalyzed} // Prevent if flagged unreasonable
        >
          Post Listing
        </Button>
      </div>
    </form>
  );
};

export default SellListingForm;