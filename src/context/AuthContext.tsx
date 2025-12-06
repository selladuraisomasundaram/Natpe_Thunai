"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { Models, Query } from "appwrite";
import { toast } from "sonner";
import { calculateMaxXpForLevel, checkAndApplyLevelUp } from "@/utils/leveling"; // NEW: Import leveling utilities

// Define the User and UserProfile types
interface AppwriteUser extends Models.User<Models.Preferences> {
  name: string;
  email: string;
  emailVerification: boolean; // Ensure this property exists
}

interface UserProfile extends Models.Document {
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  mobileNumber: string;
  upiId: string;
  collegeIdPhotoId: string | null;
  role: "user" | "developer" | "ambassador";
  gender: "male" | "female" | "prefer-not-to-say";
  userType: "student" | "staff";
  collegeName: string;
  level: number;
  currentXp: number;
  maxXp: number;
  ambassadorDeliveriesCount?: number;
  // NEW: Add avatar customization options
  avatarOptions?: {
    hair?: string;
    eyes?: string;
    mouth?: string;
    skinColor?: string;
    clothing?: string;
    accessories?: string;
  };
}

interface AuthContextType {
  user: AppwriteUser | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isVerified: boolean; // NEW: Add isVerified
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileId: string, data: Partial<UserProfile>) => Promise<void>;
  incrementAmbassadorDeliveriesCount: () => Promise<void>;
  addXp: (amount: number) => Promise<void>; // NEW: Add addXp
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false); // NEW: State for email verification

  const fetchUserAndProfile = useCallback(async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsVerified(currentUser.emailVerification); // Set verification status

      // Fetch user profile
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal("userId", currentUser.$id)]
      );

      if (response.documents.length > 0) {
        setUserProfile(response.documents[0] as unknown as UserProfile);
      } else {
        setUserProfile(null); // No profile found
      }
    } catch (error) {
      console.error("Failed to fetch user or profile:", error);
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      setIsVerified(false); // Reset verification status on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserAndProfile();

    // Set up real-time subscription for user profile changes
    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_USER_PROFILES_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as UserProfile;
        if (userProfile && payload.$id === userProfile.$id) {
          setUserProfile(payload);
          toast.info("Your profile has been updated in real-time!");
        }
      }
    );

    // Set up real-time subscription for user account changes (e.g., email verification)
    const unsubscribeAccount = databases.client.subscribe(
      `account`,
      (response) => {
        const payload = response.payload as unknown as AppwriteUser;
        if (user && payload.$id === user.$id) {
          setUser(payload);
          setIsVerified(payload.emailVerification);
          if (payload.emailVerification && !user.emailVerification) {
            toast.success("Your email has been verified!");
          }
        }
      }
    );


    return () => {
      unsubscribe();
      unsubscribeAccount();
    };
  }, [fetchUserAndProfile, userProfile, user]);

  const login = async () => {
    setIsLoading(true);
    await fetchUserAndProfile();
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      setIsVerified(false); // Reset verification status
      toast.success("Logged out successfully!");
    } catch (error: any) {
      console.error("Failed to log out:", error);
      toast.error(error.message || "Failed to log out.");
    }
  };

  const updateUserProfile = async (profileId: string, data: Partial<UserProfile>) => {
    if (!user) {
      toast.error("You must be logged in to update your profile.");
      return;
    }
    try {
      const updatedDoc = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        profileId,
        data
      );
      setUserProfile(updatedDoc as unknown as UserProfile);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      toast.error(error.message || "Failed to update profile.");
      throw error; // Re-throw to allow form to handle error state
    }
  };

  const incrementAmbassadorDeliveriesCount = async () => {
    if (!userProfile || !user) {
      toast.error("User profile not found. Cannot increment ambassador deliveries.");
      return;
    }

    const currentCount = userProfile.ambassadorDeliveriesCount || 0;
    const newCount = currentCount + 1;

    try {
      await updateUserProfile(userProfile.$id, { ambassadorDeliveriesCount: newCount });
      toast.success(`Ambassador deliveries count updated to ${newCount}!`);
    } catch (error) {
      console.error("Failed to increment ambassador deliveries count:", error);
      toast.error("Failed to update ambassador deliveries count.");
    }
  };

  // NEW: Implement addXp function
  const addXp = useCallback(async (amount: number) => {
    if (!userProfile || !user) {
      toast.error("User profile not found. Cannot add XP.");
      return;
    }

    let newCurrentXp = userProfile.currentXp + amount;
    let newLevel = userProfile.level;
    let newMaxXp = userProfile.maxXp;

    const { newLevel: updatedLevel, newCurrentXp: updatedCurrentXp, newMaxXp: updatedMaxXp } = checkAndApplyLevelUp(newLevel, newCurrentXp, newMaxXp);

    if (updatedLevel > newLevel) {
      toast.success(`Congratulations! You leveled up to Level ${updatedLevel}!`);
    }

    try {
      await updateUserProfile(userProfile.$id, {
        level: updatedLevel,
        currentXp: updatedCurrentXp,
        maxXp: updatedMaxXp,
      });
    } catch (error) {
      console.error("Failed to add XP or level up:", error);
      toast.error("Failed to update XP and level.");
    }
  }, [user, userProfile, updateUserProfile]);


  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAuthenticated,
        isLoading,
        isVerified, // NEW: Provide isVerified
        login,
        logout,
        updateUserProfile,
        incrementAmbassadorDeliveriesCount,
        addXp, // NEW: Provide addXp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};