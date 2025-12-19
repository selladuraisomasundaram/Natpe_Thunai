"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Utensils, HeartPulse } from "lucide-react";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface FoodCustomRequestsListProps {
  // No props needed if fetching internally
}

const FoodCustomRequestsList: React.FC<FoodCustomRequestsListProps> = () => {
  const { user, userProfile } = useAuth();
  const { serviceListings: allPosts, isLoading, error, refetch } = useServiceListings(['custom-food-request'], userProfile?.collegeName);

  const handleAcceptRequest = (postId: string) => {
    if (!user) {
      toast.error("You must be logged in to accept a request.");
      return;
    }
    toast.info(`Accepting request ${postId} functionality not yet implemented.`);
    // In a real app, this would update the post status and potentially create a transaction
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <Utensils className="h-5 w-5 text-secondary-neon" /> Custom Food Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
            <p className="ml-3 text-muted-foreground">Loading custom requests...</p>
          </div>
        ) : error ? (
          <p className="text-center text-destructive py-4">Error loading requests: {error}</p>
        ) : allPosts.length > 0 ? (
          allPosts.map((post) => (
            <div key={post.$id} className="p-3 border border-border rounded-md bg-background">
              <h3 className="font-semibold text-foreground">{post.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{post.description}</p>
              {post.isCustomOrder && post.customOrderDescription && ( // Corrected property access
                <p className="text-xs text-muted-foreground mt-1">Details: <span className="font-medium text-foreground">{post.customOrderDescription}</span></p> // Corrected property access
              )}
              <p className="text-xs text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{post.category}</span></p>
              <p className="text-xs text-muted-foreground">{post.isCustomOrder ? "Budget" : "Price"}: <span className="font-medium text-foreground">{post.price}</span></p> {/* Corrected property access */}
              <p className="text-xs text-muted-foreground">Posted by: {post.posterName}</p>
              <Button
                className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => handleAcceptRequest(post.$id)}
                disabled={post.posterId === user?.$id}
              >
                Accept Request
              </Button>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-4">No custom food requests posted yet for your college.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default FoodCustomRequestsList;