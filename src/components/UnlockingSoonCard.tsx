"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator"; // Ensure you have this or standard <hr>
import { 
  Lock, 
  ShoppingBag, 
  Swords, 
  Map, 
  Store, 
  Terminal,
  ShieldAlert,
  Cpu,
  Wifi,
  Database,
  ScanLine
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- TYPES ---
interface FeatureDetail {
  name: string;
  icon: React.ElementType;
  popupTitle: string;
  popupContent: string;
  category: string;
  securityLevel: string; // New visual stat
  status: string;        // New visual stat
}

// --- DATA ---
const upcomingFeaturesDetails: FeatureDetail[] = [
  {
    name: "Campus Drops",
    icon: ShoppingBag,
    category: "Retail",
    securityLevel: "Level 3",
    status: "Encrypted",
    popupTitle: "The Gatekeeper of Cool.",
    popupContent:
      "Ever seen a limited-edition merch drop sell out in seconds online? Now, imagine that speed, but exclusively for your campus network. We are curating limited-time collaborations with your favorite streetwear, tech, and lifestyle brands that never hit general retail shelves. These aren't just discounts; they are access events. The Catch? It’s locked for outsiders.",
  },
  {
    name: "Skill Wars",
    icon: Swords,
    category: "Competition",
    securityLevel: "Level 5",
    status: "Restricted",
    popupTitle: "Talk is Cheap. Show Your Work.",
    popupContent:
      "Tired of working for 'exposure'? It’s time to enter the arena. Skill Wars turns boring assignments into high-stakes battlegrounds. We are lining up local startups and major brands to drop real-world challenges right here. You compete head-to-head against peers on your campus and beyond. The best entry doesn't just get a pat on the back; they win the cash pot and instant portfolio glory.",
  },
  {
    name: "Travel Hacking",
    icon: Map,
    category: "Logistics",
    securityLevel: "Level 2",
    status: "Offline",
    popupTitle: "Your Weekend Cheat Code.",
    popupContent:
      "Every Friday, the great migration home begins. Why are you still paying full price for the privilege of sitting in traffic? We are building the ultimate student travel command center. We’re developing exclusive cashback layers, 'squad booking' hacks for cheaper group rates, and rewards just for securing that bus or train seat you were going to buy anyway.",
  },
  {
    name: "The Vault",
    icon: Terminal,
    category: "Earning",
    securityLevel: "Level 9",
    status: "Classified",
    popupTitle: "Micro-Missions. Macro Rewards.",
    popupContent:
      "Forget those spammy 20-minute surveys that disqualify you at the last second. The Vault is built different. We are securing direct partnerships with cutting-edge AI companies for high-value 'Micro-Missions.' Think training a next-gen voice AI using your local dialect. Quick, genuine tasks with real payouts. Access is currently restricted.",
  },
  {
    name: "Merchant Connect",
    icon: Store,
    category: "Hyperlocal",
    securityLevel: "Level 1",
    status: "Pending",
    popupTitle: "Your Campus, Connected.",
    popupContent:
      "Imagine your favorite local shops and eateries, right at your fingertips. Merchant Connect is bringing nearby businesses directly into your campus ecosystem. Merchants will gain a special role, allowing them to create exclusive listings in the Exchange tab—think unique student deals or campus-specific services. Get ready for a whole new level of campus convenience!",
  },
];

// --- COMPONENTS ---

// 1. Stat Component (Replaces Emojis)
const StatBadge = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="flex items-center gap-3 bg-muted/40 p-2 rounded-lg border border-border/50">
        <div className="p-2 bg-background rounded-md shadow-sm">
            <Icon className="h-4 w-4 text-secondary-neon" />
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{label}</span>
            <span className="text-xs font-bold text-foreground">{value}</span>
        </div>
    </div>
);

