"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, HeartPulse, PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import FoodCustomRequestsList from "@/components/FoodCustomRequestsList"; // Import the new component

// Categories specific to this page
const FOOD_WELLNESS_CATEGORIES = ["homemade-meals", "wellness-products"];

const FoodWellnessPage = () => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth(); // Updated destructuring
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  
  // Fetch all food/wellness related posts for the user's college
  const { serviceListings: allPosts, isLoading, error, refetch } = useServiceListings(FOOD_WELLNESS_CATEGORIES, userProfile?.collegeName); // Updated destructuring and added collegeName

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePostService = async (data: Omit<ServicePost, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "posterId" | "posterName" | "collegeName">) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a service.");
      return;
    }

    try {
      const newServiceData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
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
      refetch(); // Refresh the list
    } catch (e: any) {
      console.error("Error posting service:", e);
      toast.error(e.message || "Failed to post service listing.");
    }
  };

  const handlePlaceOrder = (offeringId: string) => {
    if (!user) {
      toast.error("You must be logged in to place an order.");
      return;
    }
    toast.info(`Placing order for ${offeringId} functionality not yet implemented.`);
    // In a real app, this would open an order form or initiate a transaction
  };

  const homemadeMeals = allPosts.filter(post => post.category === "homemade-meals");
  const wellnessProducts = allPosts.filter(post => post.category === "wellness-products");

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Food & Wellness</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Utensils className="h-5 w-5 text-secondary-neon" /> Campus Kitchen & Wellness
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Discover homemade meals, healthy snacks, and wellness products offered by your college peers.
            </p>
            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Your Offering
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Food/Wellness Offering</DialogTitle>
                </DialogHeader>
                <PostServiceForm 
                  onSubmit={handlePostService} 
                  onCancel={() => setIsPostServiceDialogOpen(false)} 
                  categories={FOOD_WELLNESS_CATEGORIES}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <FoodCustomRequestsList /> {/* Integrated the new component */}

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Homemade Meals</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading meals...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading meals: {error}</p>
            ) : homemadeMeals.length > 0 ? (
              homemadeMeals.map((offering) => (
                <div key={offering.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{offering.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{offering.description}</p>
                  <p className="text-xs text-muted-foreground">Price: ${offering.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Provider: {offering.posterName}</p>
                  <Button
                    className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handlePlaceOrder(offering.$id)}
                    disabled={offering.posterId === user?.$id}
                  >
                    Place Order
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No homemade meals posted yet for your college.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Wellness Products</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading products...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading products: {error}</p>
            ) : wellnessProducts.length > 0 ? (
              wellnessProducts.map((offering) => (
                <div key={offering.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{offering.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{offering.description}</p>
                  <p className="text-xs text-muted-foreground">Price: ${offering.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Provider: {offering.posterName}</p>
                  <Button
                    className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handlePlaceOrder(offering.$id)}
                    disabled={offering.posterId === user?.$id}
                  >
                    Place Order
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No wellness products posted yet for your college.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default FoodWellnessPage;