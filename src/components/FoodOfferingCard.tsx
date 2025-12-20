"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, HeartPulse, PlusCircle, Trash2 } from "lucide-react"; // NEW: Import Trash2
import { ServicePost } from "@/hooks/useServiceListings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PlaceFoodOrderForm from "./forms/PlaceFoodOrderForm";
import { useAuth } from "@/context/AuthContext"; // NEW: Import useAuth

interface FoodOfferingCardProps {
  offering: ServicePost;
  onDelete?: (serviceId: string) => void; // NEW: Add onDelete prop
}

const FoodOfferingCard: React.FC<FoodOfferingCardProps> = ({ offering, onDelete }) => {
  const { user } = useAuth(); // NEW: Get current user
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const isMeal = offering.category === "homemade-meals";
  const Icon = isMeal ? Utensils : HeartPulse;
  const isCreator = user?.$id === offering.posterId; // NEW: Check if current user is the creator

  return (
    <Card className="flex flex-col h-full relative hover:shadow-lg transition-shadow bg-background border-border">
      {isCreator && onDelete && ( // NEW: Conditionally render delete button
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 z-10 h-7 w-7 opacity-70 hover:opacity-100"
          onClick={() => onDelete(offering.$id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete Offering</span>
        </Button>
      )}
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">{offering.title}</CardTitle>
          <Icon className="h-5 w-5 text-secondary-neon" />
        </div>
        <CardDescription className="text-secondary-neon font-bold text-md">{offering.price}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0 space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-3">{offering.description}</p>
        <p className="text-xs text-muted-foreground">Provider: {isCreator ? "You" : offering.posterName}</p> {/* NEW: Display "You" if creator */}
        <p className="text-xs text-muted-foreground">Contact: {offering.contact}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Place Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Order: {offering.title}</DialogTitle>
            </DialogHeader>
            <PlaceFoodOrderForm 
              offering={offering}
              onOrderPlaced={() => setIsOrderDialogOpen(false)}
              onCancel={() => setIsOrderDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default FoodOfferingCard;