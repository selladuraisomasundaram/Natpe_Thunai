"use client";

import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, 
  Copy, 
  CheckCircle2, 
  ArrowLeft,
  Loader2,
  Banknote,
  AlertTriangle,
  HeartHandshake,
  ExternalLink,
  Info,
  Wallet
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
    databases, 
    APPWRITE_DATABASE_ID, 
    APPWRITE_TRANSACTIONS_COLLECTION_ID 
} from "@/lib/appwrite";

// --- CONFIGURATION ---
const DEVELOPER_UPI = "8903480105@superyes"; 

// --- PAYMENT APPS CONFIG ---
const PAYMENT_APPS = [
    { 
        name: "Google Pay", 
        scheme: "tez://", 
        package: "com.google.android.apps.nbu.paisa.user",
        color: "bg-blue-600 hover:bg-blue-700",
        icon: "G" 
    },
    { 
        name: "PhonePe", 
        scheme: "phonepe://", 
        package: "com.phonepe.app", 
        color: "bg-purple-600 hover:bg-purple-700",
        icon: "Pe"
    },
    { 
        name: "Paytm", 
        scheme: "paytmmp://", 
        package: "net.one97.paytm", 
        color: "bg-sky-500 hover:bg-sky-600",
        icon: "Pm"
    },
    { 
        name: "FamPay", 
        scheme: "fampay://", // Hypothetical scheme, falls back to generic
        package: "com.fampay.in", 
        color: "bg-yellow-500 hover:bg-yellow-600 text-black",
        icon: "F"
    },
    { 
        name: "Super.Money", 
        scheme: "supermoney://", // Hypothetical scheme
        package: "com.super.money", 
        color: "bg-emerald-600 hover:bg-emerald-700",
        icon: "S"
    }
];

