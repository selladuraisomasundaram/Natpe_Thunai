import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { databases, appwriteConfig } from "@/lib/appwrite";
import { Query } from "appwrite";

const OneSignalDebug = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);

  // 1. Define addLog INSIDE the component so it can use setLogs
  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // 2. Define saveToAppwrite INSIDE the component
  const saveToAppwrite = async (playerId: string) => {
    try {
      addLog(`💾 Saving ID: ${playerId}`);

      const profileRes = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userProfilesCollectionId,
        [Query.equal("userId", user!.$id)]
      );

      if (profileRes.total === 0) {
        addLog("❌ Profile Document Not Found!");
        return;
      }

      const docId = profileRes.documents[0].$id;
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userProfilesCollectionId,
        docId,
        { oneSignalPlayerId: playerId }
      );
      addLog("✅ SUCCESS! ID Saved to Appwrite.");
    } catch (e: any) {
      addLog(`❌ SAVE FAILED: ${e.message}`);
      addLog(`💡 HINT: Check Appwrite Permissions for 'Update'`);
    }
  };

  // 3. Define forceSync INSIDE the component (using your updated logic)
  const forceSync = async () => {
    // A. Check if we are actually in the app
    const isMedian =
      navigator.userAgent.includes("wv") ||
      window.location.href.includes("median");
      
    if (!isMedian) {
      addLog("⚠️ Not in Median App (Browser Mode)");
      // Note: We don't return here so you can verify logic in browser if needed, 
      // but strictly speaking, the bridge won't exist.
      // return; 
    }

    addLog("🚀 Requesting Info via Promise...");

    try {
      // B. WAIT for the bridge to be ready (Critical Step)
      if (typeof (window as any).median === "undefined") {
        addLog("⏳ Waiting for Median Bridge...");
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Give it 2 seconds
      }

      // C. Call the Native Bridge directly using await
      if ((window as any).median?.onesignal?.onesignalInfo) {
          const data = await (window as any).median.onesignal.onesignalInfo();
          addLog(`✅ DATA RECEIVED: ${JSON.stringify(data)}`);

          if (data?.oneSignalUserId) {
            await saveToAppwrite(data.oneSignalUserId);
          } else {
            addLog("❌ oneSignalUserId is missing in response");
          }
      } else {
          throw new Error("median.onesignal.onesignalInfo not found");
      }

    } catch (error: any) {
      addLog(`💥 BRIDGE ERROR: ${error.message || JSON.stringify(error)}`);

      // Fallback: Older Median versions might not support promises
      addLog("🔄 Trying Legacy Callback...");
      
      // Define callback listener globally
      (window as any).median_onesignal_info = async (data: any) => {
        addLog(`📲 CALLBACK DATA: ${JSON.stringify(data)}`);
        if (data?.oneSignalUserId) {
          await saveToAppwrite(data.oneSignalUserId);
        }
      };

      if ((window as any).median?.onesignal?.info) {
        (window as any).median.onesignal.info();
      }
    }
  };

  const checkEnvironment = () => {
    const isMedian =
      window.location.href.includes("median") ||
      navigator.userAgent.includes("wv");
    const hasBridge = (window as any).median ? "Yes" : "No";
    addLog(`ENV CHECK: Median=${isMedian}, BridgeObject=${hasBridge}`);
  };

  return (
    <Card className="p-4 m-4 bg-black text-green-400 font-mono text-xs border-2 border-green-500 overflow-hidden relative z-50">
      <h3 className="font-bold mb-2 text-white">OneSignal Debugger</h3>
      <div className="space-y-2 mb-4">
        <p className="text-white">User: {user?.$id || "None"}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={checkEnvironment}>
            Check Env
          </Button>
          <Button
            size="sm"
            className="bg-green-600 text-white"
            onClick={forceSync}
          >
            Force Sync
          </Button>
        </div>
      </div>
      <div className="h-40 overflow-y-auto bg-gray-900 p-2 rounded border border-gray-700 whitespace-pre-wrap">
        {logs.length === 0
          ? "Waiting for logs..."
          : logs.map((log, i) => (
              <div key={i} className="mb-1 border-b border-gray-800 pb-1">
                {log}
              </div>
            ))}
      </div>
    </Card>
  );
};

// 4. THIS IS CRITICAL - Fixes the "No default export" error
export default OneSignalDebug;