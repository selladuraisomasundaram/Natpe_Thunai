"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, AlertTriangle, Download, Rocket, Calendar, Trophy, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const GraduationMeter: React.FC = () => {
  const { user, userProfile, isLoading: isAuthLoading, addXp } = useAuth();
  
  const protocolNotificationShown = useRef(false);
  
  // --- LOGIC: The "May Rule" Calculation ---
  const calculateGraduationState = () => {
    if (!user?.$createdAt) return null;

    const now = new Date();
    // Use profile graduation date if available, otherwise calculate based on standard 4-year cycle ending in May
    let targetDate: Date;

    if ((userProfile as any)?.graduationDate) {
      targetDate = new Date((userProfile as any).graduationDate);
    } else {
      // Fallback Logic: Standard 4 years, ending in May
      const created = new Date(user.$createdAt);
      targetDate = new Date(created);
      targetDate.setFullYear(targetDate.getFullYear() + 4);
      targetDate.setMonth(4); // May (Index 4)
      targetDate.setDate(31); // End of Month
    }

    // Determine total duration (Start of college to Graduation)
    // We estimate start date based on grad date - 4 years
    const estimatedStartDate = new Date(targetDate);
    estimatedStartDate.setFullYear(estimatedStartDate.getFullYear() - 4);

    const totalDuration = targetDate.getTime() - estimatedStartDate.getTime();
    const elapsed = now.getTime() - estimatedStartDate.getTime();
    let remaining = targetDate.getTime() - now.getTime();

    // Cap values
    if (remaining < 0) remaining = 0;
    const safeTotal = totalDuration > 0 ? totalDuration : 1;
    const percentage = Math.min(100, Math.max(0, (elapsed / safeTotal) * 100));

    // Time Unit Breakdown
    const msYear = 1000 * 60 * 60 * 24 * 365;
    const msMonth = 1000 * 60 * 60 * 24 * 30.44; // Avg days in month
    const msDay = 1000 * 60 * 60 * 24;
    const msHour = 1000 * 60 * 60;
    const msMinute = 1000 * 60;
    const msSecond = 1000;

    const years = Math.floor(remaining / msYear);
    remaining %= msYear;

    const months = Math.floor(remaining / msMonth);
    remaining %= msMonth;

    const days = Math.floor(remaining / msDay);
    remaining %= msDay;

    const hours = Math.floor(remaining / msHour);
    remaining %= msHour;

    const minutes = Math.floor(remaining / msMinute);
    remaining %= msMinute;

    const seconds = Math.floor(remaining / msSecond);

    return {
      progressPercentage: percentage,
      isGraduated: percentage >= 100,
      isFinalStretch: percentage >= 90,
      yearLabel: getYearLabel(percentage),
      countdown: { years, months, days, hours, minutes, seconds }
    };
  };

  // Helper to determine "Freshman", "Sophomore", etc. based on progress
  const getYearLabel = (percent: number) => {
    if (percent < 25) return { text: "Fresher (Year I)", color: "text-blue-400" };
    if (percent < 50) return { text: "Sophomore (Year II)", color: "text-green-400" };
    if (percent < 75) return { text: "Junior (Year III)", color: "text-yellow-400" };
    return { text: "Senior (Final Year)", color: "text-red-400" };
  };

  const [graduationData, setGraduationData] = useState(() => calculateGraduationState());

  // Ticker Effect
  useEffect(() => {
    if (!user) return;
    setGraduationData(calculateGraduationState());
    const interval = setInterval(() => {
      setGraduationData(calculateGraduationState());
    }, 1000);
    return () => clearInterval(interval);
  }, [user, userProfile]);

  if (isAuthLoading || !userProfile || userProfile.role === "developer" || userProfile.userType === "staff" || !graduationData) {
    return null;
  }

  const { progressPercentage, isGraduated, yearLabel, countdown } = graduationData;

  // --- CIRCULAR PROGRESS SVG ---
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <Card className="bg-card text-card-foreground shadow-xl border-border overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-neon/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <CardHeader className="p-5 pb-2 border-b border-border/40">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-secondary-neon" /> 
            Academic Meter
          </CardTitle>
          <Badge variant="outline" className={cn("bg-background/50 backdrop-blur font-mono border-border", yearLabel.color)}>
            {yearLabel.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          
          {/* LEFT: Circular Progress */}
          <div className="relative flex items-center justify-center">
            {/* Outer Glow */}
            <div className="absolute inset-0 bg-secondary-neon/20 blur-xl rounded-full scale-90 animate-pulse-slow" />
            
            <svg width="140" height="140" className="transform -rotate-90">
              {/* Background Circle */}
              <circle
                cx="70" cy="70" r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-muted/20"
              />
              {/* Progress Circle */}
              <circle
                cx="70" cy="70" r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={cn("transition-all duration-1000 ease-out", isGraduated ? "text-red-500" : "text-secondary-neon")}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-foreground">{Math.floor(progressPercentage)}%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Complete</span>
            </div>
          </div>

          {/* RIGHT: Detailed Countdown */}
          <div className="flex-1 w-full space-y-4">
            
            {isGraduated ? (
              <div className="text-center md:text-left space-y-2">
                <h3 className="text-xl font-bold text-red-500 flex items-center gap-2 justify-center md:justify-start">
                  <AlertTriangle className="h-5 w-5" /> Protocol Active
                </h3>
                <p className="text-sm text-muted-foreground">Your academic journey here is complete. Account scheduled for archive.</p>
                <Button className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/50 mt-2">
                  <Download className="mr-2 h-4 w-4" /> Export Data
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <TimeUnit value={countdown.years} label="Years" />
                  <TimeUnit value={countdown.months} label="Months" />
                  <TimeUnit value={countdown.days} label="Days" />
                  <div className="flex flex-col bg-card border border-border rounded-lg p-2 shadow-sm">
                     <span className="text-lg font-mono font-bold text-secondary-neon animate-pulse">{countdown.hours}</span>
                     <span className="text-[9px] text-muted-foreground uppercase">Hours</span>
                  </div>
                </div>

                {/* Micro Details */}
                <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                   <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Target: May 20{new Date().getFullYear() + countdown.years + (countdown.months > 5 ? 1 : 0)}</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-yellow-500" />
                      <span>Lvl {userProfile.level}</span>
                   </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                    <span>Start</span>
                    <span>Goal</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 via-secondary-neon to-purple-500 transition-all duration-1000" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper for Time Units
const TimeUnit = ({ value, label }: { value: number, label: string }) => (
  <div className="flex flex-col bg-card border border-border rounded-lg p-2 shadow-sm">
    <span className="text-xl font-black text-foreground">{value}</span>
    <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</span>
  </div>
);

export default GraduationMeter;