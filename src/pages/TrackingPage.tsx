"use client";

import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, XCircle, MessageSquareText, DollarSign, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Models, Query } from "appwrite";
import { calculateCommissionRate } from "@/utils/commission"; // Import commission calculator

interface TrackingItem {
  id: string;
  type: "Order" | "Service" | "Cancellation" | "Complaint" | "Transaction";
  description: string;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled" | "Resolved" | "Initiated" | "Payment Confirmed";
  date: string;
  productTitle?: string;
  amount?: number;
  sellerName?: string;
  buyerName?: string; // Added buyerName
  buyerId?: string;
  sellerId?: string;
  commissionAmount?: number; // Added commission details
  netSellerAmount?: number; // Added net amount
}

// Helper function to map Appwrite transaction status to TrackingItem status
const mapAppwriteStatusToTrackingStatus = (appwriteStatus: string): TrackingItem["status"] => {
  switch (appwriteStatus) {
    case "initiated":
      return "Initiated";
    case "payment_confirmed_to_developer":
      return "Payment Confirmed";
    case "commission_deducted":
      return "In Progress";
    case "paid_to_seller":
      return "Completed";
    case "failed":
      return "Cancelled";
    default:
      return "Pending";
  }
};

// Helper function to convert Appwrite transaction document to TrackingItem
const convertAppwriteTransactionToTrackingItem = (doc: Models.Document, currentUserId: string): TrackingItem => {
  const transactionDoc = doc as any;
  const isBuyer = transactionDoc.buyerId === currentUserId;
  const isSeller = transactionDoc.sellerId === currentUserId;

  let description = `Payment for ${transactionDoc.productTitle}`;
  if (isBuyer) {
    description = `Purchase of ${transactionDoc.productTitle}`;
  } else if (isSeller) {
    description = `Sale of ${transactionDoc.productTitle}`;
  }

  return {
    id: transactionDoc.$id,
    type: "Transaction",
    description: description,
    status: mapAppwriteStatusToTrackingStatus(transactionDoc.status),
    date: new Date(transactionDoc.$createdAt).toLocaleDateString(),
    productTitle: transactionDoc.productTitle,
    amount: transactionDoc.amount,
    sellerName: transactionDoc.sellerName,
    buyerName: transactionDoc.buyerName, // Mapped buyerName
    buyerId: transactionDoc.buyerId,
    sellerId: transactionDoc.sellerId,
    commissionAmount: transactionDoc.commissionAmount,
    netSellerAmount: transactionDoc.netSellerAmount,
  };
};

const dummyOtherItems: TrackingItem[] = [
  { id: "t1", type: "Order", description: "Gaming Headset from The Exchange", status: "In Progress", date: "2024-07-20" },
  { id: "t2", type: "Service", description: "Resume Building Service", status: "Completed", date: "2024-07-18" },
  { id: "t3", type: "Cancellation", description: "Rent request for Bicycle", status: "Pending", date: "2024-07-22" },
  { id: "t4", type: "Complaint", description: "Issue with food delivery", status: "Resolved", date: "2024-07-15" },
  { id: "t5", type: "Order", description: "Textbook: Advanced Physics", status: "Pending", date: "2024-07-23" },
];


