"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ShoppingBag, NotebookPen, Bike, PlusCircle, Loader2, X, 
  Clock, Wallet, Lock, Handshake, CheckCircle, ArrowRight,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import PostErrandForm from "@/components/forms/PostErrandForm";
import { useErrandListings } from "@/hooks/useErrandListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { ID, Query } from 'appwrite';
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
  const navigate = useNavigate();
  const [isAccepted, setIsAccepted] = useState(false); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const isOwner = currentUser?.$id === errand.posterId;

  /**
   * FIX: PERSISTENCE LOGIC
   * Checks if a deal already exists for this user and errand.
   * Prevents the button from resetting to "Reveal" on page refresh.
   */
  useEffect(() => {
    const checkDealStatus = async () => {
      if (!currentUser || isOwner) {
        setIsCheckingStatus(false);
        return;
      }
      try {
        const existing = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          [
            Query.equal('productId', errand.$id),
            Query.equal('buyerId', currentUser.$id)
          ]
        );
        if (existing.documents.length > 0) {
          setIsAccepted(true);
        }
      } catch (e) {
        console.error("Persistence check failed", e);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    checkDealStatus();
  }, [errand.$id, currentUser, isOwner]);

  const handleAcceptErrand = async () => {
    if (!currentUser) {
      toast.error("Please log in to accept errands.");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create the Tracking Record (Transaction)
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: errand.$id,
          productTitle: `Errand: ${errand.title}`,
          amount: 0, // Errands are settled manually or via cash
          buyerId: currentUser.$id, 
          buyerName: currentUser.name,
          sellerId: errand.posterId, 
          sellerName: errand.posterName,
          collegeName: errand.collegeName,
          status: "initiated", 
          type: "errand", 
          ambassadorDelivery: false, 
          ambassadorMessage: `Task description: ${errand.description}` 
        }
      );

      setIsAccepted(true);
      setIsConfirmOpen(false);
      toast.success("Deal locked! Opening your Activity Log...");
      
      // 2. FIXED REDIRECTION: Path must match your App.tsx route
      navigate("/tracking"); 
      
    } catch (error: any) {
      toast.error("Failed to accept this task.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isCheckingStatus) {
    return <Card className="h-48 animate-pulse bg-muted/20 border-border" />;
  }

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
              <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-mono uppercase">
                <span>By {errand.posterName}</span>
                <span>•</span>
                <span>{new Date(errand.$createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="capitalize bg-secondary/10 text-secondary-neon border-secondary-neon/20 text-[10px] font-bold">
            {errand.type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-4">
        <p className="text-xs text-muted-foreground line-clamp-3 bg-muted/30 p-3 rounded-md italic leading-relaxed">
          "{errand.description}"
        </p>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-2 text-foreground/80">
            <Wallet className="h-3 w-3 text-green-500" />
            <span className="font-bold uppercase tracking-tight">{errand.compensation}</span>
          </div>
          {errand.deadline && (
            <div className="flex items-center gap-2 text-foreground/80">
              <Clock className="h-3 w-3 text-amber-500" />
              <span>{new Date(errand.deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {isOwner ? (
          <Button variant="outline" className="w-full cursor-default opacity-60 border-dashed text-xs" disabled>
            <CheckCircle className="mr-2 h-3 w-3" /> Your Listing
          </Button>
        ) : isAccepted ? (
          <Button 
            onClick={() => navigate("/tracking")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-black text-xs gap-2"
          >
            <Activity className="h-3 w-3" /> OPEN ACTIVITY LOG
          </Button>
        ) : (
          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-black tracking-tight shadow-neon active:scale-95 transition-all text-xs">
                ACCEPT GIG <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] bg-card border-secondary-neon/30">
              <DialogHeader>
                <DialogTitle className="font-black italic text-xl">LOCK THIS DEAL?</DialogTitle>
                <DialogDescription className="pt-4 text-foreground/80 text-sm leading-relaxed">
                  Accepting this errand will create a private tracking card. 
                  <br/><br/>
                  You can <b>Chat</b> with {errand.posterName} and use the <b>Universal Escrow Gateway</b> to settle payments safely after the task is done.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Not yet</Button>
                <Button onClick={handleAcceptErrand} disabled={isProcessing} className="bg-secondary-neon text-primary-foreground font-bold px-6">
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "CONFIRM & HUSTLE"}
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
  
  const { errands: postedErrands, isLoading, error } = useErrandListings(ERRAND_TYPES);
  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleErrandClick = (errandType: string) => {
    setPreselectedErrandType(errandType);
    setIsPostErrandDialogOpen(true);
  };

  const handlePostErrand = async (data: z.infer<typeof ErrandFormSchema>) => {
    if (!user || !userProfile) {
      toast.error("Please login.");
      return;
    }

    try {
      const newErrandData = {
        ...data,
        type: data.type === 'other' && data.otherTypeDescription ? data.otherTypeDescription : data.type,
        deadline: data.deadline ? data.deadline.toISOString() : null,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
      };

      await databases.createDocument(APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID, ID.unique(), newErrandData);
      toast.success("Gig posted successfully!");
      setIsPostErrandDialogOpen(false);
    } catch (e: any) {
      toast.error("Failed to post listing.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24 relative overflow-x-hidden">
      
      <div className="max-w-md mx-auto mb-8">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase">
          CAMPUS<span className="text-secondary-neon">GIGS</span>
        </h1>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-60">
          Fast help • Fast cash
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* ACTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-3 border-border/40 shadow-sm bg-muted/10 overflow-hidden">
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <PlusCircle className="h-4 w-4 text-secondary-neon" /> Need a Hand?
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <Button variant="outline" className="h-auto py-5 flex flex-col gap-2 border-border/40 hover:border-secondary-neon/50 bg-background/50" onClick={() => handleErrandClick("note-writing")}>
                        <NotebookPen className="h-5 w-5 text-blue-500" />
                        <span className="text-[9px] font-black uppercase">Writing</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-5 flex flex-col gap-2 border-border/40 hover:border-secondary-neon/50 bg-background/50" onClick={() => handleErrandClick("small-job")}>
                        <ShoppingBag className="h-5 w-5 text-purple-500" />
                        <span className="text-[9px] font-black uppercase">Jobs</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-5 flex flex-col gap-2 border-border/40 hover:border-secondary-neon/50 bg-background/50" onClick={() => handleErrandClick("delivery")}>
                        <Bike className="h-5 w-5 text-orange-500" />
                        <span className="text-[9px] font-black uppercase">Delivery</span>
                    </Button>
                    
                    <Dialog open={isPostErrandDialogOpen} onOpenChange={setIsPostErrandDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-auto py-5 flex flex-col gap-2 bg-secondary-neon text-primary-foreground font-black shadow-neon" disabled={isAgeGated}>
                                <Activity className="h-5 w-5" />
                                <span className="text-[9px] uppercase tracking-tighter">Custom Post</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95%] sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="font-black italic">POST NEW GIG</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                                <PostErrandForm 
                                    onSubmit={handlePostErrand} 
                                    onCancel={() => setIsPostErrandDialogOpen(false)} 
                                    typeOptions={STANDARD_ERRAND_OPTIONS}
                                    initialType={preselectedErrandType}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>

        {/* ACTIVE BOUNTIES */}
        <div className="space-y-4">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 text-muted-foreground/80">
                <span className="bg-secondary-neon w-6 h-0.5 rounded-full"></span>
                Active Bounties
            </h2>
            
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3].map(i => <Card key={i} className="h-48 animate-pulse bg-muted/20 border-border" />)}
                </div>
            ) : postedErrands.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {postedErrands.map((errand) => (
                        <ErrandCard key={errand.$id} errand={errand} currentUser={user} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl opacity-40">
                    <h3 className="text-[10px] font-black uppercase tracking-widest">No Bounties Found</h3>
                </div>
            )}
        </div>

      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ErrandsPage;