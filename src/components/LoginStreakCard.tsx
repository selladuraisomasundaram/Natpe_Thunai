"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Use addXp
import toast from 'react-hot-toast'; // Ensure toast is imported
import { format, isToday, parseISO } from 'date-fns';

const LoginStreakCard = () => {
  const { user, userPreferences, addXp, updateUserPreferences } = useAuth(); // Use addXp and updateUserPreferences
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedToday, setClaimedToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    if (userPreferences) {
      const lastClaimDate = userPreferences.lastLoginStreakClaim;
      const today = new Date();

      if (lastClaimDate && isToday(parseISO(lastClaimDate))) {
        setClaimedToday(true);
      } else {
        setClaimedToday(false);
      }

      // Calculate streak (simplified for example)
      // In a real app, you'd store streak count and last login date
      // For now, we'll just use a placeholder or a simple logic
      setCurrentStreak(userPreferences.level || 0); // Using level as a proxy for streak for now
    }
  }, [userPreferences]);

  const handleClaimReward = async () => {
    if (!user || !userPreferences) {
      toast.error("Please log in to claim rewards.");
      return;
    }
    if (claimedToday) {
      toast.info("You've already claimed your streak reward today!");
      return;
    }

    setIsClaiming(true);
    try {
      await addXp(5 * (currentStreak + 1)); // Example: 5 XP per streak day
      await updateUserPreferences({ lastLoginStreakClaim: format(new Date(), 'yyyy-MM-dd') });
      setClaimedToday(true);
      toast.success(`Claimed ${5 * (currentStreak + 1)} XP for your login streak!`);
    } catch (error) {
      console.error("Failed to claim streak reward:", error);
      toast.error("Failed to claim reward.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Login Streak</CardTitle>
        <Flame className="h-6 w-6 text-orange-500" />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Maintain your login streak to earn bonus XP!
        </p>
        <div className="text-center">
          <span className="text-4xl font-bold text-primary-neon">{currentStreak}</span>
          <span className="text-lg text-muted-foreground ml-2">Day Streak</span>
        </div>
        {claimedToday ? (
          <div className="flex items-center justify-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Reward claimed for today!</span>
          </div>
        ) : (
          <Button
            onClick={handleClaimReward}
            disabled={isClaiming || !user}
            className="w-full bg-primary-neon text-primary-foreground hover:bg-primary-neon/90"
          >
            {isClaiming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : (
              `Claim ${5 * (currentStreak + 1)} XP`
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default LoginStreakCard;