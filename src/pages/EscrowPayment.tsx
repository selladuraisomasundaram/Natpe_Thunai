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
  Smartphone,
  ExternalLink,
  Wallet
} from "lucide-react";
import { toast } from "sonner";
import { 
    databases, 
    APPWRITE_DATABASE_ID, 
    APPWRITE_TRANSACTIONS_COLLECTION_ID 
} from "@/lib/appwrite";

// --- CONFIGURATION ---
const DEVELOPER_UPI = "8903480105@superyes"; 
const DEVELOPER_NAME = "Natpe Thunai";

const EscrowPayment = () => {
  const { transactionId } = useParams<{ transactionId: string }>(); 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [copiedVPA, setCopiedVPA] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'methods' | 'verify'>('methods');

  // Data
  const amount = searchParams.get("amount") || "0";
  const itemTitle = searchParams.get("title") || "Order";
  const formattedAmount = parseFloat(amount).toFixed(2);

  // --- APP SPECIFIC INTENTS (The Fix) ---
  // Using specific schemes often bypasses the generic "Limit Exceeded" error
  // because it targets the app explicitly.
  
  const constructLink = (scheme: string) => {
    return `${scheme}pay?pa=${DEVELOPER_UPI}&pn=${encodeURIComponent(DEVELOPER_NAME)}&am=${formattedAmount}&cu=INR`;
  };

  const links = {
    gpay: constructLink("tez://upi/"),       // Specific to Google Pay
    phonepe: constructLink("phonepe://"),    // Specific to PhonePe
    paytm: constructLink("paytmmp://"),      // Specific to Paytm
    generic: constructLink("upi://")         // Fallback
  };

  const handleCopyVPA = () => {
    navigator.clipboard.writeText(DEVELOPER_UPI);
    setCopiedVPA(true);
    setTimeout(() => setCopiedVPA(false), 2000);
    toast.success("UPI ID Copied!");
  };

  const handleAppClick = (appName: string, link: string) => {
    window.location.href = link;
    toast.info(`Opening ${appName}...`);
    // Auto-advance to verification after a short delay
    setTimeout(() => setActiveTab('verify'), 2500);
  };

  const handleVerifyPayment = async () => {
    if (!utrNumber || utrNumber.length < 12) {
        toast.error("Invalid UTR. Please check your banking app.");
        return;
    }

    if (!transactionId) {
        toast.error("Invalid Order ID.");
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

        toast.success("Payment Verified! Order Processing.");
        setTimeout(() => navigate("/activity/tracking"), 1500);

    } catch (error: any) {
        console.error("Verification Error:", error);
        toast.error("Error: " + (error.message || "Connection failed"));
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      
      {/* Header */}
      <div className="w-full max-w-md flex items-center mb-6 absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6 mt-10">
        
        {/* === SUMMARY === */}
        <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-secondary-neon/10 rounded-full mb-2 border border-secondary-neon/20 animate-in zoom-in duration-500">
                <ShieldCheck className="h-8 w-8 text-secondary-neon" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">
                ₹{formattedAmount}
            </h1>
            <p className="text-sm text-muted-foreground font-medium px-4 truncate">{itemTitle}</p>
        </div>

        <Card className="border-border/60 shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
          <CardContent className="p-0">
            
            {/* TABS HEADER */}
            <div className="grid grid-cols-2 border-b border-border">
                <button 
                    onClick={() => setActiveTab('methods')}
                    className={`p-3 text-sm font-bold transition-colors ${activeTab === 'methods' ? 'bg-secondary-neon/10 text-secondary-neon' : 'hover:bg-muted'}`}
                >
                    1. Pay
                </button>
                <button 
                    onClick={() => setActiveTab('verify')}
                    className={`p-3 text-sm font-bold transition-colors ${activeTab === 'verify' ? 'bg-secondary-neon/10 text-secondary-neon' : 'hover:bg-muted'}`}
                >
                    2. Confirm
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'methods' ? (
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Tap to Pay via App</Label>
                            
                            {/* GOOGLE PAY BUTTON */}
                            <Button 
                                variant="outline" 
                                className="w-full h-14 justify-start px-4 gap-3 font-bold text-base border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
                                onClick={() => handleAppClick("Google Pay", links.gpay)}
                            >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" className="h-5 w-auto" alt="GPay" />
                                <span className="ml-auto text-xs text-muted-foreground font-normal">Fastest</span>
                            </Button>

                            {/* PHONEPE BUTTON */}
                            <Button 
                                variant="outline" 
                                className="w-full h-14 justify-start px-4 gap-3 font-bold text-base border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all"
                                onClick={() => handleAppClick("PhonePe", links.phonepe)}
                            >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" className="h-5 w-auto" alt="PhonePe" />
                            </Button>

                            {/* PAYTM BUTTON */}
                            <Button 
                                variant="outline" 
                                className="w-full h-14 justify-start px-4 gap-3 font-bold text-base border-2 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/10 transition-all"
                                onClick={() => handleAppClick("Paytm", links.paytm)}
                            >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" className="h-4 w-auto" alt="Paytm" />
                            </Button>
                        </div>

                        <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-border"></div>
                            <span className="flex-shrink-0 mx-2 text-[10px] text-muted-foreground uppercase">Or Manual Pay</span>
                            <div className="flex-grow border-t border-border"></div>
                        </div>

                        {/* MANUAL COPY */}
                        <div className="flex gap-2 items-center">
                            <div className="flex-1 bg-muted/50 border rounded-lg px-3 py-3 text-xs font-mono text-center truncate select-all">
                                {DEVELOPER_UPI}
                            </div>
                            <Button size="icon" variant="ghost" onClick={handleCopyVPA} className="shrink-0 h-10 w-10 hover:bg-green-100 dark:hover:bg-green-900/20">
                                {copiedVPA ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                            </Button>
                        </div>

                        <div className="text-center pt-2">
                             <Button variant="link" size="sm" className="text-xs text-blue-500 p-0" onClick={() => setActiveTab('verify')}>
                                I have completed payment →
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="text-center space-y-2">
                            <div className="bg-blue-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Smartphone className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-lg">Verification</h3>
                            <p className="text-xs text-muted-foreground px-2">
                                Check your banking app for the <strong>UTR / Reference No</strong> (12 digits) and paste it below.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="utr" className="sr-only">UTR</Label>
                            <Input 
                                id="utr"
                                placeholder="Paste 12-digit UTR" 
                                className="text-center font-mono tracking-widest text-xl h-14 border-blue-500/30 focus-visible:ring-blue-500 bg-blue-50/50 dark:bg-blue-900/10 uppercase"
                                value={utrNumber}
                                onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                                maxLength={12}
                                autoFocus
                            />
                        </div>

                        <Button 
                            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-base shadow-md transition-all active:scale-[0.98]"
                            onClick={handleVerifyPayment}
                            disabled={isSubmitting || utrNumber.length < 12}
                        >
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5"/> Verify Payment</span>}
                        </Button>

                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setActiveTab('methods')}>
                            Back to Payment Options
                        </Button>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default EscrowPayment;