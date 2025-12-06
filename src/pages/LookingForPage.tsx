"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Search, ArrowLeft, HelpCircle, Loader2, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import PostLookingForForm from "@/components/forms/PostLookingForForm";
import { useLookingForPosts } from "@/hooks/useLookingForPosts";
import { Input } from "@/components/ui/input";

const LookingForPage = () => {
  const navigate = useNavigate();
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { posts, isLoading, error } = useLookingForPosts();

  const handlePostSubmitted = () => {
    setIsPostDialogOpen(false);
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.posterName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-secondary-neon">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <h1 className="text-4xl font-bold text-center text-foreground">Looking For...</h1>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Search className="h-5 w-5 text-secondary-neon" /> Post Your Needs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Can't find what you're looking for in the market or services? Post a request here!
            </p>
            <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post a "Looking For" Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New "Looking For" Request</DialogTitle>
                </DialogHeader>
                <PostLookingForForm onPostSubmitted={handlePostSubmitted} onCancel={() => setIsPostDialogOpen(false)} />
              </DialogContent>
            </Dialog>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search requests by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recent Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading requests...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading requests: {error}</p>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <div key={post.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{post.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{post.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{post.category}</span></p>
                  <p className="text-xs text-muted-foreground">Budget: <span className="font-medium text-foreground">{post.budget}</span></p>
                  <p className="text-xs text-muted-foreground">Posted by: {post.posterName}</p>
                  <p className="text-xs text-muted-foreground">Posted: {new Date(post.$createdAt).toLocaleDateString()}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
                    onClick={() => toast.info(`Contacting ${post.posterName} at ${post.contact} to offer help.`)}
                  >
                    <MessageSquareText className="mr-2 h-4 w-4" /> Offer Help
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No "Looking For" requests posted yet for your college.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default LookingForPage;