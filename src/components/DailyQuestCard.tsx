"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const DailyQuestCard = () => {
  const [isClaiming, setIsClaiming] = useState(false);
  const { userProfile, addXp, updateUserProfile } = useAuth();

  if (!userProfile) {
    return null; // Don't render if user profile isn't loaded
  }

  const itemsListedToday = userProfile?.itemsListedToday ?? 0;
  const lastQuestCompletedDate = userProfile?.lastQuestCompletedDate ? new Date(userProfile.lastQuestCompletedDate) : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date to start of day

  const isQuestCompletedToday = lastQuestCompletedDate && lastQuestCompletedDate.getTime() === today.getTime();
  const canClaimQuest = itemsListedToday >= 1 && !isQuestCompletedToday;

  const handleClaimQuest = async () => {
    if (!canClaimQuest) {
      toast.info("You need to list at least one item to complete today's quest!");
      return;
    }

    setIsClaiming(true);
    try {
      const xpReward = 20; // Example XP reward for daily quest
      addXp(xpReward);

      // Update user profile to mark quest as claimed today and reset items listed
      await updateUserProfile({
        lastQuestCompletedDate: new Date().toISOString(),
        itemsListedToday: 0, // Reset for the next day
      });

      toast.success(`Daily Quest Completed! +${xpReward} XP earned.`);
    } catch (error) {
      console.error("Failed to claim daily quest:", error);
      toast.error("Failed to claim quest. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" /> Daily Quest
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col items-start">
        <p className="text-sm text-muted-foreground mb-3">
          List one item on the marketplace to earn <span className="font-bold text-green-500">20 XP</span>.
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          Items listed today: <span className="font-bold text-secondary-neon">{itemsListedToday}</span>
        </p>
        {isQuestCompletedToday ? (
          <div className="flex items-center text-green-500 font-medium">
            <CheckCircle className="h-4 w-4 mr-1" /> Quest Completed Today!
          </div>
        ) : (
          <Button
            onClick={handleClaimQuest}
            disabled={!canClaimQuest || isClaiming}
            className="w-full bg-green-600 text-primary-foreground hover:bg-green-700"
          >
            {isClaiming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Claiming...
              </>
            ) : (
              "Claim Quest Reward"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyQuestCard;