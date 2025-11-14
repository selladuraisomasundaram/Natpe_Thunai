"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Edit, Video, PenTool, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm"; // Import the new form
import { Link } from "react-router-dom"; // Import Link

interface ServicePost {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  contact: string;
  datePosted: string;
}

// Define service categories and their icons
const serviceCategories = [
  { name: "Resume Building", icon: Edit, path: "/services/freelance/resume-building" },
  { name: "Video Editing", icon: Video, path: "/services/freelance/video-editing" },
  { name: "Content Writing", icon: PenTool, path: "/services/freelance/content-writing" },
  { name: "Graphic Design", icon: PenTool, path: "/services/freelance/graphic-design" },
];

const FreelancePage = () => {
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);

  // We no longer need local state for postedServices as they are handled by the new ServiceListingPage
  const handlePostService = (data: Omit<ServicePost, "id" | "datePosted">) => {
    // This function is now primarily for posting a service without navigating immediately, 
    // but we should encourage users to post via the specific category page.
    toast.info(`Service "${data.title}" posted! Check the relevant category page.`);
    setIsPostServiceDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Freelance Section</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-secondary-neon" /> Choose a Service Category
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Find and offer various freelance services within the campus community.
            </p>
            
            {serviceCategories.map((item) => (
              <Button
                key={item.name}
                asChild
                className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link to={item.path}>
                  <item.icon className="mr-2 h-4 w-4" /> {item.name}
                </Link>
              </Button>
            ))}

            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Your Service (General)
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Freelance Service</DialogTitle>
                </DialogHeader>
                <PostServiceForm onSubmit={handlePostService} onCancel={() => setIsPostServiceDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        
        {/* Removed the "Recently Posted Services" card as it's now handled dynamically */}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default FreelancePage;