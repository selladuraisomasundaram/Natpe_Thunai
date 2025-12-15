"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, NotebookPen, Bike, PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostErrandForm from "@/components/forms/PostErrandForm";
import { useErrandListings, ErrandPost } from "@/hooks/useErrandListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";

// Errand types specific to this page
const ERRAND_TYPES = ["note-writing", "small-job", "delivery"];

const STANDARD_ERRAND_OPTIONS = [
  { value: "note-writing", label: "Note-writing/Transcription" },
  { value: "small-job", label: "Small Job (e.g., moving books)" },
  { value: "delivery", label: "Delivery Services (within campus)" },
  { value: "other", label: "Other" },
];

const ShortTermNeedsPage = () => { // Renamed from ErrandsPage to ShortTermNeedsPage based on context
  const { user, userProfile } = useAuth();
  const [isPostErrandDialogOpen, setIsPostErrandDialogOpen] = useState(false);
  const [initialCategoryForForm, setInitialCategoryForForm] = useState<string | undefined>(undefined);
  
  // Fetch only standard errands for the user's college
  const { errands: postedErrands, isLoading, error } = useErrandListings(ERRAND_TYPES);

  // Content is age-gated if user is 25 or older
  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  const handleErrandClick = (categoryValue: string) => {
    setInitialCategoryForForm(categoryValue);
    setIsPostErrandDialogOpen(true);
  };

  const handlePostErrand = async (data: Omit<ErrandPost, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "posterId" | "posterName" | "collegeName">) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post an errand.");
      return;
    }

    try {
      const newErrandData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName, // Ensure collegeName is explicitly added
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ERRANDS_COLLECTION_ID,
        ID.unique(),
        newErrandData
      );
      
      toast.success(`Your errand "${data.title}" has been posted!`);
      setIsPostErrandDialogOpen(false);
      setInitialCategoryForForm(undefined); // Reset initial category
    } catch (e: any) {
      console.error("Error posting errand:", e);
      toast.error(e.message || "Failed to post errand listing.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Short-Term Needs</h1> {/* Changed title */}
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-secondary-neon" /> Campus Errands
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Need a helping hand with small tasks? Post your errand here for your college peers!
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleErrandClick("note-writing")}
            >
              <NotebookPen className="mr-2 h-4 w-4" /> Note-writing/Transcription
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleErrandClick("small-job")}
            >
              <Bike className="mr-2 h-4 w-4" /> Small Jobs (e.g., moving books)
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleErrandClick("delivery")}
            >
              <Bike className="mr-2 h-4 w-4" /> Delivery Services (within campus)
            </Button>
            <Dialog open={isPostErrandDialogOpen} onOpenChange={setIsPostErrandDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" disabled={isAgeGated} onClick={() => handleErrandClick(undefined)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Your Errand
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Campus Errand</DialogTitle>
                </DialogHeader>
                <PostErrandForm 
                  onSubmit={handlePostErrand} 
                  onCancel={() => {
                    setIsPostErrandDialogOpen(false);
                    setInitialCategoryForForm(undefined); // Reset initial category on cancel
                  }} 
                  categoryOptions={STANDARD_ERRAND_OPTIONS}
                  initialCategory={initialCategoryForForm}
                />
              </DialogContent>
            </Dialog>
            <p className="text-xs text-destructive-foreground mt-4">
              Note: This section is age-gated for users under 25.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recently Posted Errands</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading errands...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading errands: {error}</p>
            ) : postedErrands.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {postedErrands.map((request) => ( // Changed errand to request for consistency with error message
                  <div key={request.$id} className="p-3 border border-border rounded-md bg-background">
                    <h3 className="font-semibold text-foreground">{request.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{STANDARD_ERRAND_OPTIONS.find(opt => opt.value === request.category)?.label || request.category}</span></p>
                    {request.category === 'other' && request.otherCategoryDescription && (
                      <p className="text-xs text-muted-foreground">Other: <span className="font-medium text-foreground">{request.otherCategoryDescription}</span></p>
                    )}
                    <p className="text-xs text-muted-foreground">Compensation: <span className="font-medium text-foreground">{request.compensation}</span></p>
                    {request.deadline && <p className="text-xs text-muted-foreground">Deadline: <span className="font-medium text-foreground">{request.deadline}</span></p>}
                    <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{request.contact}</span></p>
                    <p className="text-xs text-muted-foreground">Posted: {new Date(request.$createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No errands posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ShortTermNeedsPage;