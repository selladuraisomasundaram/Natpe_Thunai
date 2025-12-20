"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Handshake, PlusCircle, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CASH_EXCHANGE_COLLECTION_ID } from "@/lib/appwrite";
import { ID, Models, Query } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { calculateCommissionRate, formatCommissionRate } from "@/utils/commission"; // Import dynamic commission
import CashExchangeListings from "@/components/CashExchangeListings";
import { useCashExchangeListings, CashExchangeRequest } from "@/hooks/useCashExchangeListings"; // NEW: Import the new hook

// Helper functions for serialization/deserialization (moved to hook)
// Removed from here

const CashExchangePage = () => {
  const { user, userProfile } = useAuth();
  const { requests: allExchangeRequests, isLoading, error, deleteRequest } = useCashExchangeListings(); // NEW: Use the new hook
  const [activeTab, setActiveTab] = useState<"requests" | "offers" | "group-contributions">("requests");
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [postType, setPostType] = useState<"request" | "offer" | "group-contribution">("request");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Removed fetchRequests and its useEffect, now handled by useCashExchangeListings hook

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      toast.error("You must be logged in to post.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!notes.trim() || !meetingLocation.trim() || !meetingTime.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsPosting(true);
    try {
      // Commission is now 0 for cash exchange
      const commissionAmount = 0; 

      const newRequestData = {
        type: postType,
        amount: parsedAmount,
        commission: commissionAmount, // Set commission to 0
        notes: notes.trim(),
        status: postType === "group-contribution" ? "Group Contribution" : "Open",
        meetingLocation: meetingLocation.trim(),
        meetingTime: meetingTime.trim(),
        // Serialize contributions array before sending to Appwrite
        contributions: postType === "group-contribution" ? [] : undefined, // Empty array for Appwrite
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName, // NEW: Add collegeName
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        ID.unique(),
        newRequestData
      );

      toast.success(`Your ${postType.replace('-', ' ')} for ₹${parsedAmount} has been posted!`);
      setIsPostDialogOpen(false);
      setAmount("");
      setNotes("");
      setMeetingLocation("");
      setMeetingTime("");
      setActiveTab(postType === "offer" ? "offers" : (postType === "group-contribution" ? "group-contributions" : "requests"));
    } catch (error: any) {
      console.error("Error posting cash exchange:", error);
      toast.error(error.message || "Failed to post cash exchange request.");
    } finally {
      setIsPosting(false);
    }
  };

  const filteredRequests = (type: "request" | "offer" | "group-contribution") => {
    return allExchangeRequests.filter(r => r.type === type);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Cash Exchange</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-secondary-neon" /> Your Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Post your cash requirements or offers for your college. This is a non-commissioned service. If you are benefited, consider contributing to the developers.
            </p>
            <Button
              className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
              onClick={() => setIsPostDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post New Request/Offer
            </Button>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "requests" | "offers" | "group-contributions")} className="w-full">
          <TabsList className="flex w-full overflow-x-auto whitespace-nowrap bg-primary-blue-light text-primary-foreground h-auto p-1 rounded-md shadow-sm scrollbar-hide">
            <TabsTrigger value="requests" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Requests</TabsTrigger>
            <TabsTrigger value="offers" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Offers</TabsTrigger>
            <TabsTrigger value="group-contributions" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Group</TabsTrigger>
          </TabsList>
          <div className="mt-4 space-y-4">
            <TabsContent value="requests">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <CashExchangeListings listings={filteredRequests("request")} isLoading={isLoading} type="request" onDelete={deleteRequest} /> {/* NEW: Pass onDelete */}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="offers">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <CashExchangeListings listings={filteredRequests("offer")} isLoading={isLoading} type="offer" onDelete={deleteRequest} /> {/* NEW: Pass onDelete */}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="group-contributions">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <CashExchangeListings listings={filteredRequests("group-contribution")} isLoading={isLoading} type="group-contribution" onDelete={deleteRequest} /> {/* NEW: Pass onDelete */}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
      <MadeWithDyad />

      {/* Post Request/Offer Dialog */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Post New Cash Exchange</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePostSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
              <Label htmlFor="postType" className="text-left sm:text-right text-foreground">
                Type
              </Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={postType === "request" ? "default" : "outline"}
                  onClick={() => setPostType("request")}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground text-xs"
                >
                  Request Cash
                </Button>
                <Button
                  type="button"
                  variant={postType === "offer" ? "default" : "outline"}
                  onClick={() => setPostType("offer")}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground text-xs"
                >
                  Offer Cash
                </Button>
                <Button
                  type="button"
                  variant={postType === "group-contribution" ? "default" : "outline"}
                  onClick={() => setPostType("group-contribution")}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground text-xs"
                >
                  Group Contribution
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
              <Label htmlFor="amount" className="text-left sm:text-right text-foreground">
                Amount (₹)
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                placeholder="e.g., 1000"
                min="1"
                required
                disabled={isPosting}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
              <Label htmlFor="notes" className="text-left sm:text-right text-foreground">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                placeholder="e.g., Need cash for books by tomorrow."
                required
                disabled={isPosting}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
              <Label htmlFor="meetingLocation" className="text-left sm:text-right text-foreground">
                Meeting Location
              </Label>
              <Input
                id="meetingLocation"
                type="text"
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                placeholder="e.g., Library Entrance, Canteen"
                required
                disabled={isPosting}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
              <Label htmlFor="meetingTime" className="text-left sm:text-right text-foreground">
                Meeting Time
              </Label>
              <Input
                id="meetingTime"
                type="text"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                placeholder="e.g., Tomorrow 3 PM, Today 1 PM"
                required
                disabled={isPosting}
              />
            </div>
            <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsPostDialogOpen(false)} disabled={isPosting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">Cancel</Button>
              <Button type="submit" disabled={isPosting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Post
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashExchangePage;