"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import ProductListingCard from "@/components/ProductListingCard";
import ServiceListingCard from "@/components/ServiceListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ChevronLeft, ChevronRight, Compass, Gift, Loader2 } from "lucide-react";
import { useMarketListings } from '@/hooks/useMarketListings';
import { useServiceListings } from '@/hooks/useServiceListings';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
// --- 1. Import Appwrite DB directly to guarantee connection ---
import { databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";

const ITEMS_PER_PAGE = 6;

const DiscoveryFeed: React.FC = () => {
  // 2. We need 'userProfile' to get the ID, and 'checkUserStatus' to refresh UI after update
  const { userProfile, checkUserStatus } = useAuth();
  
  const { products, isLoading: productsLoading, error: productsError } = useMarketListings();
  const { services, isLoading: servicesLoading, error: servicesError } = useServiceListings(undefined);

  const [currentPage, setCurrentPage] = useState(1);
  const [isClaiming, setIsClaiming] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // --- XP CLAIM LOGIC (ROBUST VERSION) ---
  const handleClaimReward = async () => {
    // 3. Safety Check: Ensure we have a profile to update
    if (!userProfile || !userProfile.$id) {
        toast.error("Profile not found. Please refresh the page.");
        return;
    }

    setIsClaiming(true);
    try {
        const REWARD_XP = 15; 
        const currentXp = userProfile.xp || 0;
        const newXp = currentXp + REWARD_XP;

        console.log("Claiming Reward...", { id: userProfile.$id, oldXp: currentXp, newXp });

        // 4. Direct Database Update (Bypasses potential Context issues)
        await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_USER_PROFILES_COLLECTION_ID,
            userProfile.$id,
            { xp: newXp }
        );

        // 5. Refresh the UI by reloading profile data
        if (checkUserStatus) {
            await checkUserStatus();
        }

        toast.success(`Reward Claimed! +${REWARD_XP} XP`);
        setRewardClaimed(true);

    } catch (error: any) {
        console.error("XP Claim Error Details:", error);
        toast.error(`Failed to claim: ${error.message || "Unknown Error"}`);
    } finally {
        setIsClaiming(false);
    }
  };

  const combinedFeed = useMemo(() => {
    const taggedProducts = products.map(p => ({ ...p, feedType: 'product' }));
    const taggedServices = services.map(s => ({ ...s, feedType: 'service' }));

    const allItems = [...taggedProducts, ...taggedServices];

    return allItems.sort((a: any, b: any) => 
      new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
    );
  }, [products, services]);

  const isLoading = productsLoading || servicesLoading;
  const error = productsError || servicesError;

  const totalPages = Math.ceil(combinedFeed.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = combinedFeed.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      document.getElementById('discovery-feed-top')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      document.getElementById('discovery-feed-top')?.scrollIntoView({ behavior: 'smooth' });
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
            <Skeleton key={i} className="h-72 w-full rounded-lg" />
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
          <AlertDescription>Failed to load listings: {error}</AlertDescription>
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
    <div className="space-y-6 p-4" id="discovery-feed-top">
      
      {/* --- Daily Discovery Reward Card --- */}
      {!rewardClaimed && (
        <Card className="bg-gradient-to-r from-secondary-neon/10 to-background border-secondary-neon/30">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary-neon/20 rounded-full animate-pulse">
                        <Gift className="h-6 w-6 text-secondary-neon" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Daily Discovery Bonus</h3>
                        <p className="text-xs text-muted-foreground">Claim XP for exploring the feed today!</p>
                    </div>
                </div>
                <Button 
                    size="sm" 
                    onClick={handleClaimReward} 
                    disabled={isClaiming}
                    className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
                >
                    {isClaiming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim +15 XP"}
                </Button>
            </CardContent>
        </Card>
      )}

      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        <Compass className="h-6 w-6 text-secondary-neon" />
        <h2 className="text-2xl font-bold text-foreground">Discovery Feed</h2>
      </div>

      {/* Feed Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {currentItems.map((item: any) => (
          <div key={item.$id} className="h-full w-full"> 
            {item.feedType === 'product' ? (
              <ProductListingCard
                product={item}
              />
            ) : (
              <ServiceListingCard
                service={item}
                isFoodOrWellnessCategory={['homemade-meals', 'wellness-remedies'].includes(item.category)}
                onOpenBargainDialog={() => {}} 
                onOpenReviewDialog={() => {}}
              />
            )}
          </div>
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