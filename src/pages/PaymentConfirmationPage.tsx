"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, ArrowLeft, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { Models } from "appwrite";

interface Transaction extends Models.Document {
  productTitle: string;
  amount: number;
  status: string;
  sellerName: string;
  type: "buy" | "rent";
}

const PaymentConfirmationPage = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [utrId, setUtrId] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) {
        setLoading(false);
        return;
      }
      try {
        const doc = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          transactionId
        );
        setTransaction(doc as unknown as Transaction);
      } catch (error) {
        console.error("Error fetching transaction:", error);
        toast.error("Failed to load transaction details.");
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [transactionId]);

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrId.trim()) {
      toast.error("Please enter the UPI Transaction ID (UTR).");
      return;
    }
    if (!transaction) return;

    setIsConfirming(true);
    try {
      // Update transaction status and add UTR ID
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        transactionId!,
        {
          status: "payment_confirmed_to_developer",
          utrId: utrId.trim(), // Assuming 'utrId' attribute exists in the collection
        }
      );
      toast.success("Payment confirmed! Developers will verify the UTR shortly.");
      navigate("/activity/tracking");
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      toast.error(error.message || "Failed to confirm payment.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon" />
        <p className="ml-3 text-lg text-muted-foreground">Loading transaction...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <h1 className="text-4xl font-bold mb-4">Transaction Not Found</h1>
        <Button onClick={() => navigate("/market")} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go to Market
        </Button>
      </div>
    );
  }

  if (transaction.status !== "initiated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <CheckCircle className="h-10 w-10 text-secondary-neon mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Payment Already Confirmed</h1>
        <p className="text-muted-foreground mb-6">This transaction is already marked as '{transaction.status.replace(/_/g, ' ')}'.</p>
        <Button onClick={() => navigate("/activity/tracking")} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <DollarSign className="mr-2 h-4 w-4" /> View Tracking
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20 flex items-center justify-center">
      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg border-border">
        <CardHeader className="p-4 pb-2 text-center">
          <CardTitle className="text-2xl font-bold text-foreground">Confirm Payment</CardTitle>
          <CardDescription className="text-muted-foreground">
            Step 2: Enter the UPI Transaction ID (UTR) after paying the developer.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="p-3 border border-secondary-neon/50 rounded-md bg-secondary-neon/10">
            <p className="text-sm text-muted-foreground">Item: <span className="font-semibold text-foreground">{transaction.productTitle}</span></p>
            <p className="text-lg font-bold text-secondary-neon">Amount Paid: ₹{transaction.amount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Transaction ID: {transactionId}</p>
          </div>

          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div>
              <Label htmlFor="utrId" className="text-foreground">UPI Transaction ID (UTR)</Label>
              <Input
                id="utrId"
                type="text"
                placeholder="e.g., 412345678901"
                value={utrId}
                onChange={(e) => setUtrId(e.target.value)}
                required
                className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                disabled={isConfirming}
              />
              <p className="text-xs text-muted-foreground mt-1">This ID is essential for the developer to verify your payment.</p>
            </div>
            <Button type="submit" className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isConfirming}>
              {isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" /> Confirm Payment
                </>
              )}
            </Button>
          </form>
          <Button variant="outline" onClick={() => navigate("/activity/tracking")} className="w-full border-border text-primary-foreground hover:bg-muted">
            View Tracking Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentConfirmationPage;