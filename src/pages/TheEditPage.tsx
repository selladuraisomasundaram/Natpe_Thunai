"use client";

import React, { useEffect, useState } from "react";
import { ExecutionMethod } from "appwrite"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Sparkles } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { databases, functions, APPWRITE_DATABASE_ID } from "@/lib/appwrite"; 

// --- CONFIGURATION ---
const COLLECTION_ID = "affiliate_listings";
const FUNCTION_ID = "6953da45001e5ab7ad94";

interface Deal {
  $id: string;
  title: string;
  description: string;
  original_url: string;
  image_url?: string;
  brand?: string;
  category?: string;
}

const TheEditPage = () => {
  const { userProfile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGen, setActiveGen] = useState<string | null>(null);

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
        toast.error("Failed to load deals.");
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

  const handleLootClick = async (listingId: string) => {
    if (!userProfile?.$id) return toast.error("Please login to access deals.");
    
    // 1. OPEN WINDOW IMMEDIATELY (Bypass Popup Blocker)
    // We inject a nice loading spinner so the user knows something is happening.
    const newWindow = window.open("", "_blank");
    
    if (newWindow) {
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Generating Link...</title>
                <style>
                    body { background-color: #09090b; color: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, -apple-system, sans-serif; margin: 0; }
                    .loader { border: 4px solid #333; border-top: 4px solid #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    h2 { font-weight: 600; letter-spacing: -0.5px; }
                    p { color: #888; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="loader"></div>
                <h2>Securing your loot...</h2>
                <p>Please wait while we generate your unique link.</p>
            </body>
            </html>
        `);
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
      
      const responseBody = result.responseBody;
      let data;
      
      try {
          data = JSON.parse(responseBody);
      } catch (e) {
          if (newWindow) newWindow.close();
          throw new Error("Invalid response from server");
      }
      
      if (result.responseStatusCode >= 400) {
          if (newWindow) newWindow.close();
          throw new Error(data.error || "Function execution failed");
      }

      // Check all possible casing for the link
      const finalLink = data.cueLink || data.cuelink || data.url || data.link;

      if (finalLink && newWindow) {
        // 2. ROBUST REDIRECT STRATEGY
        // A. Try direct assignment (Fastest)
        newWindow.location.href = finalLink;

        // B. Fallback: If browser blocked the redirect, show a button (Safety Net)
        // We overwrite the loading screen with a "Success" screen containing the link.
        newWindow.document.body.innerHTML = `
            <style>
                body { background-color: #09090b; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center; }
                .btn { background-color: #10b981; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: opacity 0.2s; margin-top: 20px; display: inline-block; }
                .btn:hover { opacity: 0.9; }
                h2 { margin-bottom: 10px; }
            </style>
            <h2>Link Ready!</h2>
            <p>If you weren't redirected automatically, click below:</p>
            <a href="${finalLink}" class="btn">Go to Deal &rarr;</a>
            <script>
                // Try one more JS redirect just in case
                window.location.replace("${finalLink}");
            </script>
        `;
        
        toast.success("Redirecting to loot!");
      } else {
        if (newWindow) newWindow.close();
        console.error("SERVER RESPONSE:", data); 
        toast.error("Link generated but URL is missing."); 
      }

    } catch (err: any) {
      if (newWindow) newWindow.close();
      console.error("Execution Error:", err);
      toast.error(err.message || "Failed to generate link");
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
          <p className="text-muted-foreground">No deals found today.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {deals.map((deal) => (
            <Card key={deal.$id} className="bg-card border-border overflow-hidden flex flex-col hover:border-secondary-neon transition-all duration-300">
              {deal.image_url && (
                <div className="h-48 w-full bg-muted relative">
                  <img src={deal.image_url} alt={deal.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                  <div className="absolute top-2 right-2 bg-black/80 text-secondary-neon text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">
                    {deal.brand || "EXCLUSIVE"}
                  </div>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg leading-tight">{deal.title}</CardTitle>
                {deal.category && <p className="text-xs text-secondary-neon uppercase font-bold tracking-wide">{deal.category}</p>}
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <p className="text-sm text-muted-foreground mb-6 line-clamp-3">{deal.description}</p>
                <Button 
                  onClick={() => handleLootClick(deal.$id)}
                  disabled={activeGen === deal.$id}
                  className="w-full bg-foreground text-background hover:bg-secondary-neon hover:text-black font-bold transition-all"
                >
                  {activeGen === deal.$id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                  {activeGen === deal.$id ? "Generating..." : "Get Loot"}
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