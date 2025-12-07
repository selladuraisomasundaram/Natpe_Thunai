"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { User, DollarSign, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import { calculateCommissionRate, formatCommissionRate } from "@/utils/commission";
import { getLevelBadge } from "@/utils/badges";
import { getGraduationData } from "@/utils/time"; // NEW: Import getGraduationData

const ProfileWidget = () => {
  const { user, userProfile } = useAuth();

  const displayName = user?.name || "CampusExplorer";
  
  const userLevel = userProfile?.level ?? 1;
  const currentXp = userProfile?.currentXp ?? 0;
  const maxXp = userProfile?.maxXp ?? 100;
  const xpPercentage = (currentXp / maxXp) * 100;
  
  const commissionRate = calculateCommissionRate(userLevel);
  const userBadge = getLevelBadge(userLevel);

  const avatarUrl = generateAvatarUrl(
    displayName,
    userProfile?.gender || "prefer-not-to-say",
    userProfile?.userType || "student"
  );

  const renderMotivationalMessage = () => {
    if (userProfile?.userType !== "student" || userProfile?.role === "developer") {
      return null; // Only for students, not developers
    }

    const userCreationDate = user?.$createdAt;
    if (!userCreationDate) return null;

    const graduationInfo = getGraduationData(userCreationDate);
    const targetLevel = 25;

    if (graduationInfo.isGraduated) {
      return (
        <p className="text-sm text-muted-foreground mt-2">
          You've completed your journey! We hope you gained valuable skills and connections.
        </p>
      );
    }

    if (userProfile.level >= targetLevel) {
      return (
        <p className="text-sm text-green-500 mt-2 font-semibold">
          Congratulations! You've reached Level {targetLevel} and achieved the lowest commission rate. Keep up the great work!
        </p>
      );
    }

    const levelsToGo = targetLevel - userProfile.level;
    const daysRemaining = graduationInfo.countdown.days;

    let message = `Aim for Level ${targetLevel} to unlock the lowest commission rate!`;
    if (levelsToGo > 0 && daysRemaining > 0) {
      message += ` You have ${daysRemaining} days left before graduation.`;
      if (levelsToGo > 5) { // More than 5 levels to go
        message += ` Keep learning new skills and engaging with the community to reach your goal!`;
      } else { // 1-5 levels to go
        message += ` You're close! Focus on learning new skills and actively participating to reach Level ${targetLevel}.`;
      }
    } else if (levelsToGo > 0) { // No days remaining, but not graduated yet (shouldn't happen with 4-year logic, but as a fallback)
       message += ` Time is running out! Focus on learning new skills to reach Level ${targetLevel}.`;
    }

    return (
      <p className="text-sm text-muted-foreground mt-2">
        {message}
      </p>
    );
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardContent className="p-4 flex items-center space-x-4">
        <Avatar className="h-16 w-16 border-2 border-secondary-neon">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow space-y-1">
          <h3 className="text-xl font-bold text-foreground">{displayName}</h3>
          <p className="text-sm text-muted-foreground">Level {userLevel}</p>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={xpPercentage} className="h-2 bg-muted-foreground/30 [&::-webkit-progress-bar]:bg-secondary-neon [&::-webkit-progress-value]:bg-secondary-neon" />
            <span className="text-xs text-muted-foreground">{currentXp}/{maxXp} XP</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground pt-1">
            <DollarSign className="h-3 w-3 mr-1 text-secondary-neon" />
            Commission Rate: <span className="font-semibold text-foreground ml-1">{formatCommissionRate(commissionRate)}</span>
          </div>
          {userBadge && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Award className="h-3 w-3 mr-1 text-secondary-neon" />
              Badge: <span className="font-semibold text-foreground ml-1">{userBadge}</span>
            </div>
          )}
          {renderMotivationalMessage()}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileWidget;