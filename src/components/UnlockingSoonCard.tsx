"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Lock, 
  ShoppingBag, 
  Swords, 
  Map, 
  Briefcase, 
  Store, 
  ChevronRight, 
  Terminal,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureDetail {
  name: string;
  icon: React.ElementType;
  popupTitle: string;
  popupContent: string;
  category: string;
}

const upcomingFeaturesDetails: FeatureDetail[] = [
  {
    name: "Campus Drops",
    icon: ShoppingBag,
    category: "Retail",
    popupTitle: "The Gatekeeper of Cool.",
    popupContent:
      "Ever seen a limited-edition merch drop sell out in seconds online? Now, imagine that speed, but exclusively for your campus network. We are curating limited-time collaborations with your favorite streetwear, tech, and lifestyle brands that never hit general retail shelves. These aren't just discounts; they are access events. The Catch? It’s locked for outsiders. Available only inside the gate, to verified students. If you aren't fast, you aren't getting it. Prepare your wallets.",
  },
  {
    name: "Skill Wars",
    icon: Swords,
    category: "Competition",
    popupTitle: "Talk is Cheap. Show Your Work.",
    popupContent:
      "Tired of working for 'exposure'? It’s time to enter the arena. Skill Wars turns boring assignments into high-stakes battlegrounds. We are lining up local startups and major brands to drop real-world challenges right here—from designing a cafe's new poster to cracking a piece of code. You compete head-to-head against peers on your campus and beyond. The best entry doesn't just get a pat on the back; they win the cash pot and instant portfolio glory. Sharpen your skills; the war is coming.",
  },
  {
    name: "Travel Hacking",
    icon: Map,
    category: "Logistics",
    popupTitle: "Your Weekend Cheat Code.",
    popupContent:
      "Every Friday, the great migration home begins. Why are you still paying full price for the privilege of sitting in traffic? We aren't just another booking site. We are building the ultimate student travel command center. We’re developing exclusive cashback layers, 'squad booking' hacks for cheaper group rates, and rewards just for securing that bus or train seat you were going to buy anyway. Stop traveling like a civilian. Unlock the hack for your weekend commute.",
  },
  {
    name: "The Vault (Beta)",
    icon: Terminal,
    category: "Earning",
    popupTitle: "Micro-Missions. Macro Rewards.",
    popupContent:
      "Forget those spammy 20-minute surveys that disqualify you at the last second. The Vault is built different. We are securing direct partnerships with cutting-edge AI companies and top-tier brands for high-value 'Micro-Missions.' Think training a next-gen voice AI using your local dialect, or getting paid to review an unreleased product prototype before it hits the market. These are quick, genuine tasks with real payouts. No fluff. Just straight value for your time. Access is currently restricted.",
  },
  {
    name: "Merchant Connect",
    icon: Store,
    category: "Hyperlocal",
    popupTitle: "Your Campus, Connected.",
    popupContent:
      "Imagine your favorite local shops and eateries, right at your fingertips. Merchant Connect is bringing nearby businesses directly into your campus ecosystem. Merchants will gain a special role, allowing them to create exclusive listings in the Exchange tab—think unique student deals or campus-specific services. Plus, they'll be able to post daily food offerings in the Food & Wellness tab, making it easier than ever to discover delicious meals and support local businesses. Get ready for a whole new level of campus convenience!",
  },
];

const UnlockingSoonCard = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetail | null>(null);

  const handleFeatureClick = (feature: FeatureDetail) => {
    setSelectedFeature(feature);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm shadow-[0_0_15px_rgba(0,243,255,0.05)] border border-secondary-neon/20 overflow-hidden relative group">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary-neon/50 to-transparent opacity-50" />
        
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-lg font-black uppercase tracking-tight text-card-foreground flex items-center gap-2">
            <div className="p-1.5 bg-secondary-neon/10 rounded-md">
                <Lock className="h-4 w-4 text-secondary-neon" /> 
            </div>
            <span>Restricted <span className="text-muted-foreground font-medium">Zones</span></span>
          </CardTitle>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest pl-1">
             Encrypted Sectors • Clearance Pending
          </p>
        </CardHeader>

        <CardContent className="p-5 pt-0 space-y-3">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingFeaturesDetails.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleFeatureClick(feature)}
                  className="relative flex items-center justify-between p-3 rounded-xl border border-secondary-neon/10 bg-background/40 hover:bg-secondary-neon/5 hover:border-secondary-neon/40 transition-all duration-300 group/btn w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover/btn:bg-secondary-neon/20 transition-colors">
                        <Icon className="h-4 w-4 text-muted-foreground group-hover/btn:text-secondary-neon" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground group-hover/btn:text-secondary-neon transition-colors">{feature.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{feature.category}</p>
                    </div>
                  </div>
                  <Lock className="h-3 w-3 text-muted-foreground/30 group-hover/btn:text-secondary-neon/50" />
                </button>
              );
            })}
          </div>

        </CardContent>
      </Card>

      {/* --- CLASSIFIED INTEL DIALOG --- */}
      {selectedFeature && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[450px] bg-card border-secondary-neon/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 overflow-hidden">
            
            {/* Dialog Header Band */}
            <div className="bg-secondary-neon/10 border-b border-secondary-neon/20 p-6 flex flex-col items-center justify-center text-center space-y-2 relative">
                <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="border-red-500/50 text-red-500 text-[10px] uppercase bg-red-500/5 px-2 py-0.5 flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> Locked
                    </Badge>
                </div>
                
                <div className="h-12 w-12 rounded-full bg-background border border-secondary-neon/30 flex items-center justify-center shadow-lg shadow-secondary-neon/10 mb-2">
                    <selectedFeature.icon className="h-6 w-6 text-secondary-neon" />
                </div>
                
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">
                        {selectedFeature.name}
                    </DialogTitle>
                    <p className="text-[10px] font-bold text-secondary-neon uppercase tracking-[0.2em]">
                        Project: {selectedFeature.category}
                    </p>
                </DialogHeader>
            </div>

            {/* Dialog Content Body */}
            <div className="p-6 space-y-4">
                <div>
                    <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-muted-foreground" /> Mission Brief
                    </h4>
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                        <p className="text-sm font-bold italic text-foreground/90 mb-3">
                            "{selectedFeature.popupTitle}"
                        </p>
                        <DialogDescription className="text-xs text-muted-foreground leading-relaxed text-justify">
                            {selectedFeature.popupContent}
                        </DialogDescription>
                    </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground bg-background/50 p-2 rounded-lg border border-border/30">
                    <span>Clearance Level: Student ID</span>
                    <span className="flex items-center gap-1 text-secondary-neon animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-secondary-neon" /> System Offline
                    </span>
                </div>
            </div>

            <DialogFooter className="p-4 bg-muted/10 border-t border-border/30">
                <Button onClick={() => setIsDialogOpen(false)} className="w-full bg-background border border-border hover:bg-muted text-foreground text-xs uppercase tracking-widest font-bold">
                    Close Intel
                </Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default UnlockingSoonCard;