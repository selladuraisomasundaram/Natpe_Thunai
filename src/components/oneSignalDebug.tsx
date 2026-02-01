import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { databases, appwriteConfig } from "@/lib/appwrite";
import { Query } from "appwrite";

const OneSignalDebug = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  // 1. Check if the Native Bridge exists
  const checkEnvironment = () => {
    const isMedian = window.location.href.includes('median') || navigator.userAgent.includes('wv');
    const hasBridge = (window as any).median ? "Yes" : "No";
    addLog(`ENV CHECK: Median=${isMedian}, BridgeObject=${hasBridge}`);
  };

  // 2. Force the Sync manually to see errors
  const forceSync = async () => {
    if (!user?.$id) {
        addLog("❌ No User Logged In");
        return;
    }
    
    addLog("🚀 Triggering Median Info...");
    
    // Define the listener
    (window as any).median_onesignal_info = async (data: any) => {
        addLog(`📲 RECEIVED DATA: ${JSON.stringify(data)}`);
        if (data?.oneSignalUserId) {
            await saveToAppwrite(data.oneSignalUserId);
        } else {
            addLog("⚠️ Data received but oneSignalUserId is MISSING!");
        }
    };

    // Fire the command
    window.location.href = 'median://onesignal/info';
    if ((window as any).median?.onesignal?.info) {
        (window as any).median.onesignal.info();
    }
  };

  const saveToAppwrite = async (playerId: string) => {
    try {
        addLog(`💾 Saving ID: ${playerId}`);
        
        // Find Document
        const profileRes = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userProfilesCollectionId,
            [Query.equal('userId', user!.$id)]
        );

        if (profileRes.total === 0) {
            addLog("❌ Profile Document Not Found!");
            return;
        }

        const docId = profileRes.documents[0].$id;
        
        // Try to Update
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

  return (
    <Card className="p-4 m-4 bg-black text-green-400 font-mono text-xs border-2 border-green-500 overflow-hidden z-50 relative">
      <h3 className="font-bold mb-2 text-white">OneSignal Debugger</h3>
      <div className="space-y-2 mb-4">
        <p className="text-white">User: {user?.$id || "None"}</p>
        <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={checkEnvironment}>Check Env</Button>
            <Button size="sm" className="bg-green-600 text-white" onClick={forceSync}>Force Sync</Button>
        </div>
      </div>
      <div className="h-40 overflow-y-auto bg-gray-900 p-2 rounded border border-gray-700 whitespace-pre-wrap">
        {logs.length === 0 ? "Waiting for logs..." : logs.map((log, i) => (
            <div key={i} className="mb-1 border-b border-gray-800 pb-1">{log}</div>
        ))}
      </div>
    </Card>
  );
};

export default OneSignalDebug;