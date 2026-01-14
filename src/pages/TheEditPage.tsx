"use client";

import React, { useEffect, useState } from "react";
import { ExecutionMethod } from "appwrite"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Sparkles, ExternalLink } from "lucide-react"; // Added ExternalLink icon
import { MadeWithDyad } from "@/components/made-with-dyad";
import { databases, functions, APPWRITE_DATABASE_ID } from "@/lib/appwrite"; 

// --- CONFIGURATION ---
const COLLECTION_ID = "affiliate_listings";
const FUNCTION_ID = "YOUR_FUNCTION_ID"; // <--- Replace with your actual Function ID

interface Deal {
  $id: string;
  title: string;
  description: string;
  // We support multiple casing variations to be safe
  originalURL?: string; 
  originalurl?: string;
  image_url?: string;
  brand?: string;
  category?: string;
}

const TheEditPage = () => {
  const { userProfile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track which deal is loading, and which is ready
  const [activeGen, setActiveGen] = useState<string | null>(null);
  const [readyLinks, setReadyLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID, 
            COLLECTION_ID
        );
        setDeals(response.documents as unknown as Deal[]);
      } catch (error: any) {
        console.error("Appwrite Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (APPWRITE_DATABASE_ID && COLLECTION_ID) {
      fetchListings();
    } else {
      setLoading(false);
    }
  }, []);

  // --- MOBILE DEEP LINK TRIGGER ---
  const triggerDeepLink = (url: string) => {
    // 1. Create an invisible anchor tag
    const link = document.createElement('a');
    link.href = url;
    link.target = "_self"; // Keep in same tab to allow app interception
    link.rel = "noopener noreferrer";
    link.style.display = 'none';
    
    // 2. Add to body, click it, then remove it
    document.body.appendChild(link);
    link.click(); // This simulates a real user click
    
    setTimeout(() => {
        if (document.body.contains(link)) {
            document.body.removeChild(link);
        }
    }, 500);
  };

  const handleLootClick = async (listingId: string) => {
    // Check if we already generated this link (Avoid re-fetching)
    if (readyLinks[listingId]) {
        triggerDeepLink(readyLinks[listingId]);
        return;
    }

    if (!userProfile?.$id) return toast.error("Please login to access deals.");
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let newWindow: Window | null = null;

    // DESKTOP: Open new tab immediately (Anti-popup blocker)
    if (!isMobile) {
        newWindow = window.open("", "_blank");
        if (newWindow) {
            newWindow.document.write(`
                <html><body style="background:#09090b;color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
                <div style="border:4px solid #333;border-top:4px solid #10b981;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin-bottom:20px;"></div>
                <h2 style="margin:0;">Securing Deal...</h2>
                <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                </body></html>
            `);
        }
    }

    setActiveGen(listingId);

    try {
      const result = await functions.createExecution(
        FUNCTION_ID,                  
        JSON.stringify({              
          listingId: listingId, 
          userId: userProfile.$id 
        }), 
        false,                       
        '/',                          
        ExecutionMethod.POST          
      );
      
      let data;
      try {
          data = JSON.parse(result.responseBody);
      } catch (e) {
          if (newWindow) newWindow.close();
          throw new Error("Invalid server response");
      }
      
      if (!data.success || !data.cueLink) {
          if (newWindow) newWindow.close();
          throw new Error(data.error || "Link generation failed");
      }

      const finalLink = data.cueLink;
      
      // Save link so we don't fetch again if clicked twice
      setReadyLinks(prev => ({ ...prev, [listingId]: finalLink }));

      if (isMobile) {
          // --- MOBILE APP OPENING LOGIC ---
          toast.success("Opening App...");
          
          // Use the "Anchor Injection" method
          triggerDeepLink(finalLink);
          
          // Fallback: If the app doesn't open in 2 seconds, redirect normally
          setTimeout(() => {
             window.location.href = finalLink;
          }, 1500);

      } else {
          // --- DESKTOP LOGIC ---
          if (newWindow) {
              newWindow.location.href = finalLink;
          } else {
              window.open(finalLink, "_blank");
          }
      }

    } catch (err: any) {
      if (newWindow) newWindow.close();
      console.error("Execution Error:", err);
      toast.error(`Error: ${err.message || "Failed to open deal"}`);
    } finally {
      setActiveGen(null);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-secondary-neon h-8 w-8" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-black italic text-foreground flex justify-center items-center gap-2">
          THE EDIT <Sparkles className="text-secondary-neon h-6 w-6" />
        </h1>
        <p className="text-muted-foreground mt-2">Premium Student Loot • Curated Daily</p>
      </header>

      {deals.length === 0 ? (
        <div className="text-center p-10 border border-dashed rounded-lg border-border">
          <p className="text-muted-foreground">No deals found.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {deals.map((deal) => (
            <Card key={deal.$id} className="bg-card border-border overflow-hidden flex flex-col hover:border-secondary-neon transition-all duration-300">
              {deal.image_url && (
                <div className="h-48 w-full bg-muted relative">
                  <img src={deal.image_url} alt={deal.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                  <div className="absolute top-2 right-2 bg-black/80 text-secondary-neon text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">
                    {deal.brand || "LOOT"}
                  </div>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg leading-tight">{deal.title}</CardTitle>
                {deal.category && <p className="text-xs text-secondary-neon uppercase font-bold">{deal.category}</p>}
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <p className="text-sm text-muted-foreground mb-6 line-clamp-3">{deal.description}</p>
                <Button 
                  onClick={() => handleLootClick(deal.$id)}
                  disabled={activeGen === deal.$id}
                  className={`w-full font-bold transition-all ${
                    readyLinks[deal.$id] 
                        ? "bg-green-500 hover:bg-green-600 text-white" 
                        : "bg-foreground text-background hover:bg-secondary-neon hover:text-black"
                  }`}
                >
                  {activeGen === deal.$id ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                        Fetching...
                    </>
                  ) : readyLinks[deal.$id] ? (
                    <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Again
                    </>
                  ) : (
                    <>
                        <ShoppingCart className="h-4 w-4 mr-2" /> 
                        Get Loot
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <MadeWithDyad />
    </div>
  );
};

export default TheEditPage;