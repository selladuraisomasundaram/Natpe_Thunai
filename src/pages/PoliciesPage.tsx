"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, ScrollText, TrendingUp, Users, FileText, 
  AlertTriangle, HeartHandshake, Lock, Scale 
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { calculateCommissionRate } from "@/utils/commission"; 

// --- POLICY DATA ---
const policyContent = {
  // --- CATEGORY 1: THE ESSENTIALS (User Provided) ---
  safetyGuide: {
    title: "🛡️ The Natpe-Thunai Safety Guide",
    icon: ShieldCheck,
    badge: "Must Read",
    description: "Because friends don’t let friends get scammed. Essential rules for meeting up.",
    fullText: `
      <div class="space-y-6">
        <p class="text-lg font-medium text-secondary-neon italic text-center">“Because friends don’t let friends get scammed.”</p>
        
        <div class="bg-secondary/5 p-4 rounded-lg border border-secondary/20">
          <h3 class="text-md font-bold text-foreground flex items-center gap-2">1. The "Public Place" Rule 🏛️</h3>
          <p class="text-sm text-muted-foreground mt-1">Never meet a stranger in a hostel room or a deserted corridor. Always stick to the <strong>Canteen, the Library, or the Main Gate</strong>. If it’s after 6:00 PM, bring a friend along.</p>
        </div>

        <div class="bg-secondary/5 p-4 rounded-lg border border-secondary/20">
          <h3 class="text-md font-bold text-foreground flex items-center gap-2">2. The 4-Digit Handshake 🤝</h3>
          <p class="text-sm text-muted-foreground mt-1">Before you hand over your cycle or lab coat, ask the buyer for their <strong>Handshake Code</strong> (found in their app receipt). If they don't have it, don't hand it over. This is your proof that the deal is real.</p>
        </div>

        <div class="bg-secondary/5 p-4 rounded-lg border border-secondary/20">
          <h3 class="text-md font-bold text-foreground flex items-center gap-2">3. Inspect Before You Accept 🧐</h3>
          <p class="text-sm text-muted-foreground mt-1"><strong>Buyers:</strong> Once you meet, check the item thoroughly. Is the cycle chain rusty? Are the notes missing pages? Once you click "Confirm Receipt" in the app, the money is released from Escrow and we cannot get it back for you.</p>
        </div>

        <div class="bg-secondary/5 p-4 rounded-lg border border-secondary/20">
          <h3 class="text-md font-bold text-foreground flex items-center gap-2">4. Keep it on Natpe-Thunai 📲</h3>
          <p class="text-sm text-muted-foreground mt-1">If a user asks to "GPay directly to avoid the fee," they are asking you to give up your insurance. If you pay outside the app and they block you, we can’t help you. Your <strong>Karma Score</strong> only grows when you use the system.</p>
        </div>

        <div class="bg-secondary/5 p-4 rounded-lg border border-secondary/20">
          <h3 class="text-md font-bold text-foreground flex items-center gap-2">5. Trust Your Gut 🚩</h3>
          <p class="text-sm text-muted-foreground mt-1">If a deal seems too good to be true (like a MacBook for ₹5,000) or a user is being aggressive, hit the <strong>Report</strong> button immediately. Vasanth, Srinivasan, and I are watching the flags 24/7.</p>
        </div>
      </div>
    `,
  },
  termsOfService: {
    title: "📜 Terms of Service (The 'Fair Play' Agreement)",
    icon: Scale,
    badge: "The Rules",
    description: "Rules of the game. How Escrow, Karma, and Bans work.",
    fullText: `
      <div class="space-y-6">
        <p class="text-xs text-muted-foreground text-center">Last Updated: January 14, 2026</p>

        <div>
          <h3 class="text-md font-bold text-foreground">1. Who Can Join? 🎓</h3>
          <p class="text-sm text-muted-foreground mt-1">You must be a currently enrolled student with a valid College ID. If you graduate or leave, your account remains active for 6 months to settle any pending Karma or Wallet balances.</p>
        </div>

        <div>
          <h3 class="text-md font-bold text-foreground">2. The Escrow System (How we handle your money) 💸</h3>
          <ul class="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1 ml-2">
            <li><strong>Holding:</strong> When you buy, Natpe-Thunai holds your money in a secure account (Escrow).</li>
            <li><strong>Releasing:</strong> Money is released to the seller only after the buyer confirms receipt or 48 hours after the "Meeting Time" (if no dispute is raised).</li>
            <li><strong>Fees:</strong> We take a small commission (to keep the servers running and the developers fed). This is non-refundable once a transaction is completed.</li>
          </ul>
        </div>

        <div>
          <h3 class="text-md font-bold text-foreground">3. The Karma Score & Behavior ⭐</h3>
          <p class="text-sm text-muted-foreground mt-1">Your Karma is your reputation. We reserve the right to ban users who:</p>
          <ul class="list-disc list-inside text-sm text-muted-foreground mt-1 ml-2">
            <li>Spam the "Bounty" feed with useless requests.</li>
            <li>Sell broken or misrepresented items.</li>
            <li>Harass other users.</li>
          </ul>
          <p class="text-xs text-red-500 font-bold mt-2">Note: A "Banned" status is permanent. We don't do second chances for scammers.</p>
        </div>

        <div>
          <h3 class="text-md font-bold text-foreground">4. Data & Privacy 🔒</h3>
          <p class="text-sm text-muted-foreground mt-1">We use Appwrite (enterprise-grade security) to store your data. We don't sell your info to brands. Your College ID is encrypted and only used to verify you are a student. As developers, we only look at your transaction data if you raise a Dispute.</p>
        </div>

        <div>
          <h3 class="text-md font-bold text-foreground">5. Liability (The "We are Students too" Clause) 🤷‍♂️</h3>
          <p class="text-sm text-muted-foreground mt-1">While we do our best to protect you via Escrow and ID verification, Natpe-Thunai is a platform, not the seller. We are not responsible for the quality of the items sold. If you buy a cycle and the tire bursts the next day, that's between you and the seller—though your dispute will affect their Karma!</p>
        </div>
      </div>
    `,
  },

  // --- CATEGORY 2: MONEY MATTERS ---
  commissionPolicy: {
    title: "Dynamic Commission Policy",
    icon: TrendingUp,
    badge: "Save Money",
    description: "How leveling up lowers your fees.",
    fullText: `
      <h3 class="text-lg font-semibold mb-2 text-foreground">1. Commission Structure Overview</h3>
      <p class="text-sm text-muted-foreground mb-4">Natpe🤝Thunai operates on a dynamic commission model. Fees start at <strong>11.32%</strong> (Level 1) and drop to <strong>5.37%</strong> (Level 25).</p>
      
      <div class="overflow-x-auto border rounded-lg">
        <table class="min-w-full divide-y divide-border">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-bold text-foreground uppercase">Level</th>
              <th class="px-4 py-2 text-left text-xs font-bold text-foreground uppercase">Fee</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            ${Array.from({ length: 10 }, (_, i) => { // Show first 10 for brevity
              const level = i + 1;
              const rate = calculateCommissionRate(level);
              return `<tr class="bg-background"><td class="px-4 py-2 text-sm">${level}</td><td class="px-4 py-2 text-sm text-secondary-neon font-bold">${(rate * 100).toFixed(2)}%</td></tr>`;
            }).join('')}
            <tr class="bg-background"><td class="px-4 py-2 text-sm">...25+</td><td class="px-4 py-2 text-sm text-green-500 font-bold">5.37%</td></tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-muted-foreground mt-2">Higher levels = Lower fees. Simple.</p>
    `,
  },
  refundPolicy: {
    title: "Refund Policy",
    icon: FileText,
    badge: null,
    description: "Returns, damages, and cancellations.",
    fullText: `
      <h3 class="text-lg font-semibold mb-2 text-foreground">1. Eligibility</h3>
      <p class="text-sm text-muted-foreground mb-4">Refunds are issued for items significantly not as described. Digital goods are non-refundable.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">2. Return Period</h3>
      <p class="text-sm text-muted-foreground mb-4">For physical products, you have <strong>7 days</strong> from delivery to raise a request.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">3. Damaged Products</h3>
      <p class="text-sm text-muted-foreground mb-4">If an item is damaged during delivery, proof (photos) is required immediately upon receipt.</p>
    `,
  },

  // --- CATEGORY 3: COMMUNITY ---
  ambassadorMisuse: {
    title: "Ambassador Fair Use",
    icon: Users,
    badge: null,
    description: "Don't spam the delivery runners.",
    fullText: `
      <h3 class="text-lg font-semibold mb-2 text-foreground">1. Purpose</h3>
      <p class="text-sm text-muted-foreground mb-4">Ambassador delivery is for when you *cannot* meet. It's not a butler service.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">2. Misuse</h3>
      <p class="text-sm text-muted-foreground mb-4">Excessive use (>5 times without valid reason) may lower your XP.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">3. Safety First</h3>
      <p class="text-sm text-muted-foreground mb-4">Female students have a higher threshold (10 times) to ensure safety and comfort meeting strangers.</p>
    `,
  },
  privacyPolicy: {
    title: "Data Privacy",
    icon: Lock,
    badge: null,
    description: "We don't sell your data.",
    fullText: `
      <h3 class="text-lg font-semibold mb-2 text-foreground">1. Info We Collect</h3>
      <p class="text-sm text-muted-foreground mb-4">Name, Email, Age, Mobile, UPI ID, College ID. Used strictly for verification and transactions.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">2. Visibility</h3>
      <p class="text-sm text-muted-foreground mb-4">Only your Username and Karma Score are public. Your phone number is only shared with a user AFTER a deal is confirmed.</p>
    `,
  },
};