const TrackingPage = () => {
  const { user, userProfile } = useAuth();
  const [trackingItems, setTrackingItems] = useState<TrackingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrackingItems = async () => {
    if (!user?.$id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch transactions where the current user is the buyer or seller
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.or([
            Query.equal('buyerId', user.$id),
            Query.equal('sellerId', user.$id)
          ]),
          Query.orderDesc('$createdAt') // Order by newest first
        ]
      );

      const fetchedTransactions: TrackingItem[] = response.documents
        .map((doc: Models.Document) => convertAppwriteTransactionToTrackingItem(doc, user.$id));

      setTrackingItems([...fetchedTransactions, ...dummyOtherItems]);
    } catch (error) {
      console.error("Error fetching tracking items:", error);
      toast.error("Failed to load tracking items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingItems();

    // Realtime subscription for transactions
    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`,
      (response) => {
        if (!user?.$id) return;

        const payload = response.payload as unknown as Models.Document;
        const transactionPayload = payload as any;

        // Only process if the current user is involved in the transaction
        if (transactionPayload.buyerId !== user.$id && transactionPayload.sellerId !== user.$id) {
          return;
        }

        const newTrackingItem = convertAppwriteTransactionToTrackingItem(payload, user.$id);

        setTrackingItems((prev) => {
          const existingIndex = prev.findIndex(item => item.id === newTrackingItem.id && item.type === "Transaction");
          
          if (existingIndex !== -1) {
            // Update existing transaction
            const updatedItems = [...prev];
            updatedItems[existingIndex] = newTrackingItem;
            toast.info(`Activity updated: "${newTrackingItem.description}" status is now "${newTrackingItem.status}"`);
            return updatedItems;
          } else if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            // Add new transaction
            toast.info(`New activity: "${newTrackingItem.description}"`);
            return [newTrackingItem, ...prev];
          }
          // Ignore other events or non-transaction items
          return prev;
        });
      }
    );

    return () => {
      unsubscribe(); // Unsubscribe on component unmount
    };
  }, [user]); // Depend on user to re-run effect if user changes

  const getStatusBadgeClass = (status: TrackingItem["status"]) => {
    switch (status) {
      case "Pending":
      case "Initiated":
        return "bg-yellow-500 text-white";
      case "Payment Confirmed":
        return "bg-blue-500 text-white";
      case "In Progress":
        return "bg-orange-500 text-white";
      case "Completed":
      case "Resolved":
        return "bg-secondary-neon text-primary-foreground";
      case "Cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getIcon = (type: TrackingItem["type"]) => {
    switch (type) {
      case "Order":
        return <Package className="h-4 w-4 text-secondary-neon" />;
      case "Service":
        return <Truck className="h-4 w-4 text-secondary-neon" />;
      case "Cancellation":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "Complaint":
        return <MessageSquareText className="h-4 w-4 text-yellow-500" />;
      case "Transaction":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const userLevel = userProfile?.level ?? 1;
  const dynamicCommissionRate = calculateCommissionRate(userLevel);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Tracking</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Your Activities (Real-time)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading your activities...</p>
              </div>
            ) : trackingItems.length > 0 ? (
              trackingItems.map((item) => {
                const isSeller = item.sellerId === user?.$id;
                const commissionRateDisplay = (dynamicCommissionRate * 100).toFixed(2);
                
                // Calculate expected net amount if commission hasn't been deducted yet
                const expectedCommission = item.amount ? item.amount * dynamicCommissionRate : 0;
                const expectedNet = item.amount ? item.amount - expectedCommission : 0;

                return (
                  <div key={item.id} className="flex items-start space-x-3 p-3 border border-border rounded-md bg-background">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-foreground truncate">{item.description}</p>
                      
                      {item.type === "Transaction" && (
                        <>
                          <p className="text-sm text-muted-foreground">Amount: ₹{item.amount?.toFixed(2)}</p>
                          {isSeller ? (
                            <p className="text-xs text-muted-foreground truncate">You are the seller. Buyer: {item.buyerName || "N/A"}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground truncate">You are the buyer. Seller: {item.sellerName || "N/A"}</p>
                          )}
                          
                          {/* Seller specific status updates */}
                          {isSeller && item.status === "Initiated" && (
                            <p className="text-xs text-yellow-500">Awaiting buyer payment to developer.</p>
                          )}
                          {isSeller && item.status === "Payment Confirmed" && (
                            <p className="text-xs text-blue-500">Payment confirmed by buyer. Developer is processing commission ({commissionRateDisplay}%).</p>
                          )}
                          {isSeller && item.status === "In Progress" && (
                            <p className="text-xs text-orange-500">
                              Commission deducted (₹{item.commissionAmount?.toFixed(2) || expectedCommission.toFixed(2)}). 
                              Awaiting transfer of net amount: ₹{item.netSellerAmount?.toFixed(2) || expectedNet.toFixed(2)}.
                            </p>
                          )}
                          {isSeller && item.status === "Completed" && (
                            <p className="text-xs text-green-500">Payment complete. Net amount ₹{item.netSellerAmount?.toFixed(2)} transferred to your UPI ID.</p>
                          )}

                          {/* Buyer specific status updates */}
                          {!isSeller && item.status === "Initiated" && (
                            <p className="text-xs text-yellow-500">Awaiting your UPI payment confirmation (UTR ID).</p>
                          )}
                          {!isSeller && item.status === "Payment Confirmed" && (
                            <p className="text-xs text-blue-500">Payment confirmed. Developer is verifying and processing the sale.</p>
                          )}
                          {!isSeller && item.status === "Completed" && (
                            <p className="text-xs text-green-500">Transaction complete. Arrange pickup/delivery with seller.</p>
                          )}
                        </>
                      )}
                      <p className="text-sm text-muted-foreground">{item.type} - {item.date}</p>
                      <Badge className={cn("mt-1", getStatusBadgeClass(item.status))}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-4">No activities to track yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;