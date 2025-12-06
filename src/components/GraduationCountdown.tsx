"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, GraduationCap, MessageSquareText } from "lucide-react"; // Added MessageSquareText
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID } from "@/lib/appwrite"; // NEW: Import Appwrite services
import { ID } from 'appwrite'; // NEW: Import ID
import { toast } from "sonner"; // NEW: Import toast

const FOUR_YEARS_IN_MS = 4 * 365.25 * 24 * 60 * 60 * 1000; // Account for leap years
const THREE_POINT_FIVE_YEARS_IN_MS = 3.5 * 365.25 * 24 * 60 * 60 * 1000;

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const GraduationCountdown: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isGraduationProtocolActive, setIsGraduationProtocolActive] = useState(false);
  const [isTenureOver, setIsTenureOver] = useState(false); // NEW: State to track if 4 years are over
  const [hasNotifiedDeveloper, setHasNotifiedDeveloper] = useState<boolean>(() => { // NEW: State for one-time notification
    if (typeof window !== 'undefined' && user?.$id) {
      return localStorage.getItem(`notified_dev_tenure_over_${user.$id}`) === 'true';
    }
    return false;
  });
  const intervalRef = useRef<number | null>(null);

  const sendDeveloperNotification = useCallback(async () => {
    if (!user || !userProfile || hasNotifiedDeveloper) return;

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          senderId: user.$id,
          senderName: user.name,
          message: `User ${user.name} (${userProfile.collegeName})'s 4-year period has ended. Please consider manual account deletion.`,
          isDeveloper: false, // Sent by a regular user
          collegeName: userProfile.collegeName,
        }
      );
      localStorage.setItem(`notified_dev_tenure_over_${user.$id}`, 'true');
      setHasNotifiedDeveloper(true);
      toast.info("Developer notified about your completed tenure.");
    } catch (error: any) {
      console.error("Error sending developer notification:", error);
      // Don't toast error to user, as it's a background task
    }
  }, [user, userProfile, hasNotifiedDeveloper]);


  const calculateTimeAndProgress = useCallback(() => {
    if (!user?.$createdAt) return;

    const accountCreationDate = new Date(user.$createdAt).getTime();
    const graduationDate = accountCreationDate + FOUR_YEARS_IN_MS;
    const now = Date.now();

    const remainingTime = graduationDate - now;
    const elapsedTime = now - accountCreationDate;

    if (remainingTime <= 0) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setProgressPercentage(100);
      setIsGraduationProtocolActive(true);
      setIsTenureOver(true); // NEW: Set tenure over
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // NEW: Send one-time notification to developer
      sendDeveloperNotification();
      return;
    }

    const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

    setTimeLeft({ days, hours, minutes, seconds });

    const progress = (elapsedTime / FOUR_YEARS_IN_MS) * 100;
    setProgressPercentage(Math.min(100, Math.max(0, progress))); // Clamp between 0 and 100

    setIsGraduationProtocolActive(elapsedTime >= THREE_POINT_FIVE_YEARS_IN_MS);
  }, [user?.$createdAt, sendDeveloperNotification]);

  useEffect(() => {
    calculateTimeAndProgress(); // Initial calculation

    intervalRef.current = window.setInterval(calculateTimeAndProgress, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [calculateTimeAndProgress]);

  // NEW: Exclude developers and staff from the countdown
  if (!user?.$createdAt || userProfile?.role === 'developer' || userProfile?.userType === 'staff') {
    return null;
  }

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-secondary-neon" /> Graduation Countdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {isTenureOver ? ( // NEW: Display message when tenure is over
          <div className="text-center space-y-3">
            <p className="text-xl font-bold text-foreground">Your 4-year tenure has ended!</p>
            <p className="text-md text-muted-foreground">
              Thank you for being a part of Natpe🤝Thunai. You can always join us again!
            </p>
            <MessageSquareText className="h-8 w-8 text-secondary-neon mx-auto" />
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Time until account deletion:</p>
              <div className="flex justify-center items-baseline space-x-2 font-mono text-2xl font-bold text-foreground">
                <span>{timeLeft.days}D</span>
                <span>{timeLeft.hours}H</span>
                <span>{timeLeft.minutes}M</span>
                <span>{timeLeft.seconds}S</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Account Created</span>
                <span>Graduation Protocol {isGraduationProtocolActive ? "Active" : "Inactive"}</span>
              </div>
              <Progress
                value={progressPercentage}
                className={cn(
                  "h-3",
                  isGraduationProtocolActive
                    ? "[&::-webkit-progress-bar]:bg-orange-500 [&::-webkit-progress-value]:bg-orange-500"
                    : "[&::-webkit-progress-bar]:bg-secondary-neon [&::-webkit-progress-value]:bg-secondary-neon"
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            {isGraduationProtocolActive && (
              <div className="text-center text-sm text-orange-500 font-semibold">
                Warning: Graduation Protocol is active! Your account will be deleted soon.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GraduationCountdown;