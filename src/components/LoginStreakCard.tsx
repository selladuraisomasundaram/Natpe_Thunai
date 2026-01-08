"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const LoginStreakCard = () => {
  const { addXp } = useAuth();
  const [loginStreak, setLoginStreak] = useState(0);
  const [claimedToday, setClaimedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Get Today's Date (ignoring time)
    const today = new Date().toDateString(); // e.g., "Mon Jan 01 2024"
    
    // 2. Retrieve stored data
    const lastLoginDate = localStorage.getItem("natpe_last_login_date");
    const lastClaimDate = localStorage.getItem("natpe_last_claim_date");
    let currentStreak = parseInt(localStorage.getItem("natpe_streak") || "0", 10);

    // 3. Logic to Calculate Streak
    if (lastLoginDate === today) {
      // User has already visited today. 
      // Do NOT increment, just keep the streak as it is (persisted from previous visit today).
      // If this is the very first render ever (streak 0), set to 1.
      if (currentStreak === 0) currentStreak = 1;
    } else {
      // User is visiting for the first time today.
      
      // Calculate 'Yesterday'
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();

      if (lastLoginDate === yesterdayString) {
        // Last login was exactly yesterday -> Increment Streak
        currentStreak += 1;
      } else {
        // Last login was NOT yesterday (and not today) -> Streak Broken (Reset)
        currentStreak = 1;
      }

      // Update storage immediately so subsequent refreshes today hit the "if (lastLoginDate === today)" block
      localStorage.setItem("natpe_last_login_date", today);
      localStorage.setItem("natpe_streak", currentStreak.toString());
    }

    // 4. Update State
    setLoginStreak(currentStreak);

    // 5. Check Claim Status
    if (lastClaimDate === today) {
      setClaimedToday(true);
    } else {
      setClaimedToday(false);
    }
    
    setIsLoading(false);
  }, []);

  const handleClaimReward = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click event

    if (claimedToday) {
      toast.info("Reward already claimed today. Come back tomorrow!");
      return;
    }

    const rewardXP = 10 * loginStreak;

    // Call Auth Context to add XP
    if (addXp) {
        addXp(rewardXP);
        toast.success(`Streak maintained! +${rewardXP} XP earned.`);
    } else {
        toast.error("Unable to connect to profile. Please try again.");
        return;
    }

    // Mark as claimed for today
    const today = new Date().toDateString();
    localStorage.setItem("natpe_last_claim_date", today);
    setClaimedToday(true);
  };

  const handleCardClick = () => {
    toast.info(`You are on a ${loginStreak}-day streak! Claim daily to increase your reward.`);
  };

  if (isLoading) {
      return (
        <Card className="bg-card shadow-lg border-border h-[130px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground animate-pulse">Loading streak...</p>
        </Card>
      );
  }

  return (
    <Card 
        className="bg-card text-card-foreground shadow-lg border-border cursor-pointer hover:shadow-xl transition-shadow" 
        onClick={handleCardClick}
    >
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <Flame className={`h-5 w-5 ${claimedToday ? 'text-muted-foreground' : 'text-orange-500 animate-pulse'}`} /> 
          Login Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col items-start">
        <p className="text-sm text-muted-foreground mb-3">
            You're on a <span className="font-bold text-secondary-neon">{loginStreak}-day</span> streak!
        </p>
        <Button 
          onClick={handleClaimReward} 
          className={`w-full text-primary-foreground transition-all duration-200 ${
            claimedToday 
                ? "bg-muted hover:bg-muted cursor-not-allowed text-muted-foreground" 
                : "bg-secondary-neon hover:bg-secondary-neon/90"
          }`}
          disabled={claimedToday}
        >
          {claimedToday ? (
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Claimed Today</span>
          ) : (
            `Claim +${10 * loginStreak} XP`
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoginStreakCard;