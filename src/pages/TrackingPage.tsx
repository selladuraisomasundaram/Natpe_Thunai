"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  IndianRupee, Loader2, Utensils, CheckCircle, 
  Handshake, Clock, ShoppingBag, Activity, Camera, 
  AlertTriangle, ShieldCheck, XCircle, PackageCheck,
  MessageCircle, Briefcase, Wallet, Lock, MapPin, Ban, Hourglass,
  CheckCircle2, Circle, Edit3, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  databases, 
  APPWRITE_DATABASE_ID, 
  APPWRITE_TRANSACTIONS_COLLECTION_ID, 
  APPWRITE_FOOD_ORDERS_COLLECTION_ID, 
  APPWRITE_PRODUCTS_COLLECTION_ID, 
  APPWRITE_CHAT_ROOMS_COLLECTION_ID 
} from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Query, ID } from "appwrite";
import { useFoodOrders, FoodOrder } from "@/hooks/useFoodOrders";

// --- CONFIG ---
const CLOUD_NAME = "dpusuqjvo";
const UPLOAD_PRESET = "natpe_thunai_preset";

// --- HELPERS ---
const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.secure_url; 
  } catch (error: any) {
    throw new Error("Upload failed");
  }
};

const mapAppwriteStatusToTrackingStatus = (status: string): string => {
  const map: Record<string, string> = {
    "negotiating": "Negotiating",
    "initiated": "Payment Pending",
    "payment_confirmed_to_developer": "Verifying Payment",
    "commission_deducted": "Ready to Start",
    "active": "In Progress",
    "seller_confirmed_delivery": "Delivered / Reviewing",
    "meeting_scheduled": "Meeting Scheduled",
    "completed": "Completed",
    "failed": "Cancelled",
    "disputed": "Disputed"
  };
  return map[status] || status;
};

// --- INTERFACES ---
export interface BaseTrackingItem {
  id: string;
  description: string;
  date: string;
  status: string;
  isUserProvider: boolean;
  timestamp: number;
}

export interface MarketTransactionItem extends BaseTrackingItem {
  type: "Transaction" | "Cash Exchange" | "Service" | "Rental" | "Errand" | "Collaboration";
  productId?: string;
  productTitle: string;
  amount: number;
  sellerName: string;
  buyerName: string;
  sellerId: string;
  buyerId: string;
  appwriteStatus: string;
  transactionId?: string;
  handoverEvidenceUrl?: string;
  returnEvidenceUrl?: string;
  isDisputed?: boolean;
}

export interface FoodOrderItem extends BaseTrackingItem {
    id: string;
    type: "Food Order";
    offeringTitle: string;
    totalAmount: number;
    providerName: string;
    buyerName: string;
    providerId: string;
    buyerId: string;
    quantity: number;
    deliveryLocation: string;
    orderStatus: FoodOrder["status"];
}

type TrackingItem = MarketTransactionItem | FoodOrderItem;

// --- COMPONENT: PROGRESS STEPPER ---
const StatusStepper = ({ currentStep }: { currentStep: number }) => {
    const steps = ["Ordered", "Paid", "In Progress", "Delivered", "Done"];
    
    return (
        <div className="flex items-center justify-between w-full px-1 my-4 relative">
            <div className="absolute left-0 top-2.5 w-full h-0.5 bg-muted -z-10" />
            <div 
                className="absolute left-0 top-2.5 h-0.5 bg-secondary-neon transition-all duration-500 -z-10" 
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} 
            />

            {steps.map((label, index) => {
                const isActive = index <= currentStep;
                const isCurrent = index === currentStep;
                
                return (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                        <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background",
                            isActive ? "border-secondary-neon text-secondary-neon" : "border-muted text-muted-foreground",
                            isCurrent && "ring-2 ring-secondary-neon/30 scale-110"
                        )}>
                            {isActive ? <div className="w-2.5 h-2.5 bg-secondary-neon rounded-full" /> : <div className="w-2 h-2 bg-muted rounded-full" />}
                        </div>
                        <span className={cn(
                            "text-[9px] font-medium transition-colors", 
                            isActive ? "text-foreground" : "text-muted-foreground",
                            isCurrent && "text-secondary-neon font-bold"
                        )}>
                            {label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// --- COMPONENT: EVIDENCE MODAL ---
const EvidenceModal = ({ isOpen, onClose, title, onUpload, isUploading, viewOnlyUrl }: any) => {
  const [file, setFile] = useState<File | null>(null);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-secondary-neon"/> {title}</DialogTitle></DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-input rounded-xl bg-muted/20 min-h-[200px]">
          {viewOnlyUrl ? <img src={viewOnlyUrl} alt="Evidence" className="max-h-[300px] rounded-md object-contain" /> : (
            file ? (
                <div className="relative w-full"><img src={URL.createObjectURL(file)} alt="Preview" className="max-h-[250px] w-full object-contain rounded-md" /><Button size="sm" variant="destructive" className="absolute top-2 right-2 h-7 px-2" onClick={() => setFile(null)}><XCircle className="h-4 w-4" /></Button></div>
            ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3 py-6 w-full hover:bg-muted/30 transition-colors rounded-lg"><Camera className="h-8 w-8 text-secondary-neon" /><span className="text-sm">Click to Capture</span><input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} /></label>
            )
          )}
        </div>
        <DialogFooter>
          {!viewOnlyUrl && onUpload && <Button onClick={() => file && onUpload(file)} disabled={!file || isUploading} className="bg-secondary-neon text-primary-foreground">{isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Evidence"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- COMPONENT: TRACKING CARD ---
const TrackingCard = ({ item, onAction, currentUser, onChat }: { item: TrackingItem, onAction: (action: string, id: string, payload?: any) => void, currentUser: any, onChat: (item: TrackingItem) => void }) => {
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newAmount, setNewAmount] = useState<string>(item.type === 'Errand' ? (item as MarketTransactionItem).amount.toString() : "0");
  const navigate = useNavigate();

  const handleEvidenceUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fileUrl = await uploadToCloudinary(file);
      const actionType = evidenceMode === "upload_handover" ? "upload_handover_evidence" : "report_damage_with_evidence";
      onAction(actionType, item.id, { url: fileUrl });
      setShowEvidenceModal(false);
    } catch (e: any) { toast.error(`Upload failed: ${e.message}`); } 
    finally { setIsUploading(false); }
  };

  const isMarket = item.type !== "Food Order";
  const marketItem = isMarket ? (item as MarketTransactionItem) : null;
  const foodItem = !isMarket ? (item as FoodOrderItem) : null;
  
  let currentStep = 0;
  if (marketItem) {
      if (marketItem.appwriteStatus === 'completed') currentStep = 4;
      else if (marketItem.appwriteStatus === 'seller_confirmed_delivery') currentStep = 3;
      else if (marketItem.appwriteStatus === 'active') currentStep = 2;
      else if (marketItem.appwriteStatus === 'commission_deducted' || marketItem.appwriteStatus === 'payment_confirmed_to_developer') currentStep = 1;
      else currentStep = 0;
  } else if (foodItem) {
      if (foodItem.orderStatus === 'Delivered' || (foodItem as any).status === 'completed') currentStep = 4;
      else if (foodItem.orderStatus === 'Out for Delivery') currentStep = 3;
      else if (foodItem.orderStatus === 'Preparing') currentStep = 2;
      else if (foodItem.orderStatus === 'Confirmed') currentStep = 1;
      else currentStep = 0;
  }

  const isCompleted = currentStep === 4 || item.status === 'Cancelled' || item.status === 'Disputed';

  const getIcon = () => {
    switch (item.type) {
      case "Rental": return <Clock className="h-5 w-5 text-purple-500" />;
      case "Transaction": return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case "Service": return <Briefcase className="h-5 w-5 text-indigo-500" />;
      case "Errand": return <PackageCheck className="h-5 w-5 text-pink-500" />;
      case "Food Order": return <Utensils className="h-5 w-5 text-orange-500" />;
      case "Cash Exchange": return <IndianRupee className="h-5 w-5 text-green-600" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const initiatePayment = () => {
      if(!marketItem) return;
      if(marketItem.amount <= 0) {
          toast.error("Poster hasn't set the reward amount yet.");
          return;
      }
      const queryParams = new URLSearchParams({
        amount: marketItem.amount.toString(),
        txnId: marketItem.id,
        title: marketItem.productTitle
      }).toString();
      navigate(`/escrow-payment?${queryParams}`);
  };

  const partnerName = item.isUserProvider ? (item as any).buyerName : (item.type === 'Food Order' ? (item as any).providerName : (item as any).sellerName);

  return (
    <Card className={cn("border-l-4 transition-all bg-card shadow-sm mb-4 group hover:shadow-md animate-in fade-in zoom-in-95 duration-300", 
      item.isUserProvider ? "border-l-secondary-neon" : "border-l-blue-500",
      marketItem?.isDisputed && "border-l-destructive border-destructive/50"
    )}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-muted/50 rounded-xl border border-border/50">{getIcon()}</div>
            <div>
              <h4 className="font-bold text-sm text-foreground leading-tight">
                {item.type === 'Food Order' ? (item as FoodOrderItem).offeringTitle : (item as MarketTransactionItem).productTitle}
              </h4>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">{item.type.toUpperCase()} • {item.date}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-wider py-1", marketItem?.isDisputed ? "bg-red-500 text-white border-none" : "bg-muted")}>
            {item.status}
          </Badge>
        </div>

        {!isCompleted && item.type !== 'Cash Exchange' && (
            <StatusStepper currentStep={currentStep} />
        )}

        {/* --- DYNAMIC PRICE FOR ERRANDS (POSTER ONLY) --- */}
        {!isCompleted && item.type === 'Errand' && marketItem && (
          <div className="mb-4 p-3 bg-secondary-neon/5 rounded-xl border border-secondary-neon/20 space-y-2">
              <Label className="text-[10px] font-black uppercase text-secondary-neon tracking-widest">Errand Compensation</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                   <Input 
                      type="number" 
                      value={newAmount} 
                      onChange={(e) => setNewAmount(e.target.value)} 
                      disabled={!item.isUserProvider || marketItem.appwriteStatus !== 'initiated'} // Poster = Provider in this logic
                      className="h-9 pl-8 text-sm font-bold bg-background"
                      placeholder="Enter amount..."
                   />
                </div>
                {item.isUserProvider && marketItem.appwriteStatus === 'initiated' && (
                  <Button size="sm" className="h-9 bg-secondary-neon text-primary-foreground px-3" onClick={() => onAction("update_errand_price", item.id, { amount: parseFloat(newAmount) })}>
                    <Save className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {!item.isUserProvider && marketItem.amount <= 0 && (
                <p className="text-[10px] text-muted-foreground animate-pulse italic">Waiting for Poster to set the reward...</p>
              )}
          </div>
        )}

        <div className="mb-3 w-full space-y-2">
            <Button size="sm" variant="outline" className={cn("h-8 gap-2 w-full transition-all", isCompleted ? "bg-muted/50 text-muted-foreground border-dashed" : "border-secondary-neon/50 text-secondary-neon hover:bg-secondary-neon/10")} onClick={() => onChat(item)} disabled={isCompleted}>
                {isCompleted ? <Ban className="h-3 w-3" /> : <MessageCircle className="h-4 w-4" />}
                {isCompleted ? "Chat Locked (Deal Closed)" : `Chat with ${partnerName ? partnerName.split(' ')[0] : 'User'}`}
            </Button>

            {/* PAY BUTTON */}
            {!isCompleted && marketItem && item.type !== 'Cash Exchange' && !item.isUserProvider && (marketItem.appwriteStatus === 'negotiating' || marketItem.appwriteStatus === 'initiated') && (
                <Button size="sm" className="h-8 w-full bg-green-600 hover:bg-green-700 text-white gap-2 font-semibold shadow-sm animate-pulse" onClick={initiatePayment} disabled={marketItem.amount <= 0}>
                    <Wallet className="h-3 w-3" /> {marketItem.amount > 0 ? `Pay Escrow (₹${marketItem.amount})` : 'Awaiting Poster Price'}
                </Button>
            )}
        </div>

        {marketItem && item.type !== 'Cash Exchange' && !isCompleted && item.type !== 'Errand' && (
          <div className="bg-muted/20 p-3 rounded-lg border border-border/50 mb-3 space-y-3">
            <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Amount: <b className="text-foreground flex items-center gap-0.5"><IndianRupee className="h-3 w-3"/>{marketItem.amount}</b></span>
            </div>
            {/* ... Other Market logic exists here (Handover, Mark Delivered etc) ... */}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- DATA PROCESSING HELPERS ---
const processTransactionDoc = (doc: any, currentUserId: string): MarketTransactionItem => {
    let type: MarketTransactionItem['type'] = 'Transaction';
    if (doc.type === 'service') type = 'Service';
    else if (doc.type === 'errand') type = 'Errand';
    else if (doc.type === 'rent') type = 'Rental';
    else if (doc.type === 'cash-exchange') type = 'Cash Exchange';

    return {
        id: doc.$id,
        type: type,
        productId: doc.productId,
        productTitle: doc.productTitle || "Untitled Item",
        description: doc.productTitle,
        status: mapAppwriteStatusToTrackingStatus(doc.status),
        appwriteStatus: doc.status,
        date: new Date(doc.$createdAt).toLocaleDateString(),
        timestamp: new Date(doc.$createdAt).getTime(),
        amount: doc.amount || 0,
        sellerName: doc.sellerName,
        buyerName: doc.buyerName,
        sellerId: doc.sellerId,
        buyerId: doc.buyerId,
        isUserProvider: doc.sellerId === currentUserId,
        handoverEvidenceUrl: doc.handoverEvidenceUrl,
        isDisputed: doc.isDisputed
    };
};

const processFoodDoc = (doc: any, currentUserId: string): FoodOrderItem => {
    return {
        id: doc.$id,
        type: "Food Order",
        offeringTitle: doc.offeringTitle,
        description: doc.offeringTitle,
        status: doc.status,
        orderStatus: doc.status,
        totalAmount: doc.totalAmount,
        providerName: doc.providerName,
        buyerName: doc.buyerName,
        providerId: doc.providerId,
        buyerId: doc.buyerId,
        isUserProvider: doc.providerId === currentUserId,
        timestamp: new Date(doc.$createdAt).getTime(),
        date: new Date(doc.$createdAt).toLocaleDateString(),
        quantity: doc.quantity,
        deliveryLocation: doc.deliveryLocation
    };
};

// --- MAIN PAGE ---
const TrackingPage = () => {
  const { user, userProfile } = useAuth();
  const { orders: initialFoodOrders } = useFoodOrders();
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refreshData = useCallback(async () => {
    if (!user?.$id) return;
    setIsLoading(true);
    try {
      const response = await databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, [Query.or([Query.equal('buyerId', user.$id), Query.equal('sellerId', user.$id)]), Query.orderAsc('$createdAt')]);
      const uniqueDealsMap = new Map<string, TrackingItem>();
      response.documents.forEach((doc: any) => {
        const item = processTransactionDoc(doc, user.$id);
        const dealKey = item.productId || item.id; 
        if (!uniqueDealsMap.has(dealKey)) uniqueDealsMap.set(dealKey, item);
      });
      initialFoodOrders.forEach(o => {
        const item = processFoodDoc(o, user.$id);
        const dealKey = `${item.offeringTitle}_${item.providerId}`;
        if (!uniqueDealsMap.has(dealKey)) uniqueDealsMap.set(dealKey, item);
      });
      setItems(Array.from(uniqueDealsMap.values()).sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) { toast.error("Sync failed."); } 
    finally { setIsLoading(false); }
  }, [user, initialFoodOrders]);

  useEffect(() => {
    if (!user?.$id) return;
    refreshData();
    const unsubscribe = databases.client.subscribe(
        [`databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`, `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_FOOD_ORDERS_COLLECTION_ID}.documents`],
        (response) => {
            const doc = response.payload as any;
            const isRelevant = doc.buyerId === user.$id || doc.sellerId === user.$id || doc.providerId === user.$id;
            if (isRelevant) refreshData();
        }
    );
    return () => unsubscribe();
  }, [user, refreshData]);

  const handleAction = async (action: string, id: string, payload?: any) => {
    try {
        if (action === "update_errand_price") {
            // UPDATING COMPENSATION IN TRANSACTION
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { amount: payload.amount });
            toast.success("Reward amount updated! Runner can now pay.");
        }
        else if (action === "verify_payment") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "payment_confirmed_to_developer", transactionId: payload.utr });
            toast.success("Payment verified! Work can begin.");
        }
        // ... Other actions (confirm receipt etc) remain the same ...
        else if (action === "confirm_receipt_sale") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "completed" });
            toast.success("Completed! Chat closed.");
        }
    } catch (e: any) { 
        toast.error("Action Failed: " + (e.message || "Unknown error")); 
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black italic tracking-tight text-foreground">ACTIVITY<span className="text-secondary-neon">LOG</span></h1>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1">
                <TabsTrigger value="all" className="text-xs font-bold">Active</TabsTrigger>
                <TabsTrigger value="history" className="text-xs font-bold">History</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4 pt-4">
                 {items.filter(i => !i.status.toLowerCase().includes('completed') && i.status !== 'Cancelled').length === 0 && <div className="text-center text-muted-foreground text-sm py-10">No active tasks.</div>}
                 {items.filter(i => !i.status.toLowerCase().includes('completed') && i.status !== 'Cancelled').map(item => (
                    <TrackingCard key={item.id} item={item} onAction={handleAction} currentUser={user} onChat={(i) => navigate(`/chat/${i.id}`)} />
                ))}
            </TabsContent>
            <TabsContent value="history" className="space-y-4 pt-4">
                 {items.filter(i => i.status.toLowerCase().includes('completed') || i.status === 'Cancelled').map(item => (
                    <TrackingCard key={item.id} item={item} onAction={handleAction} currentUser={user} onChat={(i) => navigate(`/chat/${i.id}`)} />
                ))}
            </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;