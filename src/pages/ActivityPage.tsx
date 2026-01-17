"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Search, Radar, Banknote, Trophy } from "lucide-react";
import BargainRequestsWidget from "@/components/BargainRequestsWidget";
import UnlockingSoonCard from "@/components/UnlockingSoonCard";

const ActivityPage = () => {
  const navigate = useNavigate();

  const handleActivityClick = (path: string, activityName: string) => {
    toast.info(`Navigating to "${activityName}"...`);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">The Buzz</h1>
      
      <div className="max-w-md mx-auto space-y-4">
        
        {/* 1. ACTION REQUIRED: Bargain Requests (Top Priority) */}
        <BargainRequestsWidget />

        {/* 2. HIGH PRIORITY: Tracking (Full Width) */}
        <Card 
            className="bg-card p-4 rounded-xl shadow-md border border-secondary-neon/20 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]" 
            onClick={() => handleActivityClick("/activity/tracking", "Tracking")}
        >
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <Radar className="h-6 w-6 text-secondary-neon" /> Live Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-sm text-muted-foreground leading-snug">
                Monitor active orders, deliveries, and service status in real-time.
            </p>
          </CardContent>
        </Card>

        {/* 3. UTILITIES: Lost & Found + Cash Exchange (Side-by-Side Grid) */}
        <div className="grid grid-cols-2 gap-4">
            {/* Cash Exchange */}
            <Card 
                className="bg-card p-3 rounded-xl shadow-sm border border-border cursor-pointer hover:border-secondary-neon/50 transition-colors h-full" 
                onClick={() => handleActivityClick("/activity/cash-exchange", "Cash Exchange")}
            >
                <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
                    <Banknote className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="font-bold text-sm mb-1">Cash Exchange</h3>
                <p className="text-[10px] text-muted-foreground">Peer-to-peer cash assistance.</p>
            </Card>

            {/* Lost & Found */}
            <Card 
                className="bg-card p-3 rounded-xl shadow-sm border border-border cursor-pointer hover:border-secondary-neon/50 transition-colors h-full" 
                onClick={() => handleActivityClick("/activity/lost-found", "Lost & Found")}
            >
                <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center mb-3">
                    <Search className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-bold text-sm mb-1">Lost & Found</h3>
                <p className="text-[10px] text-muted-foreground">Find or report lost campus items.</p>
            </Card>
        </div>

        {/* 4. EVENTS: Tournaments */}
        <Card 
            className="bg-card p-4 rounded-xl shadow-md border border-border cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => handleActivityClick("/tournaments", "Tournament Updates")}
        >
          <div className="flex items-start gap-4">
             <div className="h-12 w-12 bg-yellow-500/10 rounded-full flex items-center justify-center shrink-0">
                <Trophy className="h-6 w-6 text-yellow-500" />
             </div>
             <div>
                <h3 className="font-bold text-base text-foreground">Tournament Updates</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    Esports dates, points tables, and winner announcements.
                </p>
             </div>
          </div>
        </Card>

        {/* 5. FUTURE FEATURES */}
        <UnlockingSoonCard />
        
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ActivityPage;