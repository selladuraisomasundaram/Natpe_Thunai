"use client";

import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Copy, 
  CheckCircle2, 
  ArrowLeft,
  Loader2,
  Banknote,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Wallet,
  Smartphone,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { 
    databases, 
    APPWRITE_DATABASE_ID, 
    APPWRITE_TRANSACTIONS_COLLECTION_ID 
} from "@/lib/appwrite";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// --- CONFIGURATION ---
const DEVELOPER_UPI = "8903480105@superyes"; 

// --- SMART APP CONFIGURATION ---
// We use 'package' for Android Intents (Direct Launch)
// We use 'scheme' for iOS (Direct Launch)
const PAYMENT_APPS = [
    { 
        name: "GPay", 
        package: "com.google.android.apps.nbu.paisa.user", 
        scheme: "tez://",
        color: "from-blue-500 to-green-500",
        hover: "hover:shadow-blue-500/20",
        icon: "G"
    },
    { 
        name: "PhonePe", 
        package: "com.phonepe.app", 
        scheme: "phonepe://",
        color: "from-purple-600 to-indigo-600",
        hover: "hover:shadow-purple-500/20",
        icon: "Pe"
    },
    { 
        name: "Paytm", 
        package: "net.one97.paytm", 
        scheme: "paytmmp://",
        color: "from-sky-400 to-blue-600",
        hover: "hover:shadow-sky-500/20",
        icon: "Pm"
    },
    { 
        name: "BHIM", 
        package: "in.org.npci.upiapp", 
        scheme: "upi://",
        color: "from-orange-500 to-green-600",
        hover: "hover:shadow-orange-500/20",
        icon: "B"
    },
    { 
        name: "Cred", 
        package: "com.dreamplug.androidapp", 
        scheme: "cred://",
        color: "from-gray-800 to-black",
        hover: "hover:shadow-black/20",
        icon: "C"
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
    toast.success("UPI ID Copied!", {
        description: "App opening... Paste ID to pay."
    });
    setTimeout(() => setCopiedVPA(false), 2000);
  };

  // --- 2. SMART APP LAUNCHER (THE FIX) ---
  const handleLaunchApp = (app: typeof PAYMENT_APPS[0]) => {
      // A. Copy ID First (Crucial for UX)
      handleCopyVPA();

      // B. Determine Environment
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      let launchUrl = "";

      if (isAndroid) {
          // 🔥 THE MAGIC INTENT 🔥
          // This syntax tells Android: "Open this package. If not installed, go to Play Store."
          // It bypasses the 'upi://' validation logic and just launches the app.
          launchUrl = `intent://#Intent;package=${app.package};scheme=${app.scheme.replace('://', '')};end`;
      } else {
          // iOS Fallback: Use the naked scheme
          launchUrl = app.scheme;
      }

      toast.info(`Launching ${app.name}...`);

      try {
          // C. Execute Launch
          if ((window as any).median) {
              (window as any).median.website.open({ url: launchUrl });
          } else {
              window.location.href = launchUrl;
          }

          // D. Fallback Check (If app didn't open)
          setTimeout(() => {
               if (!document.hidden) {
                   setShowManualDialog(true);
               }
          }, 2500);

      } catch (e) {
          console.error("Launch failed", e);
          setShowManualDialog(true);
      }
  };

  // --- 3. VERIFICATION HANDLER ---
  const handleVerifyPayment = async () => {
    if (!utrNumber || utrNumber.length < 12) {
        toast.error("Invalid UTR / Ref No.", { description: "Transaction ID must be at least 12 digits." });
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

        toast.success("Payment Submitted!", { description: "Verifying with bank..." });
        
        setTimeout(() => { navigate("/tracking"); }, 1500);

    } catch (error: any) {
        toast.error("Submission Failed");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative pb-10">
      
      {/* --- TOP BAR --- */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
            <h1 className="text-lg font-black tracking-tight leading-none">SECURE PAY</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-green-500" /> Escrow Active
            </p>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6">
        
        {/* --- AMOUNT CARD --- */}
        <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary-neon to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Total Payable</p>
            <div className="text-5xl font-black text-foreground tracking-tighter flex items-center justify-center gap-1">
                <span className="text-2xl text-muted-foreground mt-2">₹</span>
                {formattedAmount}
            </div>
            <div className="mt-4 inline-flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border border-border/50 backdrop-blur-md">
                <Wallet className="h-3 w-3 text-secondary-neon" /> 
                <span className="text-xs font-bold text-foreground truncate max-w-[200px]">{itemTitle}</span>
            </div>
        </div>

        {/* --- STEP 1: SELECT APP --- */}
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary-neon text-background text-[10px] font-bold">1</span>
                    Select Your App
                </h3>
                <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">ID Auto-Copies</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {PAYMENT_APPS.map((app) => (
                    <button
                        key={app.name}
                        onClick={() => handleLaunchApp(app)}
                        className={cn(
                            "relative overflow-hidden rounded-xl p-3 h-20 flex flex-col items-center justify-center gap-1 shadow-md transition-all active:scale-95 group border border-white/5",
                            "bg-gradient-to-br text-white",
                            app.color,
                            app.hover
                        )}
                    >
                        <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg mb-1 backdrop-blur-md shadow-inner">
                            {app.icon}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wide z-10">{app.name}</span>
                        
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </button>
                ))}
                
                {/* Manual Fallback */}
                <button
                    onClick={handleCopyVPA}
                    className="flex flex-col items-center justify-center p-3 h-20 rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-all active:scale-95"
                >
                    <Copy className="h-6 w-6 text-foreground/50 mb-1" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Manual Copy</span>
                </button>
            </div>
        </div>

        {/* --- STEP 2: VERIFY --- */}
        <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2 px-1">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary-neon text-background text-[10px] font-bold">2</span>
                Verify Payment
            </h3>

            <Card className="bg-muted/10 border-border shadow-inner">
                <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="utr" className="text-xs font-bold text-foreground flex justify-between">
                            <span>Paste 12-Digit UTR / Ref No.</span>
                            <span className="text-[9px] text-muted-foreground font-normal opacity-70">Check SMS/History</span>
                        </Label>
                        <div className="relative">
                            <Input 
                                id="utr"
                                placeholder="0000 0000 0000" 
                                className="text-center font-mono font-bold text-lg h-14 border-2 border-border focus-visible:border-secondary-neon bg-background rounded-xl pr-10 tracking-[0.1em]"
                                value={utrNumber}
                                onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                                maxLength={12}
                            />
                            {utrNumber.length === 12 && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-500 rounded-full p-1 animate-in zoom-in">
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <Button 
                        className="w-full h-12 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-black text-sm uppercase shadow-neon rounded-xl"
                        onClick={handleVerifyPayment}
                        disabled={isSubmitting || utrNumber.length < 12}
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Complete"}
                    </Button>
                </CardContent>
            </Card>
        </div>

      </div>

      {/* --- MANUAL DIALOG (FALLBACK) --- */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="w-[90%] rounded-2xl bg-card border-border">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-secondary-neon" /> App didn't open?
                </DialogTitle>
                <DialogDescription className="text-xs">
                    No worries. Pay manually in 3 steps:
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
                <div className="bg-muted p-3 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase">1. Pay to UPI ID</p>
                        <p className="text-sm font-mono font-bold select-all">{DEVELOPER_UPI}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={handleCopyVPA}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 px-1">
                    <p>2. Open your preferred UPI app manually.</p>
                    <p>3. Select <strong>"To UPI ID"</strong> and paste.</p>
                    <p>4. Pay <strong>₹{formattedAmount}</strong>.</p>
                    <p>5. Copy the <strong>12-digit UTR</strong> from payment details.</p>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => setShowManualDialog(false)} className="w-full">Okay, I'll Paste UTR</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default EscrowPayment;