"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";
import { Brain, CheckCircle, XCircle } from "lucide-react"; // Import AI-related icons

interface SellListingFormProps {
  onSubmit: (product: {
    title: string;
    price: string;
    description: string;
    category: string;
    damages: string;
    imageUrl: string;
    ambassadorDelivery: boolean; // New field
    ambassadorMessage: string; // New field
  }) => void;
  onCancel: () => void;
}

const SellListingForm: React.FC<SellListingFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [priceValue, setPriceValue] = useState(""); // Raw number input for price
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [damages, setDamages] = useState("");
  const [imageUrl, setImageUrl] = useState("/app-logo.png");
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");

  // AI Price Analysis States
  const [isPriceAnalyzed, setIsPriceAnalyzed] = useState(false);
  const [isPriceReasonable, setIsPriceReasonable] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleAnalyzePrice = () => {
    setAiLoading(true);
    setIsPriceAnalyzed(false);
    setIsPriceReasonable(false);
    setAiSuggestion("");

    setTimeout(() => { // Simulate AI processing time
      const price = parseFloat(priceValue);
      const lowerTitle = title.toLowerCase();
      let reasonable = true;
      let suggestion = "";

      if (isNaN(price) || price <= 0) {
        reasonable = false;
        suggestion = "Price must be a valid number greater than zero.";
      } else if (category === "electronics") {
        if (lowerTitle.includes("laptop")) {
          if (price < 10000 || price > 80000) { // Example range for used laptops
            reasonable = false;
            suggestion = "For a used laptop, a typical selling price is between ₹10,000 and ₹80,000, depending on specifications and condition.";
          }
        } else if (lowerTitle.includes("phone") || lowerTitle.includes("smartphone")) {
          if (price < 2000 || price > 30000) { // Example range for used phones
            reasonable = false;
            suggestion = "For a used smartphone, a typical selling price is between ₹2,000 and ₹30,000.";
          }
        } else {
          suggestion = "Consider market rates for similar used electronics.";
        }
      } else if (category === "books") {
        if (lowerTitle.includes("textbook")) {
          if (price < 100 || price > 1500) { // Example range for used textbooks
            reasonable = false;
            suggestion = "For a used textbook, a typical selling price is between ₹100 and ₹1,500, depending on edition and condition.";
          }
        } else if (lowerTitle.includes("novel")) {
          if (price < 50 || price > 500) { // Example range for used novels
            reasonable = false;
            suggestion = "For a used novel, a typical selling price is between ₹50 and ₹500.";
          }
        } else {
          suggestion = "Consider market rates for similar used books.";
        }
      } else {
        suggestion = "Price seems generally acceptable, but consider market rates for similar items in the 'Other' category.";
      }

      setIsPriceAnalyzed(true);
      setIsPriceReasonable(reasonable);
      setAiSuggestion(suggestion);
      setAiLoading(false);

      if (reasonable) {
        toast.success("Price analysis complete: Price seems reasonable!");
      } else {
        toast.warning(`Price analysis complete: Price might be unreasonable. ${suggestion}`);
      }
    }, 1500); // 1.5 second delay for AI simulation
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !priceValue || !description || !category) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!isPriceAnalyzed) {
      toast.error("Please analyze the price before creating the listing.");
      return;
    }
    if (!isPriceReasonable) {
      toast.error("The price is outside the reasonable range. Please adjust or confirm you understand.");
      return;
    }

    onSubmit({ title, price: `₹${priceValue}`, description, category, damages, imageUrl, ambassadorDelivery, ambassadorMessage });
    setTitle("");
    setPriceValue("");
    setDescription("");
    setCategory("");
    setDamages("");
    setImageUrl("/app-logo.png");
    setAmbassadorDelivery(false);
    setAmbassadorMessage("");
    setIsPriceAnalyzed(false);
    setIsPriceReasonable(false);
    setAiSuggestion("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-foreground">Title</Label>
        <Input
          id="title"
          type="text"
          placeholder="e.g., Gaming Laptop"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setIsPriceAnalyzed(false); }}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="price" className="text-foreground">Price</Label>
        <Input
          id="price"
          type="number" // Changed to number for better input control
          placeholder="e.g., 65000"
          value={priceValue}
          onChange={(e) => { setPriceValue(e.target.value); setIsPriceAnalyzed(false); }}
          required
          min="1"
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="description" className="text-foreground">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your item..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="damages" className="text-foreground">Damages (if any)</Label>
        <Textarea
          id="damages"
          placeholder="e.g., Minor scratch on the back, missing original box."
          value={damages}
          onChange={(e) => setDamages(e.target.value)}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="category" className="text-foreground">Category</Label>
        <Select value={category} onValueChange={(value) => { setCategory(value); setIsPriceAnalyzed(false); }} required>
          <SelectTrigger className="w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="books">Books</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="imageUrl" className="text-foreground">Image URL (Optional)</Label>
        <Input
          id="imageUrl"
          type="text"
          placeholder="e.g., https://example.com/image.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
        <p className="text-xs text-muted-foreground mt-1">Defaults to app logo if empty.</p>
      </div>

      <AmbassadorDeliveryOption
        ambassadorDelivery={ambassadorDelivery}
        setAmbassadorDelivery={setAmbassadorDelivery}
        ambassadorMessage={ambassadorMessage}
        setAmbassadorMessage={setAmbassadorMessage}
      />

      {/* AI Price Analysis Section */}
      <div className="space-y-2 border-t border-border pt-4 mt-4">
        <Button
          type="button"
          onClick={handleAnalyzePrice}
          disabled={aiLoading || !title || !priceValue || !category}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {aiLoading ? (
            <>
              <Brain className="mr-2 h-4 w-4 animate-pulse" /> Analyzing Price...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" /> Analyze Price
            </>
          )}
        </Button>
        {isPriceAnalyzed && (
          <div className={`p-3 rounded-md text-sm ${isPriceReasonable ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"}`}>
            <div className="flex items-center gap-2 font-semibold">
              {isPriceReasonable ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>Price Status: {isPriceReasonable ? "Reasonable" : "Potentially Unreasonable"}</span>
            </div>
            {aiSuggestion && <p className="mt-1">{aiSuggestion}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
          disabled={!isPriceReasonable || aiLoading} // Disable if price not reasonable or AI is loading
        >
          Create Listing
        </Button>
      </div>
    </form>
  );
};

export default SellListingForm;