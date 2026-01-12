"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Truck, DollarSign, Loader2, Utensils, CheckCircle, 
  Handshake, Clock, ShoppingBag, Activity, Camera, 
  AlertTriangle, Eye, ShieldCheck, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { databases, storage, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_COLLEGE_ID_BUCKET_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Query, ID } from "appwrite";
import { useFoodOrders, FoodOrder } from "@/hooks/useFoodOrders";

// --- INTERFACES ---
export interface MarketTransactionItem {
  id: string;
  type: "Transaction" | "Cash Exchange" | "Service" | "Rental";
  productTitle: string;
  amount: number;
  sellerName: string;
  buyerName: string;
  sellerId: string;
  buyerId: string;
  status: string;
  appwriteStatus: string;
  date: string;
  timestamp: number;
  isUserProvider: boolean;
  
  // Handshake Props
  handoverEvidenceUrl?: string;
  returnEvidenceUrl?: string;
  isDisputed?: boolean;
  disputeReason?: string;
  ambassadorDelivery?: boolean;
  ambassadorMessage?: string;
}

export interface FoodOrderItem {
    id: string;
    type: "Food Order";
    offeringTitle: string;
    totalAmount: number;
    providerName: string;
    buyerName: string;
    quantity: number;
    orderStatus: FoodOrder["status"];
    date: string;
    timestamp: number;
    isUserProvider: boolean;
    providerId: string;
}

type TrackingItem = MarketTransactionItem | FoodOrderItem;

// --- UTILS ---
const mapAppwriteStatusToTrackingStatus = (status: string): string => {
  const map: Record<string, string> = {
    "initiated": "Payment Pending",
    "payment_confirmed_to_developer": "Processing",
    "commission_deducted": "Handover Pending", // Renamed for clarity
    "active": "In Use / Active", // New status for Rentals
    "seller_confirmed_delivery": "Delivered",
    "meeting_scheduled": "Meeting Set",
    "completed": "Completed",
    "failed": "Cancelled",
    "disputed": "Disputed / Damage Reported"
  };
  return map[status] || "Pending";
};

// --- COMPONENT: EVIDENCE UPLOAD/VIEW MODAL ---
const EvidenceModal = ({ 
  isOpen, 
  onClose, 
  title, 
  onUpload, 
  isUploading,
  viewOnlyUrl 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  onUpload?: (file: File) => void; 
  isUploading?: boolean;
  viewOnlyUrl?: string;
}) => {
  const [file, setFile] = useState<File | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-secondary-neon" /> {title}
          </DialogTitle>
          <DialogDescription>
            {viewOnlyUrl ? "This is the proof of condition uploaded." : "Take a clear photo of the item to avoid disputes later."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-input rounded-xl bg-muted/20 min-h-[200px]">
          {viewOnlyUrl ? (
            <img src={viewOnlyUrl} alt="Evidence" className="max-h-[300px] rounded-md object-contain shadow-md" />
          ) : (
            <>
              {file ? (
                <div className="relative w-full">
                  <img src={URL.createObjectURL(file)} alt="Preview" className="max-h-[250px] w-full object-contain rounded-md" />
                  <Button size="sm" variant="destructive" className="absolute top-2 right-2 h-7 px-2" onClick={() => setFile(null)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3 py-6 w-full hover:bg-muted/30 transition-colors rounded-lg">
                  <div className="p-4 bg-secondary/10 rounded-full">
                    <Camera className="h-8 w-8 text-secondary-neon" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-foreground">Click to Capture</span>
                    <p className="text-xs text-muted-foreground">Supports JPG, PNG</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                </label>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {!viewOnlyUrl && onUpload && (
            <Button onClick={() => file && onUpload(file)} disabled={!file || isUploading} className="bg-secondary-neon text-primary-foreground font-bold">
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              {isUploading ? "Uploading..." : "Confirm Evidence"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- COMPONENT: TRACKING CARD ---
const TrackingCard = ({ item, onAction }: { item: TrackingItem, onAction: (action: string, id: string, payload?: any) => void }) => {
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceMode, setEvidenceMode] = useState<"upload_handover" | "upload_return" | "view_handover">("view_handover");
  const [isUploading, setIsUploading] = useState(false);

  // Helper to handle uploads
  const handleEvidenceUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const uploadedFile = await storage.createFile(APPWRITE_COLLEGE_ID_BUCKET_ID, ID.unique(), file);
      // Construct URL (Adjust logic if using a different endpoint structure)
      const fileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${APPWRITE_COLLEGE_ID_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
      
      const actionType = evidenceMode === "upload_handover" ? "upload_handover_evidence" : "report_damage_with_evidence";
      onAction(actionType, item.id, { url: fileUrl });
      setShowEvidenceModal(false);
    } catch (e) {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const isMarket = item.type !== "Food Order";
  const marketItem = isMarket ? (item as MarketTransactionItem) : null;

  // Determine Icon
  const getIcon = () => {
    switch (item.type) {
      case "Rental": return <Clock className="h-5 w-5 text-purple-500" />;
      case "Transaction": return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case "Food Order": return <Utensils className="h-5 w-5 text-orange-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className={cn("border-l-4 transition-all bg-card shadow-sm mb-4 group hover:shadow-md", 
      item.isUserProvider ? "border-l-secondary-neon" : "border-l-blue-500",
      marketItem?.isDisputed && "border-l-destructive border-destructive/50 bg-destructive/5"
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-muted/50 rounded-xl border border-border/50 group-hover:border-secondary-neon/30 transition-colors">
                {getIcon()}
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground leading-tight">
                {item.type === 'Food Order' ? (item as FoodOrderItem).offeringTitle : (item as MarketTransactionItem).productTitle}
              </h4>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">{item.type.toUpperCase()} • {item.date}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-wider py-1", marketItem?.isDisputed ? "bg-red-500 text-white border-none" : "bg-muted")}>
            {marketItem?.isDisputed ? "Disputed" : item.status}
          </Badge>
        </div>

        {/* --- HANDSHAKE PROTOCOL UI (Rentals & Sales) --- */}
        {marketItem && (
          <div className="bg-muted/20 p-3 rounded-lg border border-border/50 mb-3 space-y-3">
            
            {/* Status Steps Visualization */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 pb-1">
                <span className={cn(marketItem.handoverEvidenceUrl ? "text-green-500 font-bold" : "")}>1. Proof</span>
                <div className="h-[1px] flex-1 bg-border mx-2" />
                <span className={cn(marketItem.appwriteStatus === 'active' ? "text-blue-500 font-bold" : "")}>2. Active</span>
                <div className="h-[1px] flex-1 bg-border mx-2" />
                <span className={cn(marketItem.status === 'Completed' ? "text-green-500 font-bold" : "")}>3. Done</span>
            </div>

            {/* Evidence Row */}
            <div className="flex items-center gap-3">
                <div className={cn("flex-1 p-2 rounded border text-xs flex items-center justify-between", marketItem.handoverEvidenceUrl ? "bg-green-500/10 border-green-500/20" : "bg-card border-dashed")}>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className={cn("h-4 w-4", marketItem.handoverEvidenceUrl ? "text-green-600" : "text-muted-foreground")} />
                        <span className="font-medium">Condition Proof</span>
                    </div>
                    {marketItem.handoverEvidenceUrl ? (
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEvidenceMode("view_handover"); setShowEvidenceModal(true); }}>
                            <Eye className="h-3 w-3 text-green-600" />
                        </Button>
                    ) : (
                        <span className="text-[9px] italic text-muted-foreground">Required</span>
                    )}
                </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            
            {/* SCENARIO 1: Transaction Started. Seller needs to upload proof. */}
            {item.isUserProvider && !marketItem.handoverEvidenceUrl && (marketItem.appwriteStatus === 'commission_deducted' || marketItem.appwriteStatus === 'initiated') && (
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs font-bold shadow-sm" onClick={() => { setEvidenceMode("upload_handover"); setShowEvidenceModal(true); }}>
                    <Camera className="h-3 w-3 mr-2" /> Upload Handover Proof
                </Button>
            )}

            {/* SCENARIO 2: Proof Uploaded. Buyer needs to Accept. */}
            {!item.isUserProvider && marketItem.handoverEvidenceUrl && marketItem.appwriteStatus !== 'active' && marketItem.appwriteStatus !== 'completed' && (
                <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground text-center">Verify the item matches the photo before accepting.</p>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => { setEvidenceMode("view_handover"); setShowEvidenceModal(true); }}>
                            View Proof
                        </Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 text-xs font-bold" onClick={() => onAction("accept_handover", item.id)}>
                            <Handshake className="h-3 w-3 mr-2" /> Accept & Start
                        </Button>
                    </div>
                </div>
            )}

            {/* SCENARIO 3: Return / End Transaction (Seller Side) */}
            {item.isUserProvider && marketItem.appwriteStatus === 'active' && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                    <p className="text-[10px] text-center text-muted-foreground">Transaction complete? Verify return condition.</p>
                    <div className="flex gap-2">
                        <Button variant="destructive" className="flex-1 h-9 text-xs opacity-90 hover:opacity-100" onClick={() => { setEvidenceMode("upload_return"); setShowEvidenceModal(true); }}>
                            <AlertTriangle className="h-3 w-3 mr-2" /> Report Damage
                        </Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 text-xs font-bold" onClick={() => onAction("confirm_completion", item.id)}>
                            <CheckCircle className="h-3 w-3 mr-2" /> All Good
                        </Button>
                    </div>
                </div>
            )}

            {/* SCENARIO 4: Disputed State */}
            {marketItem.isDisputed && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-destructive">Dispute Reported</p>
                        <p className="text-[10px] text-destructive/80 mt-1">This incident has been flagged. The "Trust Score" of the involved parties is under review.</p>
                    </div>
                </div>
            )}

          </div>
        )}

        {/* Evidence Modal */}
        {showEvidenceModal && marketItem && (
            <EvidenceModal
                isOpen={showEvidenceModal}
                onClose={() => setShowEvidenceModal(false)}
                title={evidenceMode === 'upload_handover' ? "Upload Handover Proof" : evidenceMode === 'upload_return' ? "Upload Damage Proof" : "Proof of Condition"}
                onUpload={handleEvidenceUpload}
                isUploading={isUploading}
                viewOnlyUrl={evidenceMode === 'view_handover' ? marketItem.handoverEvidenceUrl : undefined}
            />
        )}

        {/* Footer Info */}
        <div className="flex justify-between items-center text-[10px] text-muted-foreground/70 mt-1">
           <span>Role: {item.isUserProvider ? "Seller" : "Buyer"}</span>
           <span className="font-mono opacity-50">ID: {item.id.substring(0, 6)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// --- MAIN PAGE ---
const TrackingPage = () => {
  const { user } = useAuth();
  const { orders: foodOrders } = useFoodOrders();
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch Data
  const refreshData = useCallback(async () => {
    if (!user?.$id) return;
    setIsLoading(true);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID, 
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [Query.or([Query.equal('buyerId', user.$id), Query.equal('sellerId', user.$id)]), Query.orderDesc('$createdAt')]
      );

      const transactions = response.documents.map((doc: any) => ({
        id: doc.$id,
        type: doc.type === 'product' ? 'Transaction' : 'Rental', // Basic mapping
        productTitle: doc.productTitle,
        status: mapAppwriteStatusToTrackingStatus(doc.status),
        appwriteStatus: doc.status,
        date: new Date(doc.$createdAt).toLocaleDateString(),
        timestamp: new Date(doc.$createdAt).getTime(),
        amount: doc.amount,
        sellerName: doc.sellerName,
        buyerName: doc.buyerName,
        sellerId: doc.sellerId,
        buyerId: doc.buyerId,
        isUserProvider: doc.sellerId === user.$id,
        handoverEvidenceUrl: doc.handoverEvidenceUrl,
        isDisputed: doc.isDisputed
      } as MarketTransactionItem));

      const foodItems = foodOrders.map(o => ({
        id: o.$id, type: "Food Order", offeringTitle: o.offeringTitle, status: o.status,
        totalAmount: o.totalAmount, providerName: o.providerName, buyerName: o.buyerName,
        isUserProvider: o.providerId === user.$id, timestamp: new Date(o.$createdAt).getTime(),
        date: new Date(o.$createdAt).toLocaleDateString(), quantity: o.quantity, deliveryLocation: o.deliveryLocation, providerId: o.providerId
      } as FoodOrderItem));

      setItems([...transactions, ...foodItems].sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) { toast.error("Sync failed."); } 
    finally { setIsLoading(false); }
  }, [user, foodOrders]);

  useEffect(() => { refreshData(); }, [refreshData]);

  // 2. Handle Actions
  const handleAction = async (action: string, id: string, payload?: any) => {
    try {
        if (action === "upload_handover_evidence") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, {
                handoverEvidenceUrl: payload.url,
                // Status remains same until buyer accepts, or you can use a specific 'evidence_uploaded' status
            });
            toast.success("Proof uploaded. Ask buyer to accept it.");
        }
        else if (action === "accept_handover") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, {
                status: "active" // Transaction formally starts now
            });
            toast.success("You accepted the condition. Liability starts now.");
        }
        else if (action === "confirm_completion") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, {
                status: "completed"
            });
            toast.success("Transaction closed successfully.");
        }
        else if (action === "report_damage_with_evidence") {
            // Flag as disputed and save the proof
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, {
                status: "disputed",
                isDisputed: true,
                returnEvidenceUrl: payload.url,
                disputeReason: "Item returned with damage."
            });
            toast.error("Dispute raised. Admin will review Trust Scores.");
        }
        refreshData();
    } catch (e) {
        console.error(e);
        toast.error("Action failed.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black italic tracking-tight text-foreground">
                ACTIVITY<span className="text-secondary-neon">LOG</span>
            </h1>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        
        <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1">
                <TabsTrigger value="all" className="text-xs font-bold">Active</TabsTrigger>
                <TabsTrigger value="history" className="text-xs font-bold">History</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4 pt-4">
                 {items.filter(i => i.status !== 'Completed' && i.status !== 'Cancelled' && !(i as any).isDisputed).map(item => (
                    <TrackingCard key={item.id} item={item} onAction={handleAction} />
                ))}
                {!isLoading && items.filter(i => i.status !== 'Completed').length === 0 && (
                    <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">No active tasks.</div>
                )}
            </TabsContent>
            <TabsContent value="history" className="space-y-4 pt-4">
                 {items.filter(i => i.status === 'Completed' || i.status === 'Cancelled' || (i as any).isDisputed).map(item => (
                    <TrackingCard key={item.id} item={item} onAction={handleAction} />
                ))}
            </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;