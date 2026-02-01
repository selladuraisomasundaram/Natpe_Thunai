import { useEffect, useState } from 'react';
import { databases, appwriteConfig } from '@/lib/appwrite'; // Ensure these are exported from your lib
import { useAuth } from '@/context/AuthContext';
import { Query } from 'appwrite';
// import { toast } from 'sonner'; // Optional

interface OneSignalData {
  oneSignalUserId: string; 
  pushToken?: string;
  subscribed: boolean;
}

const useOneSignal = () => {
  const { user } = useAuth(); // "user" is null when logged out, populated when logged in
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  // --- EFFECT 1: GET THE PLAYER ID FROM MEDIAN (Native Layer) ---
  // This runs once on mount to grab the device ID from the phone.
  useEffect(() => {
    // 1. Define the global listener for Median
    (window as any).median_onesignal_info = (data: OneSignalData) => {
      console.log("📲 OneSignal Info Received:", data);
      
      if (data?.oneSignalUserId) {
        setLocalPlayerId(data.oneSignalUserId);
      }
    };

    // 2. Trigger Median to send the info
    const triggerMedian = () => {
      if (window.location.href.includes('median') || navigator.userAgent.includes('wv')) {
        // Try URL Scheme
        window.location.href = 'median://onesignal/info';
        
        // Try JS Bridge (Backup)
        if ((window as any).median?.onesignal?.info) {
          (window as any).median.onesignal.info();
        }
      }
    };

    // Slight delay to ensure native bridge is ready
    const timer = setTimeout(triggerMedian, 1000);
    return () => clearTimeout(timer);
  }, []); 


  // --- EFFECT 2: SYNC TO APPWRITE DATABASE (The "Login" Handler) ---
  // This watches for "user" to change. As soon as they log in, this fires.
  useEffect(() => {
    const syncToDatabase = async () => {
      // 1. Safety Checks: Need User, Need Device ID, and must not have synced yet
      if (!user?.$id || !localPlayerId || isSynced) return;

      try {
        console.log(`🔄 Checking Player ID for user: ${user.$id}...`);

        // 2. Find the User's Profile Document
        // We query by 'userId' to find the correct document in the collection
        const profileRes = await databases.listDocuments(
          appwriteConfig.databaseId,       // Replace with your DB ID variable
          appwriteConfig.userProfilesCollectionId, // Replace with your Collection ID variable
          [ Query.equal('userId', user.$id) ]
        );

        if (profileRes.total === 0) {
          console.warn("⚠️ User profile not found. Cannot save Player ID.");
          return;
        }

        const profileDoc = profileRes.documents[0];
        const remotePlayerId = profileDoc.oneSignalPlayerId;

        // 3. IDEMPOTENCY CHECK (The "No Bug" Fix)
        // Only update if the database is actually empty or different.
        // This prevents infinite loops and unnecessary API writes on every login.
        if (remotePlayerId === localPlayerId) {
          console.log("✅ Player ID is already up to date. Skipping write.");
          setIsSynced(true); // Mark as done for this session
          return;
        }

        // 4. Update the Database
        console.log("📝 Updating Player ID in Database...");
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.userProfilesCollectionId,
          profileDoc.$id, // Use the Document ID, not the User ID
          {
            oneSignalPlayerId: localPlayerId
          }
        );

        console.log("🎉 Device Linked Successfully:", localPlayerId);
        setIsSynced(true); 
        // toast.success("Notifications Enabled");

      } catch (error) {
        console.error("❌ Failed to sync Device ID:", error);
      }
    };

    syncToDatabase();
  }, [user, localPlayerId, isSynced]); // Dependencies ensure this runs when User logs in
};

export default useOneSignal;