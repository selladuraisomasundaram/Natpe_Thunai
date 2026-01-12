"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ShoppingBag, NotebookPen, Bike, PlusCircle, Loader2, X, 
  MapPin, Clock, Wallet, Phone, Lock, Handshake, CheckCircle, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import PostErrandForm from "@/components/forms/PostErrandForm";
import { useErrandListings } from "@/hooks/useErrandListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import * as z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// --- CONFIGURATION ---
const ERRAND_TYPES = ["note-writing", "small-job", "delivery"];

const STANDARD_ERRAND_OPTIONS = [
  { value: "note-writing", label: "Note-writing/Transcription" },
  { value: "small-job", label: "Small Job (e.g., moving books)" },
  { value: "delivery", label: "Delivery Services (within campus)" },
  { value: "other", label: "Other" },
];

const ErrandFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  type: z.string().min(1, { message: "Please select an errand type." }),
  otherTypeDescription: z.string().optional(),
  compensation: z.string().min(2, { message: "Compensation details are required." }),
  deadline: z.date().optional(),
  contact: z.string().min(5, { message: "Contact information is required." }),
});

// --- SUB-COMPONENT: Errand Card ---
const ErrandCard = ({ errand, currentUser }: { errand: any, currentUser: any }) => {
  const [isAccepted, setIsAccepted] = useState(false); // Local state to reveal contact
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isOwner = currentUser?.$id === errand.posterId;

  // Helper to parse compensation for logic (if needed), otherwise string
  const compensationDisplay = errand.compensation;

  const handleAcceptErrand = async () => {
    if (!currentUser) {
      toast.error("Please log in to accept errands.");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create a Transaction Record (This "Locks" the deal)
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: errand.$id, // Link to errand
          productTitle: `Errand: ${errand.title}`,
          amount: 0, // Errands might be non-monetary or cash-on-completion. We track 0 for now.
          buyerId: currentUser.$id, // The Runner
          buyerName: currentUser.name,
          sellerId: errand.posterId, // The Poster
          sellerName: errand.posterName,
          collegeName: errand.collegeName,
          status: "initiated", // Status in Tracking Page
          type: "service", // Treat as a service transaction
          ambassadorDelivery: false, 
          // Store the actual compensation text in the message for reference
          ambassadorMessage: `Compensation agreed: ${errand.compensation}` 
        }
      );

      // 2. Reveal Contact Info locally
      setIsAccepted(true);
      setIsConfirmOpen(false);
      toast.success("Errand accepted! Check your Tracking page.");
    } catch (error: any) {
      console.error("Error accepting errand:", error);
      toast.error("Failed to accept errand.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="group relative overflow-hidden border border-border/60 hover:border-secondary-neon/50 transition-all duration-300 hover:shadow-lg bg-card">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-secondary-neon/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${errand.posterName}`} />
              <AvatarFallback>{errand.posterName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-bold text-foreground leading-tight">{errand.title}</CardTitle>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <span>{errand.posterName}</span>
                <span>•</span>
                <span>{new Date(errand.$createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="capitalize bg-secondary/10 text-secondary-neon border-secondary-neon/20">
            {errand.type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3 bg-muted/30 p-3 rounded-md italic">
          "{errand.description}"
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-foreground/80">
            <Wallet className="h-4 w-4 text-green-500" />
            <span className="font-semibold">{compensationDisplay}</span>
          </div>
          {errand.deadline && (
            <div className="flex items-center gap-2 text-foreground/80">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>{new Date(errand.deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {isOwner ? (
          <Button variant="outline" className="w-full cursor-default opacity-80" disabled>
            <CheckCircle className="mr-2 h-4 w-4" /> Posted by You
          </Button>
        ) : isAccepted ? (
          <div className="w-full space-y-2 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-md flex flex-col items-center justify-center text-center">
              <p className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1">Contact Revealed!</p>
              <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Phone className="h-4 w-4" /> {errand.contact}
              </div>
            </div>
            <Button variant="ghost" className="w-full text-xs text-muted-foreground" disabled>
              Check "Activity" tab for status
            </Button>
          </div>
        ) : (
          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-semibold shadow-sm">
                <Handshake className="mr-2 h-4 w-4" /> Accept & Reveal Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-secondary-neon" /> Reveal Contact Info?
                </DialogTitle>
                <DialogDescription className="pt-2">
                  To view the contact details for this errand, you must <b>commit to helping</b>. 
                  <br/><br/>
                  This will create a tracking record in your <b>Activity</b> tab. You can settle the payment ({compensationDisplay}) directly with {errand.posterName} after completing the task.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 mt-2">
                <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                <Button onClick={handleAcceptErrand} disabled={isProcessing} className="bg-secondary-neon text-primary-foreground">
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Accept"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
};

// --- MAIN PAGE COMPONENT ---
const ErrandsPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostErrandDialogOpen, setIsPostErrandDialogOpen] = useState(false);
  const [preselectedErrandType, setPreselectedErrandType] = useState<string | undefined>(undefined);
  const [showErrandFormInfoAlert, setShowErrandFormInfoAlert] = useState(true);
  
  // Fetch errands
  const { errands: postedErrands, isLoading, error } = useErrandListings(ERRAND_TYPES);

  // Content is age-gated if user is 25 or older
  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleErrandClick = (errandType: string) => {
    setPreselectedErrandType(errandType);
    setIsPostErrandDialogOpen(true);
    setShowErrandFormInfoAlert(true);
  };

  const handlePostErrand = async (data: z.infer<typeof ErrandFormSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post an errand.");
      return;
    }

    try {
      const newErrandData = {
        ...data,
        type: data.type === 'other' && data.otherTypeDescription 
              ? data.otherTypeDescription 
              : data.type,
        deadline: data.deadline ? data.deadline.toISOString() : null,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ERRANDS_COLLECTION_ID,
        ID.unique(),
        newErrandData
      );
      
      toast.success(`Your errand "${data.title}" has been posted!`);
      setIsPostErrandDialogOpen(false);
      setPreselectedErrandType(undefined);
    } catch (e: any) {
      console.error("Error posting errand:", e);
      toast.error(e.message || "Failed to post errand listing.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Errands</h1>
      
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* POSTING SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-3 bg-gradient-to-r from-card to-secondary/10 border-border shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <ShoppingBag className="h-6 w-6 text-secondary-neon" /> Campus Errands
                    </CardTitle>
                    <p className="text-muted-foreground">Need a hand or want to earn extra cash? Connect with peers for quick tasks.</p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-secondary/10 hover:border-secondary-neon" onClick={() => handleErrandClick("note-writing")}>
                        <NotebookPen className="h-6 w-6 text-primary" />
                        <span className="text-xs font-semibold">Notes/Writing</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-secondary/10 hover:border-secondary-neon" onClick={() => handleErrandClick("small-job")}>
                        <ShoppingBag className="h-6 w-6 text-primary" />
                        <span className="text-xs font-semibold">Small Jobs</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-secondary/10 hover:border-secondary-neon" onClick={() => handleErrandClick("delivery")}>
                        <Bike className="h-6 w-6 text-primary" />
                        <span className="text-xs font-semibold">Campus Delivery</span>
                    </Button>
                    
                    <Dialog open={isPostErrandDialogOpen} onOpenChange={setIsPostErrandDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-auto py-4 flex flex-col gap-2 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isAgeGated}>
                                <PlusCircle className="h-6 w-6" />
                                <span className="text-xs font-semibold">Post New Errand</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                            <DialogHeader>
                                <DialogTitle>Post New Campus Errand</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                                {showErrandFormInfoAlert && (
                                    <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-600 mb-4">
                                    <AlertDescription className="flex justify-between items-center text-xs">
                                        <span>Fill out details clearly. Compensation is agreed upon completion.</span>
                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowErrandFormInfoAlert(false)}><X className="h-3 w-3" /></Button>
                                    </AlertDescription>
                                    </Alert>
                                )}
                                <PostErrandForm 
                                    onSubmit={handlePostErrand} 
                                    onCancel={() => { setIsPostErrandDialogOpen(false); setPreselectedErrandType(undefined); }} 
                                    typeOptions={STANDARD_ERRAND_OPTIONS}
                                    initialType={preselectedErrandType}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardContent>
                {isAgeGated && (
                    <CardFooter>
                        <p className="text-xs text-destructive flex items-center gap-1">
                            <X className="h-3 w-3" /> Posting disabled for users 25+
                        </p>
                    </CardFooter>
                )}
            </Card>
        </div>

        {/* LISTINGS SECTION */}
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="bg-secondary-neon w-1 h-6 rounded-full"></span>
                Available Gigs
            </h2>
            
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="h-48 animate-pulse bg-muted/20 border-border" />
                    ))}
                </div>
            ) : error ? (
                <div className="text-center py-10 bg-destructive/10 rounded-lg border border-destructive/20 text-destructive">
                    <p>Error loading errands: {error}</p>
                </div>
            ) : postedErrands.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {postedErrands.map((errand) => (
                        <ErrandCard key={errand.$id} errand={errand} currentUser={user} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
                    <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No errands yet</h3>
                    <p className="text-muted-foreground mt-1">Be the first to ask for help!</p>
                </div>
            )}
        </div>

      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ErrandsPage;