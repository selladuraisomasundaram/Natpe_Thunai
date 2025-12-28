"use client";

import React, { useState } from "react";
import { MarketWarningBanner } from "@/components/MarketWarningBanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import MarketTabs from "@/components/MarketTabs";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID,APPWRITE_SERVICE_REVIEWS_COLLECTION_ID } from "@/lib/appwrite";
import MarketListingFormWrapper from "@/components/forms/MarketListingFormWrapper";
import { PlusCircle } from "lucide-react";

export default function MarketPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section for The Exchange */}
      <section className="relative bg-gradient-to-r from-primary-neon to-secondary-neon py-20 text-center text-white shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">The Exchange</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-90">
            Your central hub for buying, selling, and trading unique products and services within our community.
          </p>
          <p className="text-lg opacity-80">
            Discover new opportunities or list your own offerings with ease.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container mx-auto p-4 pb-20 -mt-10 relative z-10"> {/* Added -mt-10 to slightly overlap with hero */}
        <div className="max-w-4xl mx-auto space-y-8 bg-card p-6 rounded-lg shadow-xl border border-border">
          <MarketWarningBanner />
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-3xl font-bold text-foreground">Current Listings</h2>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 text-lg px-6 py-3 rounded-full shadow-md transition-all duration-300 ease-in-out transform hover:scale-105">
                  <PlusCircle className="mr-2 h-5 w-5" /> Create New Listing
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
                <MarketListingFormWrapper onClose={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <MarketTabs initialTab="all" />
        </div>
      </div>
    </div>
  );
}