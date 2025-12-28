"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getGraduationData, formatTimeRemaining } from '@/utils/time';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const GraduationMeter = () => {
  const { user, userPreferences, loading } = useAuth();

  if (loading) {
    return (
      <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            Graduation Meter
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-4 space-y-5 flex flex-col items-center text-center">
          <p className="text-muted-foreground">Loading graduation data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user || !user.$createdAt || !userPreferences || !userPreferences.yearOfStudy) {
    return (
      <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            Graduation Meter
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-4 space-y-5 flex flex-col items-center text-center">
          <div className="text-center text-muted-foreground bg-muted/10 p-4 rounded-lg w-full">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p>Please log in or complete your profile to see your graduation meter.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { graduationDate, remainingDays, progress, isGraduated } = getGraduationData(user.$createdAt, userPreferences.yearOfStudy);

  return (
    <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-foreground">
          Graduation Meter
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-4 space-y-5 flex flex-col items-center text-center">
        {isGraduated ? (
          <div className="text-center text-green-700 bg-green-100 p-4 rounded-lg w-full">
            <CheckCircle className="h-8 w-8 mx-auto mb-3 text-green-600" />
            <p className="text-lg font-semibold">Congratulations! You've graduated!</p>
            <p className="text-sm text-green-800">Your journey has been successfully completed.</p>
          </div>
        ) : (
          <>
            <div className="w-full">
              <Progress value={progress} className="h-3 bg-muted" />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{progress.toFixed(1)}% Complete</span>
                <span>{formatTimeRemaining(remainingDays)} Left</span>
              </div>
            </div>
            <div className="text-lg font-medium text-foreground">
              Estimated Graduation: {graduationDate}
            </div>
            <p className="text-sm text-muted-foreground">
              Based on your {userPreferences.yearOfStudy === 'I' ? 'first' : userPreferences.yearOfStudy === 'II' ? 'second' : userPreferences.yearOfStudy === 'III' ? 'third' : userPreferences.yearOfStudy === 'IV' ? 'fourth' : userPreferences.yearOfStudy === 'V' ? 'fifth' : 'selected'} year of study.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GraduationMeter;