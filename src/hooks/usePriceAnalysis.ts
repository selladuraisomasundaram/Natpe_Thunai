"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

// --- Types & Configurations ---

interface PriceRange {
  min: number;
  max: number;
  label: string;
}

interface PriceAnalysisResult {
  isPriceAnalyzed: boolean;
  isPriceReasonable: boolean;
  aiSuggestion: string;
  aiLoading: boolean;
  analyzePrice: (
    title: string,
    priceValue: string,
    categoryOrCondition?: string, // Can be category (Sell) or condition (Sports)
    rentUnit?: "day" | "hour"
  ) => void;
  resetAnalysis: () => void;
}

// Configuration for "Smart" Price Ranges
// We use regex for title matching to handle plurals and variations easily.
const PRICE_CONFIG: Record<string, PriceRange> = {
  // Electronics
  laptop: { min: 8000, max: 80000, label: "used laptop" },
  macbook: { min: 25000, max: 150000, label: "used MacBook" }, // Premium item
  phone: { min: 2000, max: 30000, label: "used smartphone" },
  iphone: { min: 8000, max: 80000, label: "used iPhone" }, // Premium item
  tablet: { min: 3000, max: 40000, label: "used tablet" },
  ipad: { min: 10000, max: 60000, label: "used iPad" }, // Premium item
  calculator: { min: 100, max: 1000, label: "scientific calculator" },
  headphones: { min: 300, max: 15000, label: "headphones" },

  // Books
  textbook: { min: 100, max: 1500, label: "used textbook" },
  novel: { min: 50, max: 500, label: "used novel" },
  notes: { min: 0, max: 500, label: "study notes" }, // 0 allows free

  // Sports (Generic baselines)
  cricket: { min: 300, max: 5000, label: "cricket gear" },
  football: { min: 200, max: 2000, label: "football" },
  badminton: { min: 300, max: 3000, label: "badminton racket" },
  cycle: { min: 2000, max: 15000, label: "bicycle" },
};

// Rental Multipliers (vs Sell Price) - Rough estimates for logic
const RENT_CONFIG = {
  hour: { min: 10, max: 200, label: "hourly rent" },
  day: { min: 50, max: 1000, label: "daily rent" },
};

export const usePriceAnalysis = (): PriceAnalysisResult => {
  const [isPriceAnalyzed, setIsPriceAnalyzed] = useState(false);
  const [isPriceReasonable, setIsPriceReasonable] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const resetAnalysis = useCallback(() => {
    setIsPriceAnalyzed(false);
    setIsPriceReasonable(false);
    setAiSuggestion("");
    setAiLoading(false);
  }, []);

  const analyzePrice = useCallback(
    (
      title: string,
      priceValue: string,
      categoryOrCondition?: string,
      rentUnit?: "day" | "hour"
    ) => {
      // 1. Reset State
      setAiLoading(true);
      setIsPriceAnalyzed(false);
      setIsPriceReasonable(false);
      setAiSuggestion("");

      // 2. Simulate "Thinking" (Reduced to 800ms for snappier feel)
      setTimeout(() => {
        // --- INPUT CLEANING ---
        // Remove commas and spaces (e.g., "1,500" -> "1500")
        const cleanPriceString = priceValue.toString().replace(/,/g, "").trim();
        const price = parseFloat(cleanPriceString);
        const lowerTitle = title.toLowerCase();
        
        let reasonable = true;
        let suggestion = "";
        let matchedCategoryKey: string | null = null;

        // --- VALIDATION ---
        if (isNaN(price)) {
          setAiLoading(false); // Stop if empty/invalid
          return;
        }

        if (price <= 0 && !lowerTitle.includes("free")) {
          // Allow 0 only if title says "free", otherwise flag it
          reasonable = false;
          suggestion = "Price is zero. Did you mean to list this as free?";
        } else {
          // --- SMART DETECTION LOGIC ---
          
          // 1. Identify Item Type from Title
          // We check specific premium keywords first (e.g., "macbook" before "laptop")
          const keys = Object.keys(PRICE_CONFIG);
          for (const key of keys) {
            if (lowerTitle.includes(key)) {
              // If we found a match, check if we already have a more specific match
              // (Simple heuristic: longer keys are usually more specific, e.g. "iphone" > "phone")
              if (!matchedCategoryKey || key.length > matchedCategoryKey.length) {
                matchedCategoryKey = key;
              }
            }
          }

          // 2. Logic Branching
          if (rentUnit) {
            // --- RENTAL LOGIC ---
            // If we identified the item (e.g. "cycle"), we can try to be specific,
            // otherwise use generic rental limits.
            const genericRent = RENT_CONFIG[rentUnit];
            
            if (matchedCategoryKey === "cycle" || lowerTitle.includes("bike")) {
               // Cycles rent for more than generic items
               const cycleMin = rentUnit === 'hour' ? 20 : 100;
               const cycleMax = rentUnit === 'hour' ? 100 : 500;
               
               if (price < cycleMin || price > cycleMax) {
                 reasonable = false;
                 suggestion = `For a bicycle, reasonable rent is usually ₹${cycleMin}-₹${cycleMax} per ${rentUnit}.`;
               }
            } else if (matchedCategoryKey && (matchedCategoryKey.includes("laptop") || matchedCategoryKey.includes("macbook"))) {
                // Laptops rent higher
               const lapMin = rentUnit === 'hour' ? 50 : 300;
               const lapMax = rentUnit === 'hour' ? 200 : 1500;

               if (price < lapMin || price > lapMax) {
                 reasonable = false;
                 suggestion = `For a laptop, reasonable rent is usually ₹${lapMin}-₹${lapMax} per ${rentUnit}.`;
               }
            } else {
               // Fallback Generic Rent
               if (price < genericRent.min || price > genericRent.max) {
                 reasonable = false;
                 suggestion = `Typical ${genericRent.label} rates are between ₹${genericRent.min} and ₹${genericRent.max}.`;
               } else {
                 suggestion = "Rental price looks standard for student exchanges.";
               }
            }

          } else {
            // --- SELLING LOGIC ---
            
            if (matchedCategoryKey) {
              const range = PRICE_CONFIG[matchedCategoryKey];
              let min = range.min;
              let max = range.max;

              // Apply Condition Modifiers (if provided)
              if (categoryOrCondition) {
                const cond = categoryOrCondition.toLowerCase();
                if (cond === "new" || cond === "like new" || cond === "open box") {
                  max *= 1.5; // Allow higher price for new items
                  min *= 1.2;
                } else if (cond === "heavily used" || cond === "damaged") {
                  max *= 0.6; // Expect lower price
                  min *= 0.5;
                }
              }

              // Evaluate Price
              if (price > max) {
                reasonable = false;
                suggestion = `This price seems high for a ${range.label}. Market average is ₹${range.min} - ₹${range.max}.`;
              } else if (price < min) {
                // Determine if "Good Deal" or "Suspicious"
                if (price < min * 0.3) {
                   reasonable = false; // Flag if it's < 30% of min value (Scam risk)
                   suggestion = `This price is suspiciously low for a ${range.label}. Ensure it's not a mistake.`;
                } else {
                   reasonable = true; // It's just a good deal
                   suggestion = `Great price! This is a very competitive deal for a ${range.label}.`;
                }
              } else {
                suggestion = `Price is within the fair market range for a ${range.label}.`;
              }

            } else {
              // --- FALLBACK (No keyword match) ---
              // Use categoryOrCondition as a hint if it's a broad category
              if (categoryOrCondition === "electronics" && price > 50000) {
                 suggestion = "High-value electronics. Ensure you verify the buyer/seller reputation.";
              } else if (categoryOrCondition === "books" && price > 2000) {
                 reasonable = false;
                 suggestion = "This seems very expensive for a used book unless it's a rare edition.";
              } else if (!categoryOrCondition) {
                 // Likely Gift/Craft or Misc
                 if (price > 2000) {
                   suggestion = "For custom/handmade items, pricing is subjective. Ensure description justifies the cost.";
                 } else {
                   suggestion = "Price seems acceptable.";
                 }
              } else {
                 suggestion = "Price looks okay based on general category standards.";
              }
            }
          }
        }

        // 3. Update State
        setIsPriceAnalyzed(true);
        setIsPriceReasonable(reasonable);
        setAiSuggestion(suggestion);
        setAiLoading(false);

        // 4. Feedback Toast
        if (reasonable) {
          // Don't show toast for "default" reasonable to avoid spam, 
          // only show if we have a specific positive comment (Great Deal) 
          // or just a generic success.
          if (suggestion.includes("Great price")) {
             toast.success(suggestion);
          } else {
             toast.success("Price analysis complete: Looks reasonable!");
          }
        } else {
          toast.warning(`Price Alert: ${suggestion}`);
        }
      }, 800);
    },
    []
  );

  return {
    isPriceAnalyzed,
    isPriceReasonable,
    aiSuggestion,
    aiLoading,
    analyzePrice,
    resetAnalysis,
  };
};