"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { getGraduationData } from '@/utils/time';
import { User } from 'lucide-react';

const ProfileWidget = () => {
  const { user, userPreferences, loading } = useAuth();

  if (loading) {
    return (
      <Card className="w-full max-w-xs bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardContent className="p-4 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse"></div>
          <div className="h-4 w-3/4 bg-muted mt-3 animate-pulse"></div>
          <div className="h-3 w-1/2 bg-muted mt-1 animate-pulse"></div>
          <div className="h-2 w-full bg-muted mt-4 animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (!user || !userPreferences) {
    return null; // Or a placeholder for logged out state
  }

  const userCreationDate = user.$createdAt;
  const userYearOfStudy = userPreferences.yearOfStudy;

  if (!userCreationDate || !userYearOfStudy) return null;

  const graduationInfo = getGraduationData(userCreationDate, userYearOfStudy);
  const targetLevel = 25; // Example target level
  const currentLevel = userPreferences.level || 1;

  const levelsToGo = targetLevel - currentLevel;
  const daysRemaining = graduationInfo.remainingDays;

  return (
    <Card className="w-full max-w-xs bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <Avatar className="h-16 w-16 mb-3 border-2 border-primary-neon">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userPreferences.name}`} alt={userPreferences.name} />
          <AvatarFallback><User className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-semibold text-foreground">{userPreferences.name}</h3>
        <p className="text-sm text-muted-foreground">{userPreferences.collegeName || 'College Student'}</p>

        <div className="w-full mt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Level {currentLevel}</span>
            <span>{targetLevel}</span>
          </div>
          <Progress value={(currentLevel / targetLevel) * 100} className="h-2 bg-muted" />
        </div>

        <div className="w-full mt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Graduation Progress</span>
            <span>{graduationInfo.progress.toFixed(1)}%</span>
          </div>
          <Progress value={graduationInfo.progress} className="h-2 bg-muted" />
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          {levelsToGo > 0 ? (
            <p>{levelsToGo} levels to go!</p>
          ) : (
            <p>Max level reached!</p>
          )}
          <p>{daysRemaining > 0 ? `${daysRemaining} days until graduation` : 'Graduated!'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileWidget;