"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, ArrowLeft, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import PostServiceForm from "@/components/forms/PostServiceForm";

interface ServicePost {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  contact: string;
  datePosted: string;
}

// Dummy data storage (simulating fetching data filtered by category)
const allDummyServices: ServicePost[] = [
  { id: "fs1", title: "Professional Resume & Cover Letter Writing", description: "Crafting professional resumes and cover letters to help you land your dream job.", category: "resume-building", price: "₹300-₹800", contact: "writer@example.com", datePosted: "2024-07-20" },
  { id: "fs2", title: "Basic Video Editing for Projects", description: "Editing short videos for projects, social media, or personal use.", category: "video-editing", price: "₹200/min", contact: "editor@example.com", datePosted: "2024-07-18" },
  { id: "fs3", title: "Academic Content Writing", description: "Help with essays, reports, and academic papers.", category: "content-writing", price: "₹1/word", contact: "academic@example.com", datePosted: "2024-07-22" },
  { id: "fs4", title: "Logo and Branding Design", description: "Creating modern and impactful logos and brand identities.", category: "graphic-design", price: "₹1500/project", contact: "designer@example.com", datePosted: "2024-07-21" },
];

const ServiceListingPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [listings, setListings] = useState<ServicePost[]>([]);

  const formattedCategory = category
    ? category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : "Service Listings";

  useEffect(() => {
    if (category) {
      const filtered = allDummyServices.filter(service => service.category === category);
      setListings(filtered);
    }
  }, [category]);

  const handlePostService = (data: Omit<ServicePost, "id" | "datePosted">) => {
    const newService: ServicePost = {
      ...data,
      id: `fs${allDummyServices.length + 1}`,
      datePosted: new Date().toISOString().split('T')[0],
    };
    allDummyServices.unshift(newService); // Update global dummy data
    setListings((prev) => [newService, ...prev]); // Update local state
    toast.success(`Your service "${newService.title}" has been posted!`);
    setIsPostServiceDialogOpen(false);
  };

  const handleContactSeller = (contact: string, title: string) => {
    toast.info(`Contacting provider for "${title}" at ${contact}.`);
    // In a real app, this would open a chat or email client.
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
              Browse services offered by peers in the {formattedCategory} category.
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
                  initialCategory={category}
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
            {listings.length > 0 ? (
              listings.map((service) => (
                <div key={service.id} className="p-3 border border-border rounded-md bg-background flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <h3 className="font-semibold text-foreground">{service.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Price: <span className="font-medium text-secondary-neon">{service.price}</span></p>
                    <p className="text-xs text-muted-foreground">Posted: {service.datePosted}</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="mt-2 sm:mt-0 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleContactSeller(service.contact, service.title)}
                  >
                    Contact Provider
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No services posted in this category yet. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ServiceListingPage;