"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import ProfileWidget from "@/components/ProfileWidget";
import QuickUpdatesBar from "@/components/QuickUpdatesBar";
import CanteenManagerWidget from "@/components/CanteenManagerWidget";
// import DiscoveryFeed from "@/components/DiscoveryFeed"; // Commented out for logic polish
import DailyQuestCard from "@/components/DailyQuestCard";
import LoginStreakCard from "@/components/LoginStreakCard";
import AnalyticsCard from "@/components/AnalyticsCard"; 
import { cn } from "@/lib/utils";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24 relative overflow-x-hidden">
      
      {/* Hub Header */}
      <div className="max-w-md mx-auto mb-8 text-center">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase">
          THE <span className="text-secondary-neon">HUB</span>
        </h1>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-60">
          Campus Command Center
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* Identity & Status */}
        <ProfileWidget />

        <QuickUpdatesBar />
        
        {/* Performance Tracking */}
        <AnalyticsCard />

        {/* Business Tools */}
        <CanteenManagerWidget />

        {/* DISCOVERY FEED: 
          Logic currently under maintenance. 
          Uncomment the line below to re-enable.
        */}
        {/* <DiscoveryFeed /> */}

        {/* Gamification & Rewards */}
        <div className="grid grid-cols-2 gap-4">
          <DailyQuestCard />
          <LoginStreakCard />
        </div>
      </div>

      <MadeWithDyad />
    </div>
  );
};

export default HomePage;