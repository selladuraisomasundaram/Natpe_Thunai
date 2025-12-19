"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostCollaboratorPostForm from "@/components/forms/PostCollaboratorPostForm";
import { useCollaboratorPosts, CollaboratorPost } from "@/hooks/useCollaboratorPosts";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_COLLABORATORS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";

const CollaboratorsPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { posts: allPosts, isLoading, error, refetch } = useCollaboratorPosts(userProfile?.collegeName);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePostCollaborator = async (data: Omit<CollaboratorPost, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "posterId" | "posterName" | "collegeName">) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a collaboration.");
      return;
    }

    try {
      const newPostData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
        status: 'open',
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLABORATORS_COLLECTION_ID,
        ID.unique(),
        newPostData
      );
      
      toast.success(`Your collaboration post "${data.title}" has been created!`);
      setIsPostDialogOpen(false);
      refetch(); // Refresh the list
    } catch (e: any) {
      console.error("Error posting collaboration:", e);
      toast.error(e.message || "Failed to post collaboration.");
    }
  };

  const filteredPosts = allPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.skillsNeeded.join(' ').toLowerCase().includes(searchTerm.toLowerCase()) || // Fixed here
    post.posterName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Collaborators Hub</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary-neon" /> Find Your Team
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Looking for teammates for a project, startup, or study group? Post your needs here!
            </p>
            <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Collaboration
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Collaboration</DialogTitle>
                </DialogHeader>
                <PostCollaboratorPostForm 
                  onSubmit={handlePostCollaborator} 
                  onCancel={() => setIsPostDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recent Collaboration Posts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <Input
              placeholder="Search posts by title, description, skills, or poster..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading posts...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading posts: {error}</p>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <div key={post.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{post.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{post.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Skills: <span className="font-medium text-foreground">{post.skillsNeeded.join(', ')}</span></p>
                  <p className="text-xs text-muted-foreground">Contact: {post.contact}</p>
                  <p className="text-xs text-muted-foreground">Posted by: {post.posterName} on {new Date(post.$createdAt).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No collaboration posts found for your college.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default CollaboratorsPage;