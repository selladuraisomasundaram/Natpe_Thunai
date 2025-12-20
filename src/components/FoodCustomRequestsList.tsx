"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquareText, Trash2 } from "lucide-react"; // NEW: Import Trash2
import { toast } from "sonner";
import { ServicePost } from "@/hooks/useServiceListings";
import { useAuth } from "@/context/AuthContext"; // NEW: Import useAuth

interface FoodCustomRequestsListProps {
  requests: ServicePost[];
  isLoading: boolean;
  error: string | null;
  onDelete?: (serviceId: string) => Promise<void>; // NEW: Add onDelete prop
}

const FoodCustomRequestsList: React.FC<FoodCustomRequestsListProps> = ({ requests, isLoading, error, onDelete }) => {
  const { user } = useAuth(); // NEW: Get current user

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
        <p className="ml-3 text-muted-foreground">Loading requests...</p>
      </div>
    );
  }
  if (error) {
    return <p className="text-center text-destructive py-4">Error loading requests: {error}</p>;
  }
  if (requests.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No custom order requests posted yet for your college.</p>;
  }

  return (
    <div className="space-y-4">
      {requests.map((post) => {
        const isCreator = user?.$id === post.posterId; // NEW: Check if current user is the creator
        return (
          <div key={post.$id} className="p-3 border border-border rounded-md bg-background relative"> {/* Added relative */}
            {isCreator && onDelete && ( // NEW: Conditionally render delete button
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10 h-7 w-7 opacity-70 hover:opacity-100"
                onClick={() => onDelete(post.$id)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Request</span>
              </Button>
            )}
            <h3 className="font-semibold text-foreground">{post.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{post.description}</p>
            {post.isCustomOrder && post.customOrderDescription && (
              <p className="text-xs text-muted-foreground mt-1">Details: <span className="font-medium text-foreground">{post.customOrderDescription}</span></p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{post.category}</span></p>
            <p className="text-xs text-muted-foreground">{post.isCustomOrder ? "Budget" : "Price"}: <span className="font-medium text-foreground">{post.price}</span></p>
            <p className="text-xs text-muted-foreground">Posted by: {isCreator ? "You" : post.posterName}</p> {/* NEW: Display "You" if creator */}
            <p className="text-xs text-muted-foreground">Posted: {new Date(post.$createdAt).toLocaleDateString()}</p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2 border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
              onClick={() => toast.info(`Contacting ${post.posterName} at ${post.contact} to fulfill this request.`)}
            >
              <MessageSquareText className="mr-2 h-4 w-4" /> Offer to Fulfill
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default FoodCustomRequestsList;