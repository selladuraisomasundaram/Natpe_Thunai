"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, PlusCircle, Frown, Smile, Loader2, MapPin, Calendar, MessageSquareText, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useLostAndFoundListings, LostFoundItem } from "@/hooks/useLostAndFoundListings";
import PostLostItemForm from "@/components/forms/PostLostItemForm";
import PostFoundItemForm from "@/components/forms/PostFoundItemForm";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const LostAndFoundPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, isLoading, error, updateItemStatus } = useLostAndFoundListings();
  const [isPostLostDialogOpen, setIsPostLostDialogOpen] = useState(false);
  const [isPostFoundDialogOpen, setIsPostFoundDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "lost" | "found">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm.trim() === "" ||
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "all" || item.type === activeTab;

    return matchesSearch && matchesTab;
  });

  const handleMarkResolved = async (itemId: string) => {
    if (!user) {
      toast.error("You must be logged in to update item status.");
      return;
    }
    if (window.confirm("Are you sure you want to mark this item as resolved? This means it has been returned/found.")) {
      try {
        await updateItemStatus(itemId, "Resolved");
      } catch (e) {
        // Error handled in hook
      }
    }
  };

  const renderItems = (list: LostFoundItem[]) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
          <p className="ml-3 text-muted-foreground">Loading items...</p>
        </div>
      );
    }
    if (error) {
      return <p className="text-center text-destructive py-4">Error loading items: {error}</p>;
    }
    if (list.length === 0) {
      return <p className="text-center text-muted-foreground py-4">No items found for this category in your college.</p>;
    }

    return list.map((item) => {
      const isPoster = user?.$id === item.posterId;
      const itemDate = new Date(item.date).toLocaleDateString();

      return (
        <Card key={item.$id} className="bg-card text-card-foreground shadow-lg border-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                {item.type === "lost" ? <Frown className="h-5 w-5 text-destructive" /> : <Smile className="h-5 w-5 text-secondary-neon" />}
                {item.itemName}
              </h3>
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                item.status === "Active" ? "bg-yellow-500 text-white" : "bg-green-500 text-white"
              )}>
                {item.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.itemName} className="w-full h-32 object-cover rounded-md mt-2" />
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.type === "lost" ? "Last Seen" : "Found"}: {item.location}</p>
              <p className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Date: {itemDate}</p>
              <p className="flex items-center gap-1"><MessageSquareText className="h-3 w-3" /> Contact: {item.contact}</p>
              <p>Posted by: {isPoster ? "You" : item.posterName}</p>
            </div>
            {isPoster && item.status === "Active" && (
              <Button
                size="sm"
                className="w-full bg-green-500 text-white hover:bg-green-600 mt-3"
                onClick={() => handleMarkResolved(item.$id)}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Mark as Resolved
              </Button>
            )}
          </CardContent>
        </Card>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-secondary-neon">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Activity
        </Button>
        
        <h1 className="text-4xl font-bold text-center text-foreground">Lost & Found</h1>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Search className="h-5 w-5 text-secondary-neon" /> Find or Post Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Help your peers by reporting found items, or get help finding your lost belongings.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Dialog open={isPostLostDialogOpen} onOpenChange={setIsPostLostDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-1/2 bg-destructive text-primary-foreground hover:bg-destructive/90">
                    <Frown className="mr-2 h-4 w-4" /> Post Lost Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Report a Lost Item</DialogTitle>
                  </DialogHeader>
                  <PostLostItemForm onItemPosted={() => setIsPostLostDialogOpen(false)} onCancel={() => setIsPostLostDialogOpen(false)} />
                </DialogContent>
              </Dialog>
              <Dialog open={isPostFoundDialogOpen} onOpenChange={setIsPostFoundDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-1/2 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                    <Smile className="mr-2 h-4 w-4" /> Post Found Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Report a Found Item</DialogTitle>
                  </DialogHeader>
                  <PostFoundItemForm onItemPosted={() => setIsPostFoundDialogOpen(false)} onCancel={() => setIsPostFoundDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search items by name, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "lost" | "found")} className="w-full">
          <TabsList className="flex w-full overflow-x-auto whitespace-nowrap bg-primary-blue-light text-primary-foreground h-auto p-1 rounded-md shadow-sm scrollbar-hide">
            <TabsTrigger value="all" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">All Items</TabsTrigger>
            <TabsTrigger value="lost" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Lost Items</TabsTrigger>
            <TabsTrigger value="found" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Found Items</TabsTrigger>
          </TabsList>
          <div className="mt-4 space-y-4">
            <TabsContent value="all">
              <div className="grid grid-cols-1 gap-4">
                {renderItems(filteredItems)}
              </div>
            </TabsContent>
            <TabsContent value="lost">
              <div className="grid grid-cols-1 gap-4">
                {renderItems(filteredItems)}
              </div>
            </TabsContent>
            <TabsContent value="found">
              <div className="grid grid-cols-1 gap-4">
                {renderItems(filteredItems)}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default LostAndFoundPage;