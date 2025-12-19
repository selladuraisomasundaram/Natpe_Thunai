"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, HeartPulse, PlusCircle } from "lucide-react";
import { ServicePost } from "@/hooks/useServiceListings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"; // Import DialogClose
import PlaceFoodOrderForm from "./forms/PlaceFoodOrderForm";

interface FoodOfferingCardProps {
  offering: ServicePost;
}

const FoodOfferingCard: React.FC<FoodOfferingCardProps> = ({ offering }) => {
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const isMeal = offering.category === "homemade-meals";
  const Icon = isMeal ? Utensils : HeartPulse;

  return (
    <Card className="flex flex-col h-full relative hover:shadow-lg transition-shadow bg-background border-border">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">{offering.title}</CardTitle>
          <Icon className="h-5 w-5 text-secondary-neon" />
        </div>
        <CardDescription className="text-secondary-neon font-bold text-md">{offering.price}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0 space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-3">{offering.description}</p>
        <p className="text-xs text-muted-foreground">Provider: {offering.posterName}</p>
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
            {/* DialogClose is typically included by default in shadcn/ui DialogContent,
                but explicitly adding it here for clarity if needed. */}
            {/* <DialogClose asChild>
              <Button variant="ghost" className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose> */}
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default FoodOfferingCard;