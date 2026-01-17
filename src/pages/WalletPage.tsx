"use client";

import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Wallet, TrendingUp, Loader2, ArrowUpRight, ArrowDownLeft, 
  Clock, CheckCircle2, XCircle, AlertCircle 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { calculateCommissionRate, formatCommissionRate } from "@/utils/commission";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";

interface TransactionRecord {
  $id: string;
  type: 'buy' | 'rent' | 'service' | 'food';
  amount: number;
  productTitle: string;
  status: string;
  $createdAt: string;
  buyerId: string;
  sellerId: string;
  commissionAmount?: number;
  netSellerAmount?: number;
}

const WalletPage = () => {
  const { user, userProfile } = useAuth();
  const { earnedBalance, spentBalance, isLoading: isBalanceLoading } = useWalletBalance();
  
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Dynamic Commission Calculation
  const userLevel = userProfile?.level ?? 1;
  const dynamicCommissionRateValue = calculateCommissionRate(userLevel);
  const dynamicCommissionRateDisplay = formatCommissionRate(dynamicCommissionRateValue);

  // Fetch Transaction History
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.$id) return;
      setIsHistoryLoading(true);
      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          [
            Query.or([
              Query.equal('buyerId', user.$id),
              Query.equal('sellerId', user.$id)
            ]),
            Query.orderDesc('$createdAt'),
            Query.limit(20) // Get last 20 transactions
          ]
        );
        setTransactions(response.documents as unknown as TransactionRecord[]);
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const getStatusIcon = (status: string) => {
    if (status.includes('completed') || status.includes('paid')) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'failed' || status === 'cancelled') return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const TransactionItem = ({ tx }: { tx: TransactionRecord }) => {
    const isIncome = tx.sellerId === user?.$id;
    const date = new Date(tx.$createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    // For sellers, show the NET amount received (after commission) if available
    const displayAmount = isIncome ? (tx.netSellerAmount || tx.amount) : tx.amount;

    return (
      <div className="flex justify-between items-center p-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isIncome ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {isIncome ? <ArrowDownLeft className="h-4 w-4 text-green-500" /> : <ArrowUpRight className="h-4 w-4 text-red-500" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground line-clamp-1">{tx.productTitle || "Unknown Item"}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{date}</span>
              <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded text-[10px] uppercase">
                {getStatusIcon(tx.status)} {tx.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-bold ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
            {isIncome ? '+' : '-'}₹{displayAmount.toFixed(2)}
          </p>
          {isIncome && tx.commissionAmount && (
            <p className="text-[10px] text-muted-foreground">
              (Comm: -₹{tx.commissionAmount.toFixed(2)})
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24">
      <h1 className="text-3xl font-black italic tracking-tight text-center mb-6 text-foreground">
        MY<span className="text-secondary-neon">WALLET</span>
      </h1>
      
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* --- SUMMARY CARDS --- */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border shadow-md">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Earned</span>
              {isBalanceLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-green-500" />
              ) : (
                <span className="text-2xl font-black text-green-500">₹{earnedBalance.toFixed(0)}</span>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-md">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Spent</span>
              {isBalanceLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-red-500" />
              ) : (
                <span className="text-2xl font-black text-red-500">₹{spentBalance.toFixed(0)}</span>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- COMMISSION INFO --- */}
        <Card className="bg-secondary/5 border-secondary-neon/20 shadow-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 bg-secondary-neon/10 rounded-full">
               <TrendingUp className="h-5 w-5 text-secondary-neon" />
            </div>
            <div>
               <h3 className="font-bold text-sm text-foreground">Level {userLevel} Benefits</h3>
               <p className="text-xs text-muted-foreground mt-1">
                 Current Commission Rate: <span className="font-bold text-secondary-neon">{dynamicCommissionRateDisplay}</span>
               </p>
               <p className="text-[10px] text-muted-foreground/70 mt-1">
                 Level up to reduce fees on your sales.
               </p>
            </div>
          </CardContent>
        </Card>

        {/* --- TRANSACTION HISTORY --- */}
        <Card className="bg-card border-border shadow-lg overflow-hidden">
          <CardHeader className="p-4 bg-muted/20 border-b border-border">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-secondary-neon" /> Recent Activity
            </CardTitle>
          </CardHeader>
          
          <Tabs defaultValue="all" className="w-full">
            <div className="p-2">
                <TabsList className="grid w-full grid-cols-3 bg-muted/50 h-9">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="income" className="text-xs">Income</TabsTrigger>
                    <TabsTrigger value="expenses" className="text-xs">Spent</TabsTrigger>
                </TabsList>
            </div>

            <CardContent className="p-0">
                {isHistoryLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <span className="text-xs">Loading history...</span>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                        <AlertCircle className="h-10 w-10 mb-2" />
                        <span className="text-sm">No transactions yet</span>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px]">
                        <TabsContent value="all" className="m-0">
                            {transactions.map(tx => <TransactionItem key={tx.$id} tx={tx} />)}
                        </TabsContent>
                        <TabsContent value="income" className="m-0">
                            {transactions.filter(t => t.sellerId === user?.$id).length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground">No earnings yet. Start selling!</div>
                            ) : (
                                transactions.filter(t => t.sellerId === user?.$id).map(tx => <TransactionItem key={tx.$id} tx={tx} />)
                            )}
                        </TabsContent>
                        <TabsContent value="expenses" className="m-0">
                            {transactions.filter(t => t.buyerId === user?.$id).length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground">No spending history.</div>
                            ) : (
                                transactions.filter(t => t.buyerId === user?.$id).map(tx => <TransactionItem key={tx.$id} tx={tx} />)
                            )}
                        </TabsContent>
                    </ScrollArea>
                )}
            </CardContent>
          </Tabs>
        </Card>

      </div>
      <MadeWithDyad />
    </div>
  );
};

export default WalletPage;