const UnlockingSoonCard = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetail | null>(null);

  const handleFeatureClick = (feature: FeatureDetail) => {
    setSelectedFeature(feature);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm shadow-lg border border-secondary-neon/20 overflow-hidden relative group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary-neon/50 to-transparent opacity-50" />
        
        <CardHeader className="p-5 pb-4">
          <CardTitle className="text-xl font-black uppercase tracking-tight text-card-foreground flex items-center gap-3">
            <div className="p-2 bg-secondary-neon/10 rounded-lg border border-secondary-neon/20">
                <ShieldAlert className="h-5 w-5 text-secondary-neon" /> 
            </div>
            <div className="flex flex-col">
                <span>Restricted Zones</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest font-mono">
                    Clearance Pending...
                </span>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5 pt-0 space-y-4">
          
          {/* --- 2x2 GRID --- */}
          <div className="grid grid-cols-2 gap-3">
            {upcomingFeaturesDetails.slice(0, 4).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleFeatureClick(feature)}
                  className="relative flex flex-col justify-between p-3 h-28 rounded-xl border border-secondary-neon/10 bg-background/60 hover:bg-secondary-neon/5 hover:border-secondary-neon/40 transition-all duration-300 group/btn text-left overflow-hidden"
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="h-8 w-8 rounded-lg bg-muted/80 flex items-center justify-center group-hover/btn:bg-secondary-neon/20 transition-colors">
                        <Icon className="h-4 w-4 text-muted-foreground group-hover/btn:text-secondary-neon" />
                    </div>
                    <Lock className="h-3 w-3 text-muted-foreground/30 group-hover/btn:text-secondary-neon/50" />
                  </div>
                  
                  <div className="space-y-1 z-10">
                      <p className="text-sm font-bold text-foreground leading-tight group-hover/btn:text-secondary-neon transition-colors">
                        {feature.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                        {feature.category}
                      </p>
                  </div>

                  {/* Decorative Scanline */}
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-secondary-neon/0 group-hover/btn:bg-secondary-neon/50 transition-all duration-500" />
                </button>
              );
            })}
          </div>

          {/* --- CENTERED 5th ITEM --- */}
          {upcomingFeaturesDetails.length > 4 && (
             <div className="flex justify-center">
                <button
                  onClick={() => handleFeatureClick(upcomingFeaturesDetails[4])}
                  className="relative w-full flex items-center gap-4 p-4 rounded-xl border border-secondary-neon/10 bg-background/60 hover:bg-secondary-neon/5 hover:border-secondary-neon/40 transition-all duration-300 group/btn text-left"
                >
                   <div className="h-10 w-10 shrink-0 rounded-lg bg-muted/80 flex items-center justify-center group-hover/btn:bg-secondary-neon/20 transition-colors">
                        <Store className="h-5 w-5 text-muted-foreground group-hover/btn:text-secondary-neon" />
                   </div>
                   <div className="flex-1">
                        <p className="text-sm font-bold text-foreground group-hover/btn:text-secondary-neon">
                            {upcomingFeaturesDetails[4].name}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                            {upcomingFeaturesDetails[4].category}
                        </p>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1 bg-secondary-neon/5 rounded-full border border-secondary-neon/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-secondary-neon animate-pulse" />
                        <span className="text-[9px] font-bold text-secondary-neon uppercase">Locked</span>
                   </div>
                </button>
             </div>
          )}

        </CardContent>
      </Card>

      {/* --- MISSION BRIEFING DIALOG --- */}
      {selectedFeature && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[90%] max-w-[400px] rounded-2xl bg-card border-secondary-neon/20 shadow-2xl p-0 overflow-hidden font-sans">
            
            {/* Header Band */}
            <div className="bg-secondary-neon/5 border-b border-secondary-neon/10 p-6 pt-8 flex flex-col items-center justify-center text-center space-y-3 relative">
                <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="border-red-500/30 text-red-500 text-[10px] font-black uppercase bg-red-500/5 px-2 py-0.5 tracking-widest">
                        Classified
                    </Badge>
                </div>
                
                <div className="h-14 w-14 rounded-2xl bg-background border border-secondary-neon/30 flex items-center justify-center shadow-lg shadow-secondary-neon/10">
                    <selectedFeature.icon className="h-7 w-7 text-secondary-neon" />
                </div>
                
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-foreground">
                        {selectedFeature.name}
                    </DialogTitle>
                    <p className="text-xs font-bold text-secondary-neon uppercase tracking-[0.2em]">
                        Code: {selectedFeature.category}
                    </p>
                </DialogHeader>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-5">
                
                {/* Stats Grid (Replacing Emojis) */}
                <div className="grid grid-cols-2 gap-3">
                    <StatBadge icon={Cpu} label="Security" value={selectedFeature.securityLevel} />
                    <StatBadge icon={Wifi} label="Status" value={selectedFeature.status} />
                </div>

                {/* Description Box */}
                <div>
                    <h4 className="text-sm font-black text-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
                        <ScanLine className="h-4 w-4 text-secondary-neon" /> Mission Intel
                    </h4>
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/50 shadow-inner">
                        <p className="text-sm font-bold italic text-foreground/80 mb-3 border-l-2 border-secondary-neon pl-3">
                            "{selectedFeature.popupTitle}"
                        </p>
                        <DialogDescription className="text-sm text-muted-foreground leading-relaxed text-justify">
                            {selectedFeature.popupContent}
                        </DialogDescription>
                    </div>
                </div>

                {/* Footer Status */}
                <div className="flex items-center justify-center gap-2 py-2 bg-background/50 rounded-lg border border-dashed border-border/60">
                    <Database className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-mono uppercase">
                        Awaiting Global Release
                    </span>
                </div>
            </div>

            <DialogFooter className="p-4 bg-muted/10 border-t border-border/30">
                <Button onClick={() => setIsDialogOpen(false)} className="w-full h-12 bg-foreground text-background hover:bg-secondary-neon hover:text-foreground font-black text-sm uppercase tracking-widest shadow-lg">
                    Acknowledge
                </Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default UnlockingSoonCard;