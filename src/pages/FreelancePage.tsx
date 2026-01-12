"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Briefcase, PlusCircle, Loader2, Search, Filter, Star, 
  Code, PenTool, Camera, GraduationCap, Calendar, Wrench, 
  MessageCircle, CheckCircle, Handshake
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm";
import SubmitServiceReviewForm from "@/components/forms/SubmitServiceReviewForm";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";

// --- CONFIGURATION ---
const FREELANCE_CATEGORIES = [
  "academic-help", "tech-support", "design-creative", "writing-editing",
  "tutoring", "event-planning", "photography", "other"
];

// Mapped with Icons for UI
const CATEGORY_CONFIG = [
  { value: "academic-help", label: "Assignments", icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "tech-support", label: "Tech Fix", icon: Wrench, color: "text-slate-500", bg: "bg-slate-500/10" },
  { value: "design-creative", label: "Design", icon: PenTool, color: "text-pink-500", bg: "bg-pink-500/10" },
  { value: "writing-editing", label: "Writing", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "tutoring", label: "Tutoring", icon: Code, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { value: "photography", label: "Photo/Video", icon: Camera, color: "text-purple-500", bg: "bg-purple-500/10" },
  { value: "event-planning", label: "Events", icon: Calendar, color: "text-green-500", bg: "bg-green-500/10" },
];

// --- COMPONENT: GIG CARD ---
// A specialized card for Freelance Gigs
const GigCard = ({ 
  service, 
  onHire, 
  isOwner 
}: { 
  service: ServicePost, 
  onHire: (s: ServicePost) => void,
  isOwner: boolean
}) => {
  return (
    <Card className="group flex flex-col h-full border-border/60 hover:shadow-xl transition-all duration-300 bg-card">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="capitalize text-[10px] font-bold tracking-wider opacity-70">
            {service.category.replace('-', ' ')}
          </Badge>
          <div className="flex items-center gap-1 text-xs font-bold text-yellow-500">
            <Star className="h-3 w-3 fill-yellow-500" /> 4.8
          </div>
        </div>
        <CardTitle className="text-lg font-bold leading-tight group-hover:text-secondary-neon transition-colors pt-2">
          {service.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow p-4 pt-0 space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {service.description}
        </p>
        
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <Avatar className="h-6 w-6 border border-border">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${service.posterName}`} />
            <AvatarFallback>{service.posterName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-foreground/80 truncate">
            {service.posterName}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 mt-auto flex items-center justify-between border-t border-border/40 bg-muted/20">
        <div className="flex flex-col py-2">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Starting at</span>
          <span className="text-lg font-black text-foreground">₹{service.price}</span>
        </div>
        
        {isOwner ? (
          <Button variant="ghost" size="sm" disabled className="opacity-50 text-xs">
            Your Gig
          </Button>
        ) : (
          <Button 
            size="sm" 
            onClick={() => onHire(service)}
            className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-bold shadow-sm"
          >
            Hire / Chat
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// --- MAIN PAGE ---
const FreelancePage = () => {
  const { user, userProfile } = useAuth();
  
  // Dialog States
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [isHireDialogOpen, setIsHireDialogOpen] = useState(false);
  const [selectedGig, setSelectedGig] = useState<ServicePost | null>(null);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isProcessing, setIsProcessing] = useState(false);

  // Data
  const { services: freelanceListings, isLoading, error } = useServiceListings(FREELANCE_CATEGORIES);
  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  // --- LOGIC: Filter Gigs ---
  const filteredGigs = freelanceListings.filter(gig => {
    const matchesCategory = activeCategory === "all" || gig.category === activeCategory;
    const matchesSearch = gig.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          gig.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // --- LOGIC: Post Gig ---
  const handlePostService = async (data: any) => {
    if (!user || !userProfile) return;

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        {
          ...data,
          category: data.category === 'other' && data.otherCategoryDescription 
                    ? data.otherCategoryDescription 
                    : data.category,
          posterId: user.$id,
          posterName: user.name,
          collegeName: userProfile.collegeName,
        }
      );
      toast.success(`Gig "${data.title}" posted!`);
      setIsPostServiceDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to post service.");
    }
  };

  // --- LOGIC: Hire / Connect ---
  const handleHireClick = (gig: ServicePost) => {
    if (!user) {
      toast.error("Login to hire freelancers.");
      return;
    }
    setSelectedGig(gig);
    setIsHireDialogOpen(true);
  };

  const confirmHire = async () => {
    if (!selectedGig || !user) return;
    setIsProcessing(true);

    try {
      // Create Transaction Record (Status: Negotiating)
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: selectedGig.$id,
          productTitle: `Gig: ${selectedGig.title}`,
          amount: parseFloat(selectedGig.price) || 0, // Store base price
          buyerId: user.$id,
          buyerName: user.name,
          sellerId: selectedGig.posterId,
          sellerName: selectedGig.posterName,
          collegeName: selectedGig.collegeName,
          status: "negotiating", // New status for freelance
          type: "service",
          ambassadorDelivery: false,
          ambassadorMessage: `Interested in your gig: ${selectedGig.title}`
        }
      );
      
      toast.success("Interest sent! Check your Activity tab to chat.");
      setIsHireDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      
      {/* --- HEADER & SEARCH --- */}
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-foreground">
              SKILL<span className="text-secondary-neon">MARKET</span>
            </h1>
            <p className="text-xs text-muted-foreground font-medium">Find talent or monetize your skills on campus.</p>
          </div>
          
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search services..." 
                className="pl-9 bg-card" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-foreground text-background hover:bg-foreground/90 font-bold" disabled={isAgeGated}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Gig
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader><DialogTitle>Create a Gig</DialogTitle></DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                   <PostServiceForm 
                     onSubmit={handlePostService} 
                     onCancel={() => setIsPostServiceDialogOpen(false)} 
                     categoryOptions={CATEGORY_CONFIG.map(c => ({ value: c.value, label: c.label }))}
                   />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* --- CATEGORY GRID --- */}
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          {CATEGORY_CONFIG.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(activeCategory === cat.value ? "all" : cat.value)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 gap-2
                ${activeCategory === cat.value 
                  ? "border-secondary-neon bg-secondary-neon/10 scale-105 shadow-md" 
                  : "border-border bg-card hover:bg-muted"
                }`}
            >
              <div className={`p-2 rounded-full ${cat.bg}`}>
                <cat.icon className={`h-5 w-5 ${cat.color}`} />
              </div>
              <span className="text-[10px] font-bold text-foreground text-center leading-none">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* --- LISTINGS GRID --- */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Filter className="h-4 w-4 text-secondary-neon" /> 
              {activeCategory === 'all' ? 'All Gigs' : 'Filtered Results'}
            </h2>
            <span className="text-xs text-muted-foreground">{filteredGigs.length} services available</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-64 animate-pulse bg-muted/20 rounded-xl" />)}
            </div>
          ) : filteredGigs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredGigs.map(gig => (
                <GigCard 
                  key={gig.$id} 
                  service={gig} 
                  onHire={handleHireClick}
                  isOwner={user?.$id === gig.posterId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
              <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No gigs found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your filters or be the first to post!</p>
            </div>
          )}
        </div>
      </div>

      {/* --- HIRE DIALOG --- */}
      <Dialog open={isHireDialogOpen} onOpenChange={setIsHireDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-secondary-neon" /> Connect with {selectedGig?.posterName}
            </DialogTitle>
            <DialogDescription>
              Start a conversation to discuss requirements for <b>{selectedGig?.title}</b>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
             <div className="flex justify-between">
                <span className="text-muted-foreground">Base Price:</span>
                <span className="font-bold">₹{selectedGig?.price}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-bold">{selectedGig?.posterName}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Contact:</span>
                <span className="font-bold text-blue-500">{selectedGig?.contact}</span>
             </div>
          </div>

          <DialogFooter>
             <Button variant="outline" onClick={() => setIsHireDialogOpen(false)}>Cancel</Button>
             <Button onClick={confirmHire} disabled={isProcessing} className="bg-secondary-neon text-primary-foreground font-bold">
               {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Chat"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MadeWithDyad />
    </div>
  );
};

export default FreelancePage;