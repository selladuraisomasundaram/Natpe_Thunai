"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import ProductListingCard from "@/components/ProductListingCard";
import ServiceListingCard from "@/components/ServiceListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, ChevronLeft, ChevronRight, Compass, Inbox, 
  ShoppingBag, Briefcase, Utensils
} from "lucide-react";
import { useMarketListings } from '@/hooks/useMarketListings';
import { useServiceListings } from '@/hooks/useServiceListings';
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 6; 

const DiscoveryFeed: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  // 1. Fetch Data
  const { products, isLoading: productsLoading, error: productsError } = useMarketListings();
  const { services, isLoading: servicesLoading, error: servicesError } = useServiceListings(undefined);

  // State for Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // 2. Combine, Tag & Sort Data
  const combinedFeed = useMemo(() => {
    const taggedProducts = products.map(p => ({ ...p, feedType: 'product' }));
    const taggedServices = services.map(s => ({ ...s, feedType: 'service' }));

    const allItems = [...taggedProducts, ...taggedServices];

    // Sort by creation date (Newest first)
    return allItems.sort((a: any, b: any) => 
      new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
    );
  }, [products, services]);

  const isLoading = productsLoading || servicesLoading;
  const error = productsError || servicesError;

  // 3. Pagination Logic
  const totalPages = Math.ceil(combinedFeed.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = combinedFeed.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const scrollToTop = () => {
    const element = document.getElementById('discovery-feed-top');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      setTimeout(scrollToTop, 100);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      setTimeout(scrollToTop, 100);
    }
  };

  // 4. Action Handler
  const handleItemAction = (item: any) => {
    if (item.feedType === 'product') {
        navigate(`/market/${item.$id}`);
    } else {
        const isFood = ['homemade-meals', 'wellness-remedies', 'snacks'].includes(item.category);
        const targetPath = isFood ? '/services/food-wellness' : '/services/freelance';
        const actionLabel = isFood ? "ordering" : "hiring";
        
        toast.info(`Redirecting to ${isFood ? 'Food Court' : 'Freelance Hub'}...`, {
            description: `Find this listing there to start ${actionLabel}.`
        });
        navigate(targetPath);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
           <Compass className="h-6 w-6 text-secondary-neon" /> Discovery Feed
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl bg-muted/20" />
            ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Feed</AlertTitle>
          <AlertDescription>Failed to load listings. Please check your connection.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (combinedFeed.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
           <Compass className="h-6 w-6 text-secondary-neon" /> Discovery Feed
        </h2>
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
            <div className="bg-muted/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No Listings Yet</h3>
            <p className="text-muted-foreground mt-2">Be the first to post a product or service!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4" id="discovery-feed-top">
      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        <Compass className="h-6 w-6 text-secondary-neon" />
        <h2 className="text-2xl font-bold text-foreground">Discovery Feed</h2>
      </div>

      {/* Feed Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {currentItems.map((item: any) => {
            const isFood = ['homemade-meals', 'wellness-remedies', 'snacks'].includes(item.category);
            
            return (
              <div key={item.$id} className="group relative flex flex-col h-full rounded-xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-border/50">
                
                {/* CSS HACK: [&_button]:hidden 
                   This effectively hides any button inside the child components,
                   removing the "Double Button" issue without editing the card files.
                */}
                <div className="flex-1 [&_button]:hidden [&_a]:pointer-events-none">
                    {item.feedType === 'product' ? (
                        <ProductListingCard product={item} />
                    ) : (
                        <ServiceListingCard
                            service={item}
                            isFoodOrWellnessCategory={isFood}
                            onOpenBargainDialog={() => {}} 
                            onOpenReviewDialog={() => {}}
                        />
                    )}
                </div>

                {/* THE ONLY ACTION BUTTON (Neon Green Context Based) */}
                <div className="mt-[-4px] bg-card border-x border-b border-border rounded-b-xl p-3 pt-1 shadow-sm group-hover:shadow-md transition-shadow z-10 relative">
                    <Button 
                        className="w-full font-bold shadow-lg shadow-secondary-neon/20 flex items-center justify-center gap-2 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
                        onClick={() => handleItemAction(item)}
                    >
                        {item.feedType === 'product' && <><ShoppingBag className="h-4 w-4" /> View & Buy</>}
                        {item.feedType === 'service' && isFood && <><Utensils className="h-4 w-4" /> Order Now</>}
                        {item.feedType === 'service' && !isFood && <><Briefcase className="h-4 w-4" /> Hire / Connect</>}
                    </Button>
                </div>

              </div>
            );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-border">
          <span className="text-sm font-medium text-muted-foreground order-2 sm:order-1">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="h-9 px-4 border-input hover:bg-accent hover:text-accent-foreground"
            >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            
            <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = i + 1;
                    return (
                        <Button
                            key={p}
                            variant={currentPage === p ? "default" : "ghost"}
                            size="icon"
                            className={`h-9 w-9 ${currentPage === p ? "bg-secondary-neon text-primary-foreground font-bold" : "text-muted-foreground"}`}
                            onClick={() => { setCurrentPage(p); setTimeout(scrollToTop, 100); }}
                        >
                            {p}
                        </Button>
                    );
                })}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="h-9 px-4 border-input hover:bg-accent hover:text-accent-foreground"
            >
                Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryFeed;