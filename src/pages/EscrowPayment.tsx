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
  Wallet,
  Info,
  Loader2,
  Smartphone,
  ClipboardCopy
} from "lucide-react";
import { toast } from "sonner";
import { 
    databases, 
    APPWRITE_DATABASE_ID, 
    APPWRITE_TRANSACTIONS_COLLECTION_ID 
} from "@/lib/appwrite";

// --- CONFIGURATION ---
const DEVELOPER_UPI = "8903480105@superyes"; // Your Personal VPA
const DEVELOPER_NAME = "Natpe Thunai";

const EscrowPayment = () => {
  const { transactionId } = useParams<{ transactionId: string }>(); 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [copiedNote, setCopiedNote] = useState(false);
  const [copiedVPA, setCopiedVPA] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'pay' | 'verify'>('pay');
  const [utrNumber, setUtrNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data from URL
  const amount = searchParams.get("amount") || "0";
  const itemTitle = searchParams.get("title") || "Order";
  const formattedAmount = parseFloat(amount).toFixed(2);

  // --- GENERATE SIMPLE REFERENCE NOTE ---
  // Create a short, clean reference for the user to copy
  // e.g., "NT" + last 6 chars of transaction ID to keep it unique but short
  const referenceNote = `NT${transactionId?.substring(0, 6) || "ORDER"}`.toUpperCase();

  // --- SIMPLEST UPI LINK ---
  // Only VPA (pa) and Name (pn). 
  // No Amount (am) or Note (tn) ensures GPay treats this as a manual P2P transfer.
  const simpleUpiLink = `upi://pay?pa=${DEVELOPER_UPI}&pn=${encodeURIComponent(DEVELOPER_NAME)}`;

  const handleCopy = (text: string, type: 'note' | 'vpa') => {
    navigator.clipboard.writeText(text);
    if (type === 'note') {
        setCopiedNote(true);
        setTimeout(() => setCopiedNote(false), 2000);
        toast.success("Note copied! Paste this in your UPI app.");
    } else {
        setCopiedVPA(true);
        setTimeout(() => setCopiedVPA(false), 2000);
        toast.success("UPI ID copied!");
    }
  };

  const handleOpenApp = () => {
    window.location.href = simpleUpiLink;
    setPaymentStep('verify');
    toast.info("App opened. Please enter Amount & Note manually.");
  };

  const handleVerifyPayment = async () => {
    // Basic UTR Validation (12 digits standard)
    if (!utrNumber || utrNumber.length < 12) {
        toast.error("Invalid UTR. Please check your banking app (12 digits).");
        return;
    }

    if (!transactionId) {
        toast.error("System Error: Invalid Order ID.");
        return;
    }

    setIsSubmitting(true);

    try {
        await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_TRANSACTIONS_COLLECTION_ID,
            transactionId, 
            {
                transactionId: utrNumber, // Store UTR
                status: "payment_confirmed_to_developer",
                utrId: utrNumber 
            }
        );

        toast.success("Payment Verified! Order Processing.");
        
        setTimeout(() => {
            navigate("/activity/tracking"); 
        }, 1500);

    } catch (error: any) {
        console.error("Verification Error:", error);
        toast.error("Error: " + (error.message || "Connection failed"));
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      
      {/* Navbar */}
      <div className="w-full max-w-md flex items-center mb-6 absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6 mt-12">
        
        {/* === HEADER === */}
        <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-secondary-neon/10 rounded-full mb-2 border border-secondary-neon/20">
                <ShieldCheck className="h-8 w-8 text-secondary-neon" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">
                ₹{formattedAmount}
            </h1>
            <p className="text-sm text-muted-foreground font-medium truncate px-4">{itemTitle}</p>
        </div>

        <Card className="border-border/60 shadow-lg animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
          <CardContent className="p-6">
            
            {paymentStep === 'pay' ? (
                <div className="space-y-6">
                    
                    {/* INSTRUCTIONS */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-center">
                        <Info className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                        <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">
                            Step 1: Copy the Note below.<br/>
                            Step 2: Click Pay & Enter Amount <strong>₹{formattedAmount}</strong> manually.
                        </p>
                    </div>

                    {/* COPY NOTE SECTION */}
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-muted-foreground uppercase ml-1">Payment Note (Required)</Label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-muted/50 border rounded-lg px-3 py-3 text-sm font-mono font-bold flex items-center justify-center tracking-wider">
                                {referenceNote}
                            </div>
                            <Button size="icon" variant="outline" onClick={() => handleCopy(referenceNote, 'note')} className="shrink-0 h-11 w-11 bg-card hover:bg-secondary-neon/10 hover:text-secondary-neon">
                                {copiedNote ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <ClipboardCopy className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* PAY BUTTON */}
                    <Button 
                        onClick={handleOpenApp}
                        className="w-full h-14 bg-secondary-neon hover:bg-secondary-neon/90 text-primary-foreground font-bold text-lg rounded-xl shadow-lg shadow-secondary-neon/20 transition-transform active:scale-[0.98]"
                    >
                        <Wallet className="mr-2 h-5 w-5" /> Open UPI App
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or copy VPA</span></div>
                    </div>

                    {/* COPY VPA FALLBACK */}
                    <div className="flex gap-2 items-center">
                        <div className="flex-1 bg-muted/50 border rounded-lg px-3 py-2 text-xs font-mono text-center truncate select-all">
                            {DEVELOPER_UPI}
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => handleCopy(DEVELOPER_UPI, 'vpa')} className="shrink-0 h-9 w-9">
                            {copiedVPA ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="text-center pt-2">
                        <Button variant="link" size="sm" className="text-xs text-blue-500 h-auto p-0" onClick={() => setPaymentStep('verify')}>
                            I've already paid → Enter UTR
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="text-center space-y-1">
                        <div className="bg-green-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Smartphone className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-bold text-lg">Confirm Payment</h3>
                        <p className="text-xs text-muted-foreground px-4">
                            Please paste the 12-digit <strong>UTR / Reference ID</strong> from your banking app to finish.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="utr" className="sr-only">UTR</Label>
                        <Input 
                            id="utr"
                            placeholder="Paste UTR (e.g. 3291...)" 
                            className="text-center font-mono tracking-widest text-xl h-14 border-secondary-neon/30 focus-visible:ring-secondary-neon bg-secondary-neon/5"
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
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5"/> Verify & Finish</span>}
                    </Button>

                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setPaymentStep('pay')}>
                        Back to Payment
                    </Button>
                </div>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default EscrowPayment;