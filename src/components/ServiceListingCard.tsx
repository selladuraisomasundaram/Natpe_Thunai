"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, HeartPulse, PlusCircle, Star, MessageSquare } from "lucide-react";
import { ServicePost } from "@/hooks/useServiceListings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PlaceFoodOrderForm from "./forms/PlaceFoodOrderForm";
import BargainServiceDialog from "./forms/BargainServiceDialog";
import SubmitServiceReviewForm from "./forms/SubmitServiceReviewForm";
import { useAuth } from "@/context/AuthContext";
import { useServiceReviews } from "@/hooks/useServiceReviews"; // Import the hook
import { Badge } from "@/components/ui/badge";

interface ServiceListingCardProps {
  service: ServicePost;
  onOrderPlaced?: () => void;
}

const ServiceListingCard: React.FC<ServiceListingCardProps> = ({ service, onOrderPlaced }) => {
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isBargainDialogOpen, setIsBargainDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const { user, userProfile } = useAuth();
  const { averageRating, isLoading: isReviewsLoading, error: reviewsError, refetch: refetchReviews } = useServiceReviews(service.$id, userProfile?.collegeName); // Updated destructuring
  const hasReviewed = false; // Simulate: In a real app, check if user has already reviewed this service

  const isMeal = service.category === "homemade-meals";
  const Icon = isMeal ? Utensils : HeartPulse;

  const handleOrderPlaced = () => {
    setIsOrderDialogOpen(false);
    onOrderPlaced?.();
  };

  const handleBargainInitiated = () => {
    setIsBargainDialogOpen(false);
    // Optionally, refresh service listings or show a toast
  };

  const handleReviewSubmitted = () => {
    setIsReviewDialogOpen(false);
    refetchReviews(); // Refresh reviews after submission
  };

  return (
    <Card className="flex flex-col h-full relative hover:shadow-lg transition-shadow bg-background border-border">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">{service.title}</CardTitle>
          <Icon className="h-5 w-5 text-secondary-neon" />
        </div>
        <CardDescription className="text-secondary-neon font-bold text-md">${service.price.toFixed(2)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0 space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-3">{service.description}</p>
        <p className="text-xs text-muted-foreground">Provider: {service.posterName}</p>
        <p className="text-xs text-muted-foreground">Contact: {service.contact}</p>
        {service.isCustomOrder && ( // Corrected property access
          <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
            Custom Request
          </Badge>
        )}
        <div className="flex items-center text-xs text-muted-foreground">
          <Star className="h-4 w-4 text-yellow-400 mr-1" />
          {isReviewsLoading ? (
            <span>Loading reviews...</span>
          ) : reviewsError ? (
            <span className="text-destructive">Error loading reviews</span>
          ) : averageRating !== null ? (
            <span>{averageRating.toFixed(1)} Average Rating</span>
          ) : (
            <span>No reviews yet</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col space-y-2">
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={service.posterId === user?.$id}>
              <PlusCircle className="mr-2 h-4 w-4" /> Place Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Order: {service.title}</DialogTitle>
            </DialogHeader>
            <PlaceFoodOrderForm 
              offering={service}
              onOrderPlaced={handleOrderPlaced}
              onCancel={() => setIsOrderDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isBargainDialogOpen} onOpenChange={setIsBargainDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="w-full" disabled={service.posterId === user?.$id}>
              <DollarSign className="mr-2 h-4 w-4" /> Make an Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Make an Offer for: {service.title}</DialogTitle>
            </DialogHeader>
            <BargainServiceDialog
              service={service}
              onBargainSubmitted={handleBargainInitiated}
              onCancel={() => setIsBargainDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" disabled={service.posterId === user?.$id || hasReviewed}>
              <MessageSquare className="mr-2 h-4 w-4" /> {hasReviewed ? "Reviewed" : "Write a Review"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Review: {service.title}</DialogTitle>
            </DialogHeader>
            <SubmitServiceReviewForm
              serviceId={service.$id}
              onReviewSubmitted={handleReviewSubmitted}
              onCancel={() => setIsReviewDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default ServiceListingCard;