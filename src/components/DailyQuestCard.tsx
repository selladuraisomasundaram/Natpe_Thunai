"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollText, Loader2, CheckCircle, Gift, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { isToday } from "date-fns";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";

// --- EXPANDED QUEST POOL ---
const QUEST_POOL = [
  {
    id: "quest_list_items",
    title: "Market Mogul",
    description: "List 1 item on The Exchange.",
    target: 1,
    xpReward: 50,
    type: "itemsListed", 
  },
  {
    id: "quest_login_streak",
    title: "Consistent Earner",
    description: "Log in today.",
    target: 1,
    xpReward: 30,
    type: "loginStreak", 
  },
  {
    id: "quest_complete_profile",
    title: "Identity Verified",
    description: "Complete your profile details.",
    target: 1, 
    xpReward: 100,
    type: "profileCompleted",
  },
  {
    id: "quest_check_wallet",
    title: "Financial Check",
    description: "Visit your Wallet page.",
    target: 1,
    xpReward: 20,
    type: "walletVisit", // Requires tracking logic in WalletPage
  },
  {
    id: "quest_view_services",
    title: "Window Shopper",
    description: "Browse the Services tab.",
    target: 1,
    xpReward: 20,
    type: "servicesVisit",
  }
];

// --- HELPER: GET ROTATING QUESTS ---
// Selects 3 quests based on the day of the year so everyone gets the same daily set
const getDailyQuests = () => {
  const today = new Date();
  const seed = today.getDate() + today.getMonth(); // Simple seed
  
  // Create a rotated copy of the pool
  const rotatedPool = [...QUEST_POOL];
  for(let i = 0; i < seed; i++) {
      rotatedPool.push(rotatedPool.shift()!);
  }
  
  // Return first 3
  return rotatedPool.slice(0, 3);
};

const DailyQuestCard = () => {
  const [isQuestDialogOpen, setIsQuestDialogOpen] = useState(false);
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);
  const { userProfile, addXp } = useAuth();

  // Memoize daily quests to prevent re-render flickers
  const dailyQuests = useMemo(() => getDailyQuests(), []);

  // --- Helper: Safely Parse Claimed Data ---
  const getClaimedQuestsMap = () => {
    if (!userProfile) return {};
    const profile = userProfile as any;
    
    // Strict parsing to handle Appwrite JSON strings
    let data = profile.claimedQuests;
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (e) {
            return {};
        }
    }
    return data || {};
  };

  // --- Helper: Check Status ---
  const isQuestClaimed = (questId: string): boolean => {
    const claimedMap = getClaimedQuestsMap();
    const claimedDateStr = claimedMap[questId];
    
    if (!claimedDateStr) return false;
    return isToday(new Date(claimedDateStr));
  };

  const getQuestProgress = (quest: typeof QUEST_POOL[0]): number => {
    if (!userProfile) return 0;
    const profile = userProfile as any;

    // Custom Logic per Quest Type
    if (quest.type === "itemsListed") return profile.itemsListedToday ?? 0;
    if (quest.type === "loginStreak") return 1; // Assuming if they are seeing this, they logged in
    if (quest.type === "profileCompleted") return (profile.mobileNumber && profile.upiId) ? 1 : 0;
    if (quest.type === "walletVisit" || quest.type === "servicesVisit") return 1; // Simplify for demo
    
    return 0;
  };

  // --- Calc Completed Count ---
  const completedQuestsCount = dailyQuests.filter(q => {
    const claimed = isQuestClaimed(q.id);
    const progress = getQuestProgress(q);
    return claimed || progress >= q.target; 
  }).length;

  const handleClaimReward = async (quest: typeof QUEST_POOL[0]) => {
    if (!userProfile || !userProfile.$id) return;

    setClaimingQuestId(quest.id);
    try {
      const currentMap = getClaimedQuestsMap();
      
      // Update Map
      const updatedMap = {
        ...currentMap,
        [quest.id]: new Date().toISOString()
      };

      // 1. DB Update
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        userProfile.$id,
        {
            claimedQuests: JSON.stringify(updatedMap)
        }
      );

      // 2. XP Update (Local + DB)
      if (addXp) {
        await addXp(quest.xpReward);
        toast.success(`Claimed +${quest.xpReward} XP!`);
      }

      // 3. Force Local Refresh (Optional hack if Context is slow)
      // userProfile.claimedQuests = JSON.stringify(updatedMap); 

    } catch (error: any) {
      console.error("Claim Error:", error);
      toast.error("Claim failed. Please retry.");
    } finally {
      setClaimingQuestId(null);
    }
  };

  return (
    <>
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-secondary-neon" /> Daily Quests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex flex-col items-start">
          <p className="text-sm text-muted-foreground mb-3">
            Completed <span className="font-bold text-secondary-neon">{completedQuestsCount}/{dailyQuests.length}</span> today.
          </p>
          <Button onClick={() => setIsQuestDialogOpen(true)} className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            View Today's Quests
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isQuestDialogOpen} onOpenChange={setIsQuestDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Gift className="h-5 w-5 text-secondary-neon" /> Daily Rewards
            </DialogTitle>
            <DialogDescription>
              New quests refresh every day at midnight.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {dailyQuests.map((quest) => {
              const isClaimed = isQuestClaimed(quest.id);
              const progress = getQuestProgress(quest);
              const isCompleted = progress >= quest.target;
              const canClaim = isCompleted && !isClaimed;

              return (
                <div key={quest.id} className={`p-3 border rounded-lg flex flex-col gap-3 transition-colors ${isClaimed ? 'bg-secondary/5 border-border/50' : 'bg-card border-border'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-semibold text-sm ${isClaimed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {quest.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">{quest.description}</p>
                    </div>
                    <Badge variant="outline" className="text-secondary-neon border-secondary-neon/30">
                        +{quest.xpReward} XP
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-secondary/20 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${isClaimed ? 'bg-green-500' : 'bg-secondary-neon'}`}
                      style={{ width: `${Math.min(100, (progress / quest.target) * 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {isClaimed ? "Completed" : `${Math.min(progress, quest.target)} / ${quest.target}`}
                    </span>

                    {isClaimed ? (
                      <Button variant="ghost" size="sm" disabled className="h-7 text-xs text-green-500 font-bold hover:text-green-600 hover:bg-green-500/10">
                        <CheckCircle className="mr-1 h-3 w-3" /> Claimed
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleClaimReward(quest)} 
                        disabled={!canClaim || claimingQuestId === quest.id}
                        size="sm"
                        className={`h-7 text-xs px-4 font-bold transition-all ${
                            canClaim 
                            ? 'bg-secondary-neon hover:bg-secondary-neon/90 text-primary-foreground shadow-sm' 
                            : 'bg-muted text-muted-foreground opacity-70'
                        }`}
                      >
                        {claimingQuestId === quest.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : canClaim ? (
                          "Claim Reward"
                        ) : (
                          <><Lock className="mr-1 h-3 w-3" /> Locked</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end">
             <Button variant="outline" onClick={() => setIsQuestDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DailyQuestCard;