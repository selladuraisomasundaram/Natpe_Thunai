"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ProductListingCard from "@/components/ProductListingCard"; // Import ProductListingCard
import { useAuth } from "@/context/AuthContext"; // Import useAuth

// Define a type for the listings to ensure all required ProductListingCard props are present
interface DiscoveryListing {
  $id: string;
  title: string;
  price: string;
  imageUrl: string;
  category: string; // Keep category for internal filtering/display if needed
  sellerRating: number;
  sellerBadge?: string;
  type: "sell" | "rent" | "gift" | "sports" | "gift-request";
  description: string;
  sellerId: string;
  sellerName: string;
}

const initialListings: DiscoveryListing[] = [
  { $id: "1", title: "Vintage Camera", price: "₹5000", imageUrl: "/app-logo.png", category: "Electronics", sellerRating: 4.8, sellerName: "Alice Smith", sellerId: "user123", type: "sell", description: "A classic vintage camera, great for collectors." },
  { $id: "2", title: "Textbook: Advanced Physics", price: "₹800", imageUrl: "/app-logo.png", category: "Books", sellerRating: 4.5, sellerName: "Bob Johnson", sellerId: "user124", type: "sell", description: "Used textbook in good condition." },
  { $id: "3", title: "Custom Art Commission", price: "₹1500", imageUrl: "/app-logo.png", category: "Services", sellerRating: 5.0, sellerName: "Charlie Brown", sellerId: "user125", type: "gift", description: "Get a personalized art piece." },
  { $id: "4", title: "Gaming Headset", price: "₹2500", imageUrl: "/app-logo.png", category: "Electronics", sellerRating: 4.7, sellerName: "David Lee", sellerId: "user126", type: "sell", description: "High-quality gaming headset with mic." },
];

const moreListings: DiscoveryListing[] = [
  { $id: "5", title: "Graphic Design Service", price: "₹1000", imageUrl: "/app-logo.png", category: "Services", sellerRating: 4.9, sellerName: "Eve Davis", sellerId: "user127", type: "gift", description: "Professional graphic design for your projects." },
  { $id: "6", title: "Used Bicycle", price: "₹3000", imageUrl: "/app-logo.png", category: "Sports", sellerRating: 4.2, sellerName: "Frank Green", sellerId: "user128", type: "sports", description: "Reliable bicycle for campus commutes." },
  { $id: "7", title: "Handmade Earrings", price: "₹350", imageUrl: "/app-logo.png", category: "Crafts", sellerRating: 5.0, sellerName: "Grace Hall", sellerId: "user129", type: "gift", description: "Unique handmade earrings, perfect gift." },
  { $id: "8", title: "Old Novels Set", price: "₹600", imageUrl: "/app-logo.png", category: "Books", sellerRating: 4.6, sellerName: "Heidi King", sellerId: "user130", type: "sell", description: "Collection of classic novels." },
  { $id: "9", title: "Web Development Help", price: "₹2000", imageUrl: "/app-logo.png", category: "Services", sellerRating: 4.8, sellerName: "Ivan Nash", sellerId: "user131", type: "gift", description: "Assistance with web development projects." },
  { $id: "10", title: "Basketball", price: "₹800", imageUrl: "/app-logo.png", category: "Sports", sellerRating: 4.3, sellerName: "Judy Olsen", sellerId: "user132", type: "sports", description: "Official size basketball, good for practice." },
];

const DiscoveryFeed = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState(initialListings);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { userProfile } = useAuth(); // Get userProfile to check role
  const isDeveloper = userProfile?.role === "developer";

  const handleViewDetails = (listingId: string) => {
    toast.info(`Viewing details for listing ${listingId}`);
    navigate(`/market/product/${listingId}`); // Navigate to the product details page
  };

  const handleViewAllFeed = () => {
    navigate("/market");
    toast.info("Navigating to the full Discovery Feed!");
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setListings((prevListings) => [...prevListings, ...moreListings]);
      setHasMore(false); // For this demo, we'll only load one more batch
      setLoadingMore(false);
      toast.success("More listings loaded!");
    }, 1000);
  };

  // Developer delete function (placeholder, actual logic is in MarketPage)
  const handleDeveloperDelete = (productId: string) => {
    toast.info(`Developer delete action for product ID: ${productId} (simulated from Discovery Feed)`);
    // In a real scenario, this would trigger a global state update or a direct API call
    // For now, we'll just remove it from the local state for demonstration
    setListings(prev => prev.filter(item => item.$id !== productId));
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground cursor-pointer hover:text-secondary-neon transition-colors" onClick={handleViewAllFeed}>
          Discovery Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground mb-3">New, trending, top-rated listings.</p>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border border-border p-2">
          <div className="flex w-max space-x-4 pb-2">
            {listings.map((listing) => (
              <div key={listing.$id} className="w-[150px] flex-shrink-0">
                {/* Using ProductListingCard directly */}
                <ProductListingCard
                  $id={listing.$id}
                  imageUrl={listing.imageUrl}
                  title={listing.title}
                  price={listing.price}
                  sellerRating={listing.sellerRating}
                  sellerBadge={listing.sellerBadge}
                  type={listing.type}
                  description={listing.description}
                  sellerId={listing.sellerId}
                  sellerName={listing.sellerName}
                  onDeveloperDelete={isDeveloper ? handleDeveloperDelete : undefined}
                />
              </div>
            ))}
            {hasMore && (
              <div className="w-[150px] flex-shrink-0 flex items-center justify-center">
                <Button
                  variant="outline"
                  className="border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Load More
                </Button>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DiscoveryFeed;