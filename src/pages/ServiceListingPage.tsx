"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, ArrowLeft, Briefcase, Loader2, MessageSquareText, DollarSign, Star } from "lucide-react";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import PostServiceForm from "@/components/forms/PostServiceForm";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import BargainServiceDialog from "@/components/forms/BargainServiceDialog";
import SubmitServiceReviewForm from "@/components/forms/SubmitServiceReviewForm";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ServiceListingCard from "@/components/ServiceListingCard"; // NEW IMPORT

// Helper function to format category slug into readable title
const formatCategoryTitle = (categorySlug: string | undefined) => {
  if (!categorySlug || categorySlug === "all") return "All Service Listings";
  return categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const ServiceListingPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [isBargainServiceDialogOpen, setIsBargainServiceDialogOpen] = useState(false);
  const [selectedServiceForBargain, setSelectedServiceForBargain] = useState<ServicePost | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedServiceForReview, setSelectedServiceForReview] = useState<ServicePost | null>(null);
  
  const { services: listings, isLoading, error, refetch } = useServiceListings(category === "all" ? undefined : category);

  const formattedCategory = formatCategoryTitle(category);
  const isFoodOrWellnessCategory = category === "homemade-meals" || category === "wellness-remedies";

  const handlePostService = async (data: {
    title: string;
    description: string;
    category: string;
    price: string;
    contact: string;
    customOrderDescription?: string;
    ambassadorDelivery: boolean;
    ambassadorMessage: string;
  }) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a service.");
      return;
    }

    try {
      const newServiceData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        category: category === "all" ? data.category : category,
        collegeName: userProfile.collegeName,
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newServiceData
      );
      
      toast.success(`Your service "${data.title}" has been posted!`);
      setIsPostServiceDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting service:", e);
      toast.error(e.message || "Failed to post service listing.");
    }
  };

  const handleOpenBargainDialog = (service: ServicePost) => {
    if (!user || !userProfile) {
      toast.error("Please log in to bargain for a service.");
      navigate("/auth");
      return;
    }
    if (user.$id === service.posterId) {
      toast.error("You cannot bargain on your own service.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }
    setSelectedServiceForBargain(service);
    setIsBargainServiceDialogOpen(true);
  };

  const handleBargainInitiated = () => {
    setIsBargainServiceDialogOpen(false);
    // Further actions (e.g., navigate to tracking) are handled within BargainServiceDialog
  };

  const handleOpenReviewDialog = (service: ServicePost) => {
    if (!user || !userProfile) {
      toast.error("Please log in to leave a review.");
      navigate("/auth");
      return;
    }
    setSelectedServiceForReview(service);
    setIsReviewDialogOpen(true);
  };

  const handleReviewSubmitted = () => {
    setIsReviewDialogOpen(false);
    // Optionally refetch listings to update average ratings if they were displayed on the card
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-secondary-neon">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Freelance
        </Button>
        
        <h1 className="text-4xl font-bold text-center text-foreground">{formattedCategory}</h1>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-secondary-neon" /> Available Services
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Browse services offered by peers in the {formattedCategory} category for your college.
            </p>
            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Your Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New {formattedCategory} Service</DialogTitle>
                </DialogHeader>
                <PostServiceForm 
                  onSubmit={handlePostService} 
                  onCancel={() => setIsPostServiceDialogOpen(false)} 
                  initialCategory={category === "all" ? "" : category}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Current Listings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading services...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading listings: {error}</p>
            ) : listings.length > 0 ? (
              listings.map((service) => (
                <ServiceListingCard
                  key={service.$id}
                  service={service}
                  onOpenBargainDialog={handleOpenBargainDialog}
                  onOpenReviewDialog={handleOpenReviewDialog}
                  isFoodOrWellnessCategory={isFoodOrWellnessCategory}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No services posted in this category yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      {/* Bargain Service Dialog */}
      <Dialog open={isBargainServiceDialogOpen} onOpenChange={setIsBargainServiceDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Bargain for {selectedServiceForBargain?.title}</DialogTitle>
          </DialogHeader>
          {selectedServiceForBargain && (
            <BargainServiceDialog
              service={selectedServiceForBargain}
              onBargainInitiated={handleBargainInitiated}
              onCancel={() => setIsBargainServiceDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* NEW: Review Service Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Leave a Review for {selectedServiceForReview?.title}</DialogTitle>
          </DialogHeader>
          {selectedServiceForReview && (
            <SubmitServiceReviewForm
              serviceId={selectedServiceForReview.$id}
              serviceTitle={selectedServiceForReview.title}
              onReviewSubmitted={handleReviewSubmitted}
              onCancel={() => setIsReviewDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceListingPage;