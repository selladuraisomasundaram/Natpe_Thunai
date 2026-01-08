"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import ProductListingCard from "@/components/ProductListingCard";
import ServiceListingCard from "@/components/ServiceListingCard"; // Import Service Card
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useMarketListings } from '@/hooks/useMarketListings';
import { useServiceListings } from '@/hooks/useServiceListings'; // Import Service Hook
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 4;

const DiscoveryFeed: React.FC = () => {
  const { userProfile } = useAuth();
  
  // 1. Fetch both Products and Services
  const { products, isLoading: productsLoading, error: productsError } = useMarketListings();
  const { services, isLoading: servicesLoading, error: servicesError } = useServiceListings(undefined); // undefined gets all categories

  // State for Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // 2. Combine and Sort Data (Memoized for performance)
  const combinedFeed = useMemo(() => {
    // Add a 'kind' tag to distinguish them easily
    const taggedProducts = products.map(p => ({ ...p, feedType: 'product' }));
    const taggedServices = services.map(s => ({ ...s, feedType: 'service' }));

    const allItems = [...taggedProducts, ...taggedServices];

    // Sort by creation date (Newest first)
    return allItems.sort((a, b) => 
      new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
    );
  }, [products, services]);

  const isLoading = productsLoading || servicesLoading;
  const error = productsError || servicesError;

  // 3. Calculate Pagination
  const totalPages = Math.ceil(combinedFeed.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = combinedFeed.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top of feed
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Feed</AlertTitle>
          <AlertDescription>Failed to load listings: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (combinedFeed.length === 0) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Listings Found</AlertTitle>
          <AlertDescription>
            It looks like there are no products or services available right now for your college.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Feed Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map((item: any) => (
          <React.Fragment key={item.$id}>
            {item.feedType === 'product' ? (
              <ProductListingCard
                product={item}
                // REMOVED: onDeveloperDelete prop to hide the button
              />
            ) : (
              <ServiceListingCard
                service={item}
                isFoodOrWellnessCategory={['homemade-meals', 'wellness-remedies'].includes(item.category)}
                onOpenBargainDialog={() => {}} // Pass dummies if handled internally by card now
                onOpenReviewDialog={() => {}}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pb-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="flex items-center gap-1 border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          
          <span className="text-sm font-medium text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DiscoveryFeed;