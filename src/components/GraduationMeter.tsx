"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap } from "lucide-react";

const GraduationMeter: React.FC = () => {
  const { user, userProfile, isLoading: isAuthLoading, addXp } = useAuth(); // Updated destructuring
  const userCreationDate = user?.$createdAt;

  // Placeholder for XP calculation and graduation progress
  const currentXp = userProfile?.xp || 0;
  const xpToGraduate = 1000; // Example target XP
  const progressPercentage = (currentXp / xpToGraduate) * 100;

  // Simulate XP gain for demonstration
  const handleGainXp = () => {
    addXp(10); // Add 10 XP
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-secondary-neon" /> Graduation Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {isAuthLoading ? (
          <p className="text-muted-foreground">Loading user data...</p>
        ) : user ? (
          <>
            <p className="text-sm text-muted-foreground">
              Current XP: <span className="font-medium text-foreground">{currentXp} / {xpToGraduate}</span>
            </p>
            <Progress value={progressPercentage} className="w-full" />
            <p className="text-xs text-muted-foreground">
              Keep using the app to earn more XP and reach graduation!
            </p>
            {/* <Button onClick={handleGainXp} className="mt-2">Gain 10 XP (Demo)</Button> */}
          </>
        ) : (
          <p className="text-muted-foreground">Log in to track your graduation progress.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default GraduationMeter;