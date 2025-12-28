"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; // Ensure toast is imported
import { format } from 'date-fns';

const DailyQuestCard = () => {
  const [isClaiming, setIsClaiming] = useState(false);
  const { user, userPreferences, addXp, updateUserPreferences } = useAuth();
  const [questCompletedToday, setQuestCompletedToday] = useState(false);

  useEffect(() => {
    if (userPreferences?.dailyQuestCompleted) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const lastCompletionDate = userPreferences.dailyQuestCompleted; // This is now a string
      if (lastCompletionDate === today) {
        setQuestCompletedToday(true);
      } else {
        // If it's a new day, reset the quest status
        setQuestCompletedToday(false);
        // Optionally, update the preference in Appwrite to reflect it's not completed for today
        // This would require a separate function or a more complex update logic in AuthContext
      }
    } else {
      setQuestCompletedToday(false); // No completion date means not completed
    }
  }, [userPreferences?.dailyQuestCompleted]);

  const handleClaimReward = async () => {
    if (!user || !userPreferences) {
      toast.error("Please log in to claim rewards.");
      return;
    }
    if (questCompletedToday) {
      toast.info("You've already completed today's quest!");
      return;
    }

    setIsClaiming(true);
    try {
      // Simulate quest completion (e.g., user performed an action)
      // For this example, we'll just directly claim the reward
      await addXp(10); // Add 10 XP for completing the daily quest
      await updateUserPreferences({ dailyQuestCompleted: format(new Date(), 'yyyy-MM-dd') }); // Mark quest as completed for today
      setQuestCompletedToday(true);
      toast.success("Daily quest reward claimed!");
    } catch (error) {
      console.error("Failed to claim daily quest reward:", error);
      toast.error("Failed to claim reward.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Daily Quest</CardTitle>
        <Award className="h-6 w-6 text-yellow-500" />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Complete a simple task to earn daily XP!
        </p>
        {questCompletedToday ? (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Quest completed for today!</span>
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
              'Claim 10 XP'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyQuestCard;