"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Soup, HeartPulse, ShieldCheck, PlusCircle, Utensils, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";

// Service categories specific to this page
const OFFERING_CATEGORIES = ["homemade-meals", "wellness-remedies"];

const FoodWellnessPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [isPostCustomOrderDialogOpen, setIsPostCustomOrderDialogOpen] = useState(false);
  
  // Fetch all food/wellness related posts
  const { services: allPosts, isLoading, error } = useServiceListings(undefined); 

  const postedOfferings = allPosts.filter(p => !p.isCustomOrder && OFFERING_CATEGORIES.includes(p.category));
  const postedCustomRequests = allPosts.filter(p => p.isCustomOrder);

  const handleServiceClick = (serviceName: string) => {
    toast.info(`You selected "${serviceName}". Post your offering using the button below.`);
  };

  const handlePostService = async (data: Omit<ServicePost, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "posterId" | "posterName">) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post.");
      return;
    }

    try {
      const newPostData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        isCustomOrder: false,
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newPostData
      );
      
      toast.success(`Your offering "${data.title}" has been posted!`);
      setIsPostServiceDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting service:", e);
      toast.error(e.message || "Failed to post offering.");
    }
  };

  const handlePostCustomOrder = async (data: Omit<ServicePost, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "posterId" | "posterName">) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a custom request.");
      return;
    }

    try {
      const newRequest: Omit<ServicePost, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId"> = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        isCustomOrder: true,
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newRequest
      );
      
      toast.success(`Your custom order request "${data.title}" has been posted!`);
      setIsPostCustomOrderDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting custom request:", e);
      toast.error(e.message || "Failed to post custom request.");
    }
  };

  const renderListings = (list: ServicePost[], title: string) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
          <p className="ml-3 text-muted-foreground">Loading {title.toLowerCase()}...</p>
        </div>
      );
    }
    if (error) {
      return <p className="text-center text-destructive py-4">Error loading {title.toLowerCase()}: {error}</p>;
    }
    if (list.length === 0) {
      return <p className="text-center text-muted-foreground py-4">No {title.toLowerCase()} posted yet. Be the first!</p>;
    }

    return list.map((post) => (
      <div key={post.$id} className="p-3 border border-border rounded-md bg-background">
        <h3 className="font-semibold text-foreground">{post.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{post.description}</p>
        {post.isCustomOrder && post.customOrderDescription && (
          <p className="text-xs text-muted-foreground mt-1">Details: <span className="font-medium text-foreground">{post.customOrderDescription}</span></p>
        )}
        <p className="text-xs text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{post.category}</span></p>
        <p className="text-xs text-muted-foreground">{post.isCustomOrder ? "Budget" : "Price"}: <span className="font-medium text-foreground">{post.price}</span></p>
        <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{post.contact}</span></p>
        <p className="text-xs text-muted-foreground">Posted by: {post.posterName}</p>
        <p className="text-xs text-muted-foreground">Posted: {new Date(post.$createdAt).toLocaleDateString()}</p>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Food & Wellness</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Soup className="h-5 w-5 text-secondary-neon" /> Healthy Options
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Discover homemade food and wellness remedies from trusted campus peers.
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleServiceClick("Homemade Meals")}
            >
              <Soup className="mr-2 h-4 w-4" /> Homemade Meals
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleServiceClick("Wellness Remedies")}
            >
              <HeartPulse className="mr-2 h-4 w-4" /> Wellness Remedies
            </Button>
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
                <PostServiceForm onSubmit={handlePostService} onCancel={() => setIsPostServiceDialogOpen(false)} />
              </DialogContent>
            </Dialog>

            <Dialog open={isPostCustomOrderDialogOpen} onOpenChange={setIsPostCustomOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2">
                  <Utensils className="mr-2 h-4 w-4" /> Request Custom Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Request Custom Food/Remedy</DialogTitle>
                </DialogHeader>
                <PostServiceForm onSubmit={handlePostCustomOrder} onCancel={() => setIsPostCustomOrderDialogOpen(false)} isCustomOrder={true} />
              </DialogContent>
            </Dialog>

            <p className="text-xs text-destructive-foreground mt-4 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Quality assurance and cancellation warnings apply.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recently Posted Offerings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {renderListings(postedOfferings, "Offerings")}
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Utensils className="h-5 w-5 text-secondary-neon" /> Custom Order Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {renderListings(postedCustomRequests, "Custom Order Requests")}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default FoodWellnessPage;