const PolicyButton = ({ itemKey, onClick }: { itemKey: keyof typeof policyContent, onClick: () => void }) => {
  const item = policyContent[itemKey];
  const Icon = item.icon;
  
  return (
    <Button
      variant="outline"
      className="w-full justify-between h-auto py-3 px-4 bg-card hover:bg-secondary/5 border-border transition-all group"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-secondary/10 rounded-full group-hover:bg-secondary-neon/20 transition-colors">
          <Icon className="h-5 w-5 text-secondary-neon" />
        </div>
        <div className="text-left">
          <div className="font-semibold text-foreground flex items-center gap-2">
            {item.title}
            {item.badge && <Badge variant="secondary" className="text-[10px] h-5 bg-secondary-neon/10 text-secondary-neon border-0">{item.badge}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
        </div>
      </div>
    </Button>
  );
};

const PoliciesPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({ title: "", description: "", fullText: "" });

  const handleViewPolicy = (policyKey: keyof typeof policyContent) => {
    const content = policyContent[policyKey];
    setDialogContent(content);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground">
            APP<span className="text-secondary-neon">POLICIES</span>
          </h1>
          <p className="text-xs text-muted-foreground">The rules that keep us safe and running.</p>
        </div>

        {/* SECTION 1: THE ESSENTIALS */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">The Essentials</h2>
          <div className="space-y-2">
            <PolicyButton itemKey="safetyGuide" onClick={() => handleViewPolicy("safetyGuide")} />
            <PolicyButton itemKey="termsOfService" onClick={() => handleViewPolicy("termsOfService")} />
          </div>
        </div>

        {/* SECTION 2: MONEY MATTERS */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">Money Matters</h2>
          <div className="space-y-2">
            <PolicyButton itemKey="commissionPolicy" onClick={() => handleViewPolicy("commissionPolicy")} />
            <PolicyButton itemKey="refundPolicy" onClick={() => handleViewPolicy("refundPolicy")} />
          </div>
        </div>

        {/* SECTION 3: COMMUNITY */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">Community Standards</h2>
          <div className="space-y-2">
            <PolicyButton itemKey="ambassadorMisuse" onClick={() => handleViewPolicy("ambassadorMisuse")} />
            <PolicyButton itemKey="privacyPolicy" onClick={() => handleViewPolicy("privacyPolicy")} />
          </div>
        </div>

      </div>
      <MadeWithDyad />

      {/* READING DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
               {dialogContent.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {dialogContent.description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-foreground prose prose-sm dark:prose-invert max-w-none leading-relaxed">
             <div dangerouslySetInnerHTML={{ __html: dialogContent.fullText }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PoliciesPage;