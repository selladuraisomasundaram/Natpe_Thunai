import { useEffect, useState, useRef } from 'react';
import { databases, appwriteConfig } from '@/lib/appwrite'; 
import { useAuth } from '@/context/AuthContext';
import { Query } from 'appwrite';

const useOneSignal = () => {
  const { user } = useAuth();
  const [isSynced, setIsSynced] = useState(false);
  const attemptCount = useRef(0);

  useEffect(() => {
    const syncDevice = async () => {
      // 1. Stop if not logged in or already synced this session
      if (!user?.$id || isSynced) return;

      // 2. Check Environment
      const isMedian = navigator.userAgent.includes('wv') || window.location.href.includes('median');
      if (!isMedian) return;

      try {
        console.log("🔄 [OneSignal] Starting background sync...");

        // 3. WAIT for Median Bridge (The "Debugger" Fix)
        // We try for up to 3 seconds for the bridge to load
        let bridgeReady = false;
        for (let i = 0; i < 6; i++) {
            if (typeof (window as any).median !== 'undefined') {
                bridgeReady = true;
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
        }

        if (!bridgeReady) {
            console.warn("⚠️ [OneSignal] Bridge not found after waiting.");
            return;
        }

        // 4. Get Data (Using the Promise method that worked for you)
        let data = null;
        if ((window as any).median?.onesignal?.onesignalInfo) {
             data = await (window as any).median.onesignal.onesignalInfo();
        }

        if (!data?.oneSignalUserId) {
             // Fallback for older apps
             console.log("⚠️ [OneSignal] No ID in promise, trying legacy...");
             (window as any).median.onesignal.info();
             return; 
        }

        const playerId = data.oneSignalUserId;
        console.log(`✅ [OneSignal] Found ID: ${playerId}`);

        // 5. Database Logic (Idempotent Save)
        // Check if it's already saved to avoid unnecessary writes
        const profileRes = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.userProfilesCollectionId,
          [Query.equal('userId', user.$id)]
        );

        if (profileRes.total > 0) {
            const doc = profileRes.documents[0];
            if (doc.oneSignalPlayerId === playerId) {
                console.log("✅ [OneSignal] ID already matches database. Skipping write.");
                setIsSynced(true);
                return;
            }

            // Update if different
            await databases.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.userProfilesCollectionId,
                doc.$id,
                { oneSignalPlayerId: playerId }
            );
            console.log("💾 [OneSignal] Updated new ID to Appwrite.");
        }

        setIsSynced(true);

      } catch (error) {
        console.error("❌ [OneSignal] Background Sync Failed:", error);
        
        // Retry logic: If it failed, try again in 5 seconds (once)
        if (attemptCount.current < 1) {
            attemptCount.current++;
            setTimeout(() => setIsSynced(false), 5000);
        }
      }
    };

    syncDevice();
    
    // Legacy Callback Listener (Safety Net)
    (window as any).median_onesignal_info = (data: any) => {
        if (data?.oneSignalUserId && !isSynced) {
            // Recurse with data if callback fires
            // (Simplified: We just let the logic above handle the main flow)
        }
    };

  }, [user, isSynced]);
};

export default useOneSignal;