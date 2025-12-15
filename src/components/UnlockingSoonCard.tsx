"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

const upcomingFeatures = [
  "AI Bounties",
  "Campus Drops",
  "Skill Wars",
  "Travel Hacking",
];

const UnlockingSoonCard = () => {
  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <Lock className="h-5 w-5 text-secondary-neon" /> Unlocking Soon
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        <p className="text-sm text-muted-foreground">
          Exciting new features are on their way to enhance your campus experience!
        </p>
        <ul className="list-none space-y-1">
          {upcomingFeatures.map((feature, index) => (
            <li key={index} className="flex items-center text-foreground text-sm">
              <Lock className="h-4 w-4 mr-2 text-secondary-neon" /> {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default UnlockingSoonCard;