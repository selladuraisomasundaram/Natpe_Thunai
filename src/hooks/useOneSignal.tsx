import { useEffect } from 'react';
import { account, ID } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';

const useOneSignal = () => {
  const { user } = useAuth();

  useEffect(() => {
    // 1. Force the function to be global so Median can find it
    (window as any).median_onesignal_info = async (data: any) => {
      // 🚨 TRUTH SERUM: Alert EVERYTHING we receive
      alert("🔍 RAW DATA FROM MEDIAN:\n" + JSON.stringify(data, null, 2));

      // Check specifically for the token
      const fcmToken = data?.pushToken || data?.token || data?.registrationId; 

      if (!fcmToken) {
        alert("❌ FAILURE: OneSignal gave us data, but NO 'pushToken' was found inside.");
        return;
      }

      alert(`✅ SUCCESS: Found Token: ${fcmToken.substring(0, 10)}...`);

      if (user?.$id) {
        try {
          await account.createPushTarget(
            ID.unique(),
            fcmToken, 
            'YOUR_FCM_PROVIDER_ID' // Check this ID matches Appwrite Console exactly
          );
          alert("🎉 Appwrite Target Created!");
        } catch (error: any) {
          alert("⚠️ Appwrite Error: " + error.message);
        }
      }
    };

    // 2. Trigger the request manually after a delay
    const timer = setTimeout(() => {
        alert("⏳ Requesting info from Median...");
        window.location.href = 'median://onesignal/info';
    }, 5000); // 5 second delay to let OneSignal initialize

    return () => clearTimeout(timer);
  }, [user]); 
};

export default useOneSignal;