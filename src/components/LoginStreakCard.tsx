"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const LoginStreakCard = () => {
  const { user, addXp, updateStreakInfo } = useAuth();

  // Display a loading state or null if user data isn't loaded yet
  if (!user) {
    return null;
  }

  const { currentStreak, lastClaimedTimestamp } = user;
  const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  const handleClaimReward = () => {
    const now = Date.now();

    // Check if the user has already claimed within the last 24 hours
    if (lastClaimedTimestamp && (now - lastClaimedTimestamp < twentyFourHours)) {
      toast.info("You've already claimed your reward for today. Come back tomorrow!");
      return;
    }

    let newStreak = currentStreak;

    if (lastClaimedTimestamp) {
      // If it's been more than 48 hours since the last claim, reset the streak
      // This accounts for missing a day (24 hours for current day + 24 hours for missed day)
      if (now - lastClaimedTimestamp > (twentyFourHours * 2)) {
        newStreak = 1; // Reset streak to 1
        toast.info("Your streak was reset as you missed a day. Starting a new streak!");
      } else {
        // Continue the streak
        newStreak = currentStreak + 1;
      }
    } else {
      // First time claiming for a new user or after a long break
      newStreak = 1;
    }

    const xpReward = 10 * newStreak; // Reward XP based on the new streak length
    addXp(xpReward); // Add XP to the user's total
    updateStreakInfo(newStreak, now); // Update the streak and last claimed timestamp in the context

    toast.success(`You claimed your ${newStreak}-day streak reward! +${xpReward} XP earned.`);
  };

  const handleCardClick = () => {
    toast.info(`You are currently on a ${currentStreak}-day login streak! Keep it up for more rewards.`);
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={handleCardClick}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <Flame className="h-5 w-5 text-secondary-neon" /> Login Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col items-start">
        <p className="text-sm text-muted-foreground mb-3">You're on a <span className="font-bold text-secondary-neon">{currentStreak}-day</span> streak!</p>
        <Button onClick={handleClaimReward} className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          Claim Reward
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoginStreakCard;