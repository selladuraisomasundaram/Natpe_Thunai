import { useEffect } from 'react';
import { account, ID } from '@/lib/appwrite';
import { toast } from "sonner";

// Define the interface for the Median OneSignal Info object
interface OneSignalInfo {
  userId: string;    // OneSignal Player ID
  pushToken: string; // The raw FCM Token (We need this for Appwrite)
  subscribed: boolean;
}

// Extend the window object to satisfy TypeScript
declare global {
  interface Window {
    median_onesignal_info?: (info: OneSignalInfo) => void;
    // Removed 'median?: any;' to avoid conflict with existing global declaration
  }
}

const useMedianPush = () => {
  useEffect(() => {
    // 1. Define the Listener
    // Median calls this function automatically when it gets info from the native layer
    // ... inside the hook
window.median_onesignal_info = async (info: OneSignalInfo) => {
    // 1. VISUAL CONFIRMATION: Did Median talk to React?
    toast.info("NATIVE DEBUG: OneSignal Info Received"); 

    if (info && info.pushToken) {
        try {
            await account.createPushTarget(
                ID.unique(),
                info.pushToken,
                '69788b1f002fcdf4fae1'
            );
            // 2. VISUAL CONFIRMATION: Did Appwrite accept it?
            toast.success("NATIVE DEBUG: Target Created!"); 
        } catch (error: any) {
            // 3. VISUAL CONFIRMATION: Did it fail?
            toast.error("NATIVE DEBUG Error: " + error.message);
        }
    }
};

          console.log("✅ Appwrite Push Target Registered!");
          // Optional: toast.success("Device registered for notifications");

        } catch (error: any) {
          // 409 means "Conflict" - the device is already registered, which is good.
          if (error.code === 409) {
            console.log("ℹ️ Device already registered.");
          } else {
            console.error("❌ Failed to register push target:", error);
          }
        }
      }
    };

    // 2. Force a Request (Trigger)
    // If the app loads fast, we might miss the initial call. This forces Median to send the info again.
    // Use type assertion to bypass TypeScript's strict checking for the 'onesignal' property.
    const medianGlobal = (window as any).median; 
    if (medianGlobal && medianGlobal.onesignal) {
        medianGlobal.onesignal.info();
    } else {
        console.log("⚠️ Median/OneSignal object not found (Are you testing in browser?)");
    }

  }, []);
};

export default useMedianPush;