const EscrowPayment = () => {
  const { transactionId: pathId } = useParams<{ transactionId: string }>(); 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const transactionId = searchParams.get("txnId") || pathId;

  const [copiedVPA, setCopiedVPA] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);

  // Data
  const amount = searchParams.get("amount") || "0";
  const itemTitle = searchParams.get("title") || "Order";
  const formattedAmount = parseFloat(amount).toFixed(2);

  // --- 1. COPY HANDLER ---
  const handleCopyVPA = () => {
    navigator.clipboard.writeText(DEVELOPER_UPI);
    setCopiedVPA(true);
    toast.success("UPI ID Copied!");
    setTimeout(() => setCopiedVPA(false), 2000);
  };

  // --- 2. LAUNCH SPECIFIC APP ---
  const handleLaunchApp = (app: typeof PAYMENT_APPS[0]) => {
    handleCopyVPA(); // Auto-copy ID when launching

    toast.info(`Opening ${app.name}...`, {
        description: "ID copied! Paste it to pay."
    });

    try {
        let intentUrl = app.scheme;

        // Specific handling for Android Intent (works best in Chrome on Android)
        // This format forces the specific app to open if installed
        const isAndroid = /Android/i.test(navigator.userAgent);
        if (isAndroid) {
            intentUrl = `intent://#Intent;scheme=${app.scheme.replace('://', '')};package=${app.package};end`;
        }

        // Median Bridge Support
        if ((window as any).median) {
            (window as any).median.website.open({ url: app.scheme });
        } else {
            window.location.href = intentUrl;
        }

        // Fallback Check
        setTimeout(() => {
             if (!document.hidden) {
                 setShowManualDialog(true);
             }
        }, 2000);
        
    } catch (e) {
        console.error("Launch Error:", e);
        setShowManualDialog(true);
    }
  };

  // --- 3. VERIFICATION ---
  const handleVerifyPayment = async () => {
    if (!utrNumber || utrNumber.length < 12) {
        toast.error("Invalid UTR Format", { description: "Must be 12 digits." });
        return;
    }

    if (!transactionId) {
        toast.error("Error: Order ID Missing");
        return;
    }

    setIsSubmitting(true);

    try {
        await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_TRANSACTIONS_COLLECTION_ID,
            transactionId, 
            {
                transactionId: utrNumber, 
                status: "payment_confirmed_to_developer",
                utrId: utrNumber 
            }
        );

        toast.success("Payment Submitted!", { description: "Processing..." });
        
        setTimeout(() => { navigate("/tracking"); }, 1500);

    } catch (error: any) {
        toast.error("Submission Failed");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative">
      
      {/* --- TOP BAR --- */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
            <h1 className="text-lg font-black tracking-tight leading-none">Payment Gateway</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Escrow Protection Active</p>
        </div>
      </div>

      <div className="flex-1 p-4 pb-24 space-y-6">
        
        {/* --- AMOUNT CARD --- */}
        <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary-neon to-transparent opacity-50" />
            
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Total Payable</p>
            <div className="text-5xl font-black text-foreground tracking-tighter flex items-center justify-center gap-1">
                <span className="text-2xl text-muted-foreground mt-2">₹</span>
                {formattedAmount}
            </div>
            <div className="mt-4 inline-block bg-muted/50 px-3 py-1 rounded-full border border-border">
                <p className="text-xs font-medium text-foreground flex items-center gap-2">
                    <Wallet className="h-3 w-3 text-secondary-neon" /> {itemTitle}
                </p>
            </div>
        </div>

        {/* --- STEP 1: SELECT APP --- */}
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                <div className="h-5 w-5 rounded-full bg-secondary-neon text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="text-sm font-bold uppercase text-muted-foreground">Select App to Pay</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {PAYMENT_APPS.map((app) => (
                    <button
                        key={app.name}
                        onClick={() => handleLaunchApp(app)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border border-border/50 shadow-sm transition-all active:scale-95 hover:opacity-90 ${app.color}`}
                    >
                        <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg mb-1 backdrop-blur-sm">
                            {app.icon}
                        </div>
                        <span className="text-[9px] font-bold text-white uppercase tracking-wide text-center leading-tight">
                            {app.name}
                        </span>
                    </button>
                ))}
                {/* Manual Copy Fallback Button */}
                <button
                    onClick={handleCopyVPA}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-all active:scale-95"
                >
                    <Copy className="h-6 w-6 text-foreground mb-1" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Copy ID</span>
                </button>
            </div>
            
            <p className="text-[10px] text-center text-muted-foreground pt-1">
                *Tapping an app <strong>auto-copies</strong> the ID: <span className="font-mono text-foreground select-all bg-muted px-1 rounded">{DEVELOPER_UPI}</span>
            </p>
        </div>

        {/* --- STEP 2: VERIFY --- */}
        <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 px-1">
                <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                <h3 className="text-sm font-bold uppercase text-muted-foreground">Confirm Transaction</h3>
            </div>

            <Card className="bg-muted/10 border-border shadow-inner">
                <CardContent className="p-4 space-y-3">
                    <Label htmlFor="utr" className="text-xs font-bold text-foreground">Paste 12-Digit UTR / Ref No.</Label>
                    <div className="relative">
                        <Input 
                            id="utr"
                            placeholder="e.g. 329481920481" 
                            className="text-center font-mono font-bold text-lg h-12 border-border focus-visible:border-secondary-neon bg-background rounded-xl pr-10"
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                            maxLength={12}
                        />
                        {utrNumber.length === 12 && (
                            <CheckCircle2 className="absolute right-3 top-3 h-6 w-6 text-green-500 animate-in zoom-in" />
                        )}
                    </div>
                    
                    <Button 
                        className="w-full h-12 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-black text-sm uppercase shadow-neon rounded-xl mt-2"
                        onClick={handleVerifyPayment}
                        disabled={isSubmitting || utrNumber.length < 12}
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Payment"}
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* --- FOOTER WARNING --- */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex gap-3 items-center">
            <AlertTriangle className="h-8 w-8 text-destructive shrink-0 p-1 bg-destructive/10 rounded-full" />
            <div>
                <h4 className="text-[10px] font-bold text-destructive uppercase">Zero Tolerance Policy</h4>
                <p className="text-[9px] text-muted-foreground leading-tight">
                    Fake UTRs lead to immediate account bans. Funds are held in escrow until verified.
                </p>
            </div>
        </div>

      </div>

      {/* --- MANUAL DIALOG --- */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="w-[90%] rounded-2xl">
            <DialogHeader>
                <DialogTitle>App Didn't Open?</DialogTitle>
                <DialogDescription>Pay manually using any UPI app.</DialogDescription>
            </DialogHeader>
            <div className="bg-muted p-3 rounded-xl text-center space-y-1">
                <p className="text-xs text-muted-foreground uppercase">Pay to UPI ID</p>
                <p className="text-lg font-mono font-bold select-all">{DEVELOPER_UPI}</p>
                <Button size="sm" variant="outline" onClick={handleCopyVPA} className="mt-2 h-8 text-xs w-full">
                    <Copy className="mr-2 h-3 w-3" /> Copy ID
                </Button>
            </div>
            <DialogFooter>
                <Button onClick={() => setShowManualDialog(false)} className="w-full">Got it</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default EscrowPayment;