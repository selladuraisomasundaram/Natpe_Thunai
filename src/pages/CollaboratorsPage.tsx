"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, PlusCircle, Search, Loader2, Briefcase, 
  Code, Megaphone, PenTool, Lightbulb, Rocket, 
  DollarSign, Handshake, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollaboratorPosts, CollaboratorPost } from "@/hooks/useCollaboratorPosts";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_COLLABORATORS_COLLECTION_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// --- CONFIGURATION ---
const COMPENSATION_TYPES = [
  { value: "unpaid", label: "Unpaid / Volunteer" },
  { value: "stipend", label: "Paid Stipend" },
  { value: "equity", label: "Equity / Rev Share" },
];

const SKILL_CATEGORIES = [
  { value: "tech", label: "Tech / Dev", icon: Code, color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "design", label: "Design / UX", icon: PenTool, color: "text-pink-500", bg: "bg-pink-500/10" },
  { value: "marketing", label: "Marketing", icon: Megaphone, color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "business", label: "Business", icon: Briefcase, color: "text-green-500", bg: "bg-green-500/10" },
  { value: "other", label: "Other", icon: Lightbulb, color: "text-purple-500", bg: "bg-purple-500/10" },
];

// --- COMPONENT: PROJECT CARD ---
const ProjectCard = ({ project, onApply, isOwner }: { project: any, onApply: (p: any) => void, isOwner: boolean }) => {
  const categoryConfig = SKILL_CATEGORIES.find(c => c.value === project.category) || SKILL_CATEGORIES[4];
  const Icon = categoryConfig.icon;

  return (
    <Card className="group flex flex-col h-full border-border/60 hover:shadow-xl transition-all duration-300 bg-card relative overflow-hidden">
      {/* Decorative Gradient Background based on category */}
      <div className={`absolute top-0 left-0 w-full h-1 ${categoryConfig.bg.replace('/10', '/50')}`} />
      
      <CardHeader className="p-5 pb-2">
        <div className="flex justify-between items-start mb-3">
          <div className={`p-2 rounded-lg ${categoryConfig.bg}`}>
            <Icon className={`h-5 w-5 ${categoryConfig.color}`} />
          </div>
          <Badge variant="outline" className={cn(
            "text-[10px] uppercase font-bold tracking-wider",
            project.compensationType === 'stipend' ? "border-green-500 text-green-600 bg-green-50" :
            project.compensationType === 'equity' ? "border-purple-500 text-purple-600 bg-purple-50" :
            "text-muted-foreground"
          )}>
            {project.compensationType === 'stipend' ? `₹${project.stipendAmount}` : 
             project.compensationType === 'equity' ? "Equity Share" : "Volunteer"}
          </Badge>
        </div>
        
        <CardTitle className="text-xl font-bold leading-tight group-hover:text-secondary-neon transition-colors">
          {project.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-grow p-5 pt-0 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {project.description}
        </p>

        {/* Skills Tags */}
        <div className="flex flex-wrap gap-1.5">
          {project.skillsNeeded.split(',').map((skill: string, i: number) => (
            <span key={i} className="px-2 py-1 bg-muted/50 rounded-md text-[10px] font-medium text-foreground/80">
              {skill.trim()}
            </span>
          ))}
        </div>

        {/* Poster Info */}
        <div className="flex items-center gap-3 pt-3 border-t border-border/40">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${project.posterName}`} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">{project.posterName}</span>
            <span className="text-[10px] text-muted-foreground">Founder / Lead</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 bg-muted/10 border-t border-border/40">
        {isOwner ? (
          <Button variant="ghost" size="sm" className="w-full text-xs opacity-50" disabled>
            Posted by You
          </Button>
        ) : (
          <Button 
            className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-bold shadow-sm group-hover:translate-y-[-2px] transition-transform"
            onClick={() => onApply(project)}
          >
            {project.compensationType === 'stipend' ? "Apply for Role" : "Join Project"} 
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

// --- MAIN PAGE ---
const CollaboratorsPage = () => {
  const { user, userProfile } = useAuth();
  
  // Data
  const { posts: allProjectPosts, isLoading, error } = useCollaboratorPosts();
  
  // States
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Form States (Post)
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postSkills, setPostSkills] = useState("");
  const [postCategory, setPostCategory] = useState("tech");
  const [compensationType, setCompensationType] = useState("unpaid");
  const [stipendAmount, setStipendAmount] = useState("");

  // Form States (Apply)
  const [applyNote, setApplyNote] = useState("");

  // Filter Logic
  const filteredPosts = allProjectPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.skillsNeeded.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- HANDLERS ---

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    setIsProcessing(true);
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLABORATORS_COLLECTION_ID,
        ID.unique(),
        {
          title: postTitle,
          description: postDescription,
          skillsNeeded: postSkills,
          category: postCategory,
          compensationType,
          stipendAmount: compensationType === 'stipend' ? parseInt(stipendAmount) : 0,
          contact: user.email, // Default contact
          posterId: user.$id,
          posterName: user.name,
          collegeName: userProfile.collegeName,
        }
      );

      toast.success("Project posted successfully!");
      setIsPostDialogOpen(false);
      // Reset form...
      setPostTitle(""); setPostDescription(""); setPostSkills(""); setStipendAmount("");
    } catch (e: any) {
      toast.error(e.message || "Failed to post.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyClick = (project: any) => {
    if (!user) { toast.error("Login to apply."); return; }
    setSelectedProject(project);
    setIsApplyDialogOpen(true);
  };

  const confirmApplication = async () => {
    if (!selectedProject || !user) return;
    setIsProcessing(true);

    try {
      // Create Transaction Record (Status: Applied)
      // This allows the Poster to see applicants in their "Activity" tab
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: selectedProject.$id,
          productTitle: `Application: ${selectedProject.title}`,
          amount: selectedProject.stipendAmount || 0,
          buyerId: user.$id, // Applicant
          buyerName: user.name,
          sellerId: selectedProject.posterId, // Project Owner
          sellerName: selectedProject.posterName,
          collegeName: selectedProject.collegeName,
          status: "applied", // Special status for collab
          type: "collaboration",
          ambassadorDelivery: false,
          ambassadorMessage: `Note: ${applyNote}`
        }
      );
      
      toast.success("Application sent! Project owner will review it.");
      setIsApplyDialogOpen(false);
      setApplyNote("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to apply.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24">
      
      {/* HEADER */}
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tighter text-foreground">
              BUILD<span className="text-secondary-neon">TOGETHER</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium max-w-md">
              The startup ecosystem for students. Find co-founders, join hackathon teams, or get hired for campus projects.
            </p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-grow md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search roles (e.g. React, Marketing)..." 
                className="pl-9 h-11 bg-card border-border shadow-sm" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 bg-foreground text-background hover:bg-foreground/90 font-bold px-6 shadow-md">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-secondary-neon" /> Launch a Project
                  </DialogTitle>
                  <DialogDescription>Describe your idea and the talent you need.</DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handlePostSubmit} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Project Title</Label>
                    <Input value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="e.g. AI Study Assistant App" required />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={postCategory} onValueChange={setPostCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SKILL_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Compensation</Label>
                      <Select value={compensationType} onValueChange={setCompensationType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COMPENSATION_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {compensationType === 'stipend' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label>Stipend Amount (₹)</Label>
                      <Input type="number" value={stipendAmount} onChange={(e) => setStipendAmount(e.target.value)} placeholder="5000" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Skills Required (Comma separated)</Label>
                    <Input value={postSkills} onChange={(e) => setPostSkills(e.target.value)} placeholder="React, Python, Figma..." required />
                  </div>

                  <div className="space-y-2">
                    <Label>Description & Vision</Label>
                    <Textarea 
                      value={postDescription} 
                      onChange={(e) => setPostDescription(e.target.value)} 
                      placeholder="What are you building? Who are you looking for?" 
                      className="h-24 resize-none"
                      required 
                    />
                  </div>

                  <DialogFooter>
                    <Button type="submit" className="w-full bg-secondary-neon font-bold" disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="animate-spin" /> : "Post Opportunity"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* LISTINGS GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 animate-pulse bg-muted/20 rounded-xl" />)}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <ProjectCard 
                key={post.$id} 
                project={post} 
                onApply={handleApplyClick} 
                isOwner={user?.$id === post.posterId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
            <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No open projects</h3>
            <p className="text-muted-foreground mt-1">Be the first visionary to post!</p>
          </div>
        )}
      </div>

      {/* APPLY DIALOG */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-secondary-neon" /> Apply to Join
            </DialogTitle>
            <DialogDescription>
              Sending application to <b>{selectedProject?.posterName}</b> for <b>{selectedProject?.title}</b>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {selectedProject?.compensationType === 'stipend' && (
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <DollarSign className="h-4 w-4" />
                This role pays a stipend of <b>₹{selectedProject.stipendAmount}</b> upon hiring.
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Cover Note</Label>
              <Textarea 
                value={applyNote} 
                onChange={(e) => setApplyNote(e.target.value)} 
                placeholder="Why are you a good fit? Share your portfolio links..." 
                className="h-32"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmApplication} disabled={isProcessing} className="bg-secondary-neon text-primary-foreground font-bold">
              {isProcessing ? <Loader2 className="animate-spin" /> : "Send Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MadeWithDyad />
    </div>
  );
};

export default CollaboratorsPage;