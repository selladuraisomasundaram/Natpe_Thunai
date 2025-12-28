"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { Models, ID } from "appwrite";
import { toast } from "sonner";
import { generateAvatarUrl } from "@/utils/avatarGenerator";

// Define the UserProfile interface
export interface UserProfile extends Models.Document {
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  mobileNumber: string;
  upiId: string;
  collegeIdPhotoId: string | null;
  role: "user" | "admin" | "developer";
  gender: "male" | "female" | "prefer-not-to-say";
  userType: "student" | "staff";
  collegeName: string;
  level: number;
  currentXp: number;
  maxXp: number;
  ambassadorDeliveriesCount: number;
  lastQuestCompletedDate: string | null;
  itemsListedToday: number;
  avatarStyle: string;
  currentStudyYear: string; // Added this field
}

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  userAvatarUrl: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>("");

  const fetchUser = useCallback(async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      setUser(null);
      return null;
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [`userId=="${userId}"`]
      );
      if (response.documents.length > 0) {
        const profile = response.documents[0] as UserProfile;
        setUserProfile(profile);
        setUserAvatarUrl(generateAvatarUrl(profile.avatarStyle, profile.userId));
        return profile;
      }
      setUserProfile(null);
      setUserAvatarUrl("");
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
      setUserAvatarUrl("");
      return null;
    }
  }, []);

  const login = useCallback(async () => {
    setIsLoading(true);
    const currentUser = await fetchUser();
    if (currentUser) {
      await fetchUserProfile(currentUser.$id);
    }
    setIsLoading(false);
  }, [fetchUser, fetchUserProfile]);

  const logout = useCallback(async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      setUserProfile(null);
      setUserAvatarUrl("");
      toast.success("Logged out successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to log out.");
      console.error("Logout error:", error);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user.$id);
    }
  }, [user, fetchUserProfile]);

  const addXp = useCallback(async (amount: number) => {
    if (!userProfile) {
      toast.error("User profile not loaded.");
      return;
    }

    let newCurrentXp = userProfile.currentXp + amount;
    let newLevel = userProfile.level;
    let newMaxXp = userProfile.maxXp;

    // Level up logic
    while (newCurrentXp >= newMaxXp) {
      newCurrentXp -= newMaxXp;
      newLevel += 1;
      newMaxXp = Math.floor(newMaxXp * 1.5); // Increase XP needed for next level
      toast.success(`Level Up! You are now Level ${newLevel}!`);
    }

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        userProfile.$id,
        {
          currentXp: newCurrentXp,
          level: newLevel,
          maxXp: newMaxXp,
        }
      );
      await refreshUserProfile(); // Refresh to get the latest profile data
    } catch (error) {
      console.error("Error updating XP:", error);
      toast.error("Failed to update XP.");
    }
  }, [userProfile, refreshUserProfile]);

  const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!userProfile) {
      toast.error("User profile not loaded.");
      return;
    }
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        userProfile.$id,
        data
      );
      await refreshUserProfile();
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating user profile:", error);
      toast.error("Failed to update profile.");
    }
  }, [userProfile, refreshUserProfile]);

  useEffect(() => {
    login();
  }, [login]);

  const isAuthenticated = !!user && !!userProfile;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUserProfile,
        addXp,
        updateUserProfile,
        userAvatarUrl,
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