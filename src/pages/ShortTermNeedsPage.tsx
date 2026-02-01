"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, Zap, PlusCircle, Loader2, X, Package, 
  Handshake, ShoppingCart, ArrowRight, Target, 
  User, Briefcase, IndianRupee, MapPin 
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostErrandForm from "@/components/forms/PostErrandForm";
import { useErrandListings } from "@/hooks/useErrandListings";
import { 
  databases, 
  APPWRITE_DATABASE_ID, 
  APPWRITE_ERRANDS_COLLECTION_ID, 
  APPWRITE_TRANSACTIONS_COLLECTION_ID 
} from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import * as z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// --- CONFIGURATION ---
const NEED_TYPES = ["product-need", "service-need", "errand-need", "other"];

const NEED_OPTIONS = [
  { value: "product-need", label: "Product Request", icon: Package, color: "text-blue-400" },
  { value: "service-need", label: "Service Request", icon: Briefcase, color: "text-purple-400" },
  { value: "errand-need", label: "Errand Run", icon: ShoppingCart, color: "text-orange-400" },
  { value: "other", label: "Custom Mission", icon: Target, color: "text-secondary-neon" },
];

// --- ZOD SCHEMA ---
const ErrandFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  type: z.string().min(1, { message: "Please select a need type." }),
  otherTypeDescription: z.string().optional(),
  compensation: z.string().min(2, { message: "Compensation details are required." }),
  deadline: z.date().optional(),
  contact: z.string().min(5, { message: "Contact information is required." }),
});

const ShortTermNeedsPage = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isPostErrandDialogOpen, setIsPostErrandDialogOpen] = useState(false);
  const [initialTypeForForm, setInitialTypeForForm] = useState<string | undefined>(undefined);
  const [showNeedFormInfoAlert, setShowNeedFormInfoAlert] = useState(true);
  
  // Fetch only needs for the user's college
  const { errands: postedNeeds, isLoading, error } = useErrandListings(NEED_TYPES);

  // Content is age-gated if user is 25 or older
  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleNeedClick = (needType: string) => {
    setInitialTypeForForm(needType);
    setIsPostErrandDialogOpen(true);
    setShowNeedFormInfoAlert(true);
  };

  const handlePostErrand = async (data: z.infer<typeof ErrandFormSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a need.");
      return;
    }

    try {
      const newRequestData = {
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
        newRequestData
      );
      
      toast.success("Mission Posted! It's now live on the board.");
      setIsPostErrandDialogOpen(false);
      setInitialTypeForForm(undefined);
    } catch (e: any) {
      console.error("Error posting need:", e);
      toast.error(e.message || "Failed to post need listing.");
    }
  };

  // --- HANDLE ACCEPTING A NEED (Converts to Transaction) ---
  const handleAcceptNeed = async (need: any) => {
      if (!user) {
          toast.error("Login to accept missions.");
          return;
      }

      try {
          // 1. Parse Compensation Amount (Try to find a number)
          // "500rs" -> 500, "Free" -> 0
          const amountMatch = need.compensation.match(/\d+/);
          const parsedAmount = amountMatch ? parseInt(amountMatch[0]) : 0;

          // 2. Create Transaction Record
          // Mapping: Need Poster -> Buyer (Client), Current User -> Seller (Provider)
          const transactionData = {
              buyerId: need.posterId,        // The person who posted the need (Client)
              buyerName: need.posterName,
              sellerId: user.$id,            // YOU are accepting the job (Provider)
              sellerName: user.name,
              productId: need.$id,           // Link back to the need ID
              productTitle: need.title,      // Title of the mission
              type: "Errand",                // Transaction Type
              amount: parsedAmount,          // Parsed or 0
              status: "initiated",           // Initial State
              collegeName: userProfile?.collegeName || "Unknown"
          };

          const newTxn = await databases.createDocument(
              APPWRITE_DATABASE_ID,
              APPWRITE_TRANSACTIONS_COLLECTION_ID,
              ID.unique(),
              transactionData
          );

          toast.success("Mission Accepted! Redirecting to Tracking...");
          navigate('/tracking');

      } catch (e: any) {
          console.error("Failed to accept:", e);
          toast.error("Could not accept mission. Try again.");
      }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20 relative overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <div className="max-w-md mx-auto mb-8 text-center">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase">
          NEED <span className="text-secondary-neon">BOARD</span>
        </h1>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-60">
          Post Requests • Earn Bounties • Help Peers
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-8">
        
        {/* --- POST A NEED CARD --- */}
        <Card className="bg-card/50 backdrop-blur-sm border-2 border-secondary-neon/20 shadow-[0_0_15px_rgba(0,243,255,0.1)] overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-secondary-neon to-transparent opacity-50" />
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Zap className="h-5 w-5 text-secondary-neon fill-secondary-neon" /> 
              Broadcast a Signal
            </CardTitle>
            <p className="text-xs text-muted-foreground font-medium">
               What do you need help with today?
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-2 grid grid-cols-2 gap-3">
            {NEED_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4 border-dashed border-border hover:border-secondary-neon hover:bg-secondary-neon/5 transition-all group"
                  onClick={() => handleNeedClick(opt.value)}
                >
                  <opt.icon className={cn("h-6 w-6 transition-transform group-hover:scale-110", opt.color)} />
                  <span className="text-[10px] font-bold uppercase">{opt.label}</span>
                </Button>
            ))}

            <Dialog open={isPostErrandDialogOpen} onOpenChange={setIsPostErrandDialogOpen}>
              <DialogTrigger asChild>
                <Button className="col-span-2 mt-2 bg-secondary-neon text-primary-foreground font-black uppercase tracking-widest hover:bg-secondary-neon/90 h-12 shadow-neon" disabled={isAgeGated}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Post Custom Mission
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground uppercase font-black tracking-tight">New Mission Details</DialogTitle>
                </DialogHeader>
                
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                  {showNeedFormInfoAlert && (
                    <Alert className="bg-secondary-neon/10 border-secondary-neon/20 text-secondary-neon flex items-center justify-between mb-4">
                      <AlertDescription className="text-xs font-bold">
                        Describe your need clearly. Peers will accept it to start a chat.
                      </AlertDescription>
                      <Button variant="ghost" size="icon" onClick={() => setShowNeedFormInfoAlert(false)} className="h-6 w-6 text-secondary-neon hover:bg-secondary-neon/20">
                        <X className="h-3 w-3" />
                      </Button>
                    </Alert>
                  )}
                  <PostErrandForm 
                    onSubmit={handlePostErrand} 
                    onCancel={() => { setIsPostErrandDialogOpen(false); setInitialTypeForForm(undefined); }}
                    typeOptions={NEED_OPTIONS}
                    initialType={initialTypeForForm}
                  />
                </div>
              </DialogContent>
            </Dialog>
            <p className="col-span-2 text-[10px] text-center text-muted-foreground/50 uppercase tracking-widest">
              {isAgeGated ? "Access Restricted (Age 25+)" : "Visible to Campus Network"}
            </p>
          </CardContent>
        </Card>

        {/* --- NEEDS FEED --- */}
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" /> Live Opportunities
                </h2>
                <Badge variant="outline" className="text-[10px] h-5 border-border">{postedNeeds.length} Active</Badge>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-50">
                <Loader2 className="h-8 w-8 animate-spin text-secondary-neon" />
                <p className="text-xs font-mono uppercase">Scanning Frequencies...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4 text-xs font-mono">Error: {error}</p>
            ) : postedNeeds.length > 0 ? (
              postedNeeds.map((need) => {
                 const isMyPost = need.posterId === user?.$id;
                 const typeConfig = NEED_OPTIONS.find(o => o.value === need.type) || { icon: Target, color: "text-foreground", label: need.type };
                 const TypeIcon = typeConfig.icon;

                 return (
                    <Card key={need.$id} className="group overflow-hidden border border-border/50 bg-card hover:border-secondary-neon/50 transition-all duration-300">
                      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                         <div className="flex gap-3">
                             <div className={cn("p-2 rounded-lg bg-muted/50 h-fit", typeConfig.color)}>
                                 <TypeIcon className="h-5 w-5" />
                             </div>
                             <div>
                                 <CardTitle className="text-base font-bold leading-tight mb-1">{need.title}</CardTitle>
                                 <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono uppercase">
                                     <span>{typeConfig.label}</span>
                                     <span>•</span>
                                     <span className="flex items-center gap-1 text-foreground font-bold">
                                         <User className="h-3 w-3" /> {need.posterName}
                                     </span>
                                 </div>
                             </div>
                         </div>
                         {need.deadline && (
                             <Badge variant="outline" className="text-[9px] bg-background font-mono">
                                 Due: {new Date(need.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                             </Badge>
                         )}
                      </CardHeader>

                      <CardContent className="p-4 py-2">
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {need.description}
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-secondary-neon bg-secondary-neon/5 px-3 py-2 rounded-md w-fit">
                              <IndianRupee className="h-3.5 w-3.5" /> 
                              {need.compensation}
                          </div>
                      </CardContent>

                      <CardFooter className="p-3 bg-muted/20 flex gap-2">
                          {isMyPost ? (
                             <Button variant="ghost" className="w-full text-xs opacity-50 cursor-not-allowed" disabled>
                                 Your Post
                             </Button>
                          ) : (
                             <Button 
                                className="w-full bg-foreground text-background hover:bg-secondary-neon hover:text-primary-foreground font-black text-xs uppercase tracking-wider transition-all shadow-lg"
                                onClick={() => handleAcceptNeed(need)}
                             >
                                <Handshake className="mr-2 h-4 w-4" /> I can do this
                             </Button>
                          )}
                      </CardFooter>
                    </Card>
                 );
              })
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl opacity-50">
                <Package className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No Active Missions</p>
                <p className="text-[10px] text-muted-foreground mt-1">Be the first to post a need!</p>
              </div>
            )}
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ShortTermNeedsPage;