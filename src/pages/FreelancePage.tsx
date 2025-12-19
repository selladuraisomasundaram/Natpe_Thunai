"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Code, Paintbrush, PlusCircle, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings"; // Import useServiceListings
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import BargainServiceDialog from "@/components/forms/BargainServiceDialog"; // Import BargainServiceDialog

// Categories specific to this page
const FREELANCE_CATEGORIES = ["tutoring", "freelance-design", "coding-help", "other-freelance"];

const FreelancePage = () => {
  const { user, userProfile } = useAuth();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [isBargainServiceDialogOpen, setIsBargainServiceDialogOpen] = useState(false);
  const [selectedServiceForBargain, setSelectedServiceForBargain] = useState<ServicePost | null>(null);
  
  // Fetch all service listings (no category filter)
  const { serviceListings: listings, isLoading, error, refetch } = useServiceListings(FREELANCE_CATEGORIES, userProfile?.collegeName); // Updated destructuring and added collegeName

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
      
      toast.success(`Your freelance service "${data.title}" has been posted!`);
      setIsPostServiceDialogOpen(false);
      refetch(); // Refresh the list
    } catch (e: any) {
      console.error("Error posting service:", e);
      toast.error(e.message || "Failed to post service listing.");
    }
  };

  const handleInitiateBargain = (service: ServicePost) => {
    setSelectedServiceForBargain(service);
    setIsBargainServiceDialogOpen(true);
  };

  const handleBargainInitiated = () => {
    setIsBargainServiceDialogOpen(false);
    setSelectedServiceForBargain(null);
    toast.success("Bargain offer submitted!");
    // Optionally refetch listings or update UI
  };

  const tutoringServices = listings.filter(service => service.category === "tutoring");
  const designServices = listings.filter(service => service.category === "freelance-design");
  const codingServices = listings.filter(service => service.category === "coding-help");
  const otherFreelance = listings.filter(service => service.category === "other-freelance");

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Freelance Services</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-secondary-neon" /> Campus Freelancers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Offer your skills or find talented peers for tutoring, design, coding, and more!
            </p>
            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Your Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Freelance Service</DialogTitle>
                </DialogHeader>
                <PostServiceForm 
                  onSubmit={handlePostService} 
                  onCancel={() => setIsPostServiceDialogOpen(false)} 
                  categories={FREELANCE_CATEGORIES}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Tutoring</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading tutoring services...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading services: {error}</p>
            ) : tutoringServices.length > 0 ? (
              tutoringServices.map((service) => (
                <div key={service.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{service.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  <p className="text-xs text-muted-foreground">Price: ${service.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Provider: {service.posterName}</p>
                  <Button
                    className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleInitiateBargain(service)}
                    disabled={service.posterId === user?.$id}
                  >
                    <DollarSign className="mr-2 h-4 w-4" /> Make an Offer
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No tutoring services posted yet for your college.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Freelance Design</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading design services...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading services: {error}</p>
            ) : designServices.length > 0 ? (
              designServices.map((service) => (
                <div key={service.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{service.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  <p className="text-xs text-muted-foreground">Price: ${service.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Provider: {service.posterName}</p>
                  <Button
                    className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleInitiateBargain(service)}
                    disabled={service.posterId === user?.$id}
                  >
                    <DollarSign className="mr-2 h-4 w-4" /> Make an Offer
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No freelance design services posted yet for your college.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Coding Help</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading coding help services...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading services: {error}</p>
            ) : codingServices.length > 0 ? (
              codingServices.map((service) => (
                <div key={service.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{service.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  <p className="text-xs text-muted-foreground">Price: ${service.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Provider: {service.posterName}</p>
                  <Button
                    className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleInitiateBargain(service)}
                    disabled={service.posterId === user?.$id}
                  >
                    <DollarSign className="mr-2 h-4 w-4" /> Make an Offer
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No coding help services posted yet for your college.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Other Freelance</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading other freelance services...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading services: {error}</p>
            ) : otherFreelance.length > 0 ? (
              otherFreelance.map((service) => (
                <div key={service.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{service.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  <p className="text-xs text-muted-foreground">Price: ${service.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Provider: {service.posterName}</p>
                  <Button
                    className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleInitiateBargain(service)}
                    disabled={service.posterId === user?.$id}
                  >
                    <DollarSign className="mr-2 h-4 w-4" /> Make an Offer
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No other freelance services posted yet for your college.</p>
            )}
          </CardContent>
        </Card>

        {selectedServiceForBargain && (
          <Dialog open={isBargainServiceDialogOpen} onOpenChange={setIsBargainServiceDialogOpen}>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Make an Offer for: {selectedServiceForBargain.title}</DialogTitle>
              </DialogHeader>
              <BargainServiceDialog
                service={selectedServiceForBargain}
                onBargainSubmitted={handleBargainInitiated}
                onCancel={() => setIsBargainServiceDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default FreelancePage;