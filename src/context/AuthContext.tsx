"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account, Client, ID, Models, Databases } from 'appwrite';
import { useNavigate } from 'react-router-dom'; // Corrected import for React Router
import toast from 'react-hot-toast'; // Ensure toast is imported

// Define custom user preferences
interface UserPreferences extends Models.Preferences {
  name: string;
  yearOfStudy: string; // Required
  collegeName?: string;
  level?: number;
  isDeveloper?: boolean;
  isAmbassador?: boolean;
  dailyQuestCompleted?: string; // Changed to string to store date
  lastLoginStreakClaim?: string;
  ambassadorDeliveriesCount?: number;
  // Add any other custom preferences stored in Appwrite's preferences
}

interface AuthContextType {
  user: Models.User | null; // Appwrite's built-in user object
  userPreferences: UserPreferences | null; // Custom preferences
  loading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  signup: (email: string, password: string, name: string, yearOfStudy: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  updateUserPreferences: (data: Partial<UserPreferences>) => Promise<void>; // Renamed from updateUserProfile
  recordMarketListing: (data: any) => Promise<void>; // Placeholder, needs actual implementation
  incrementAmbassadorDeliveriesCount: () => Promise<void>; // Placeholder, needs actual implementation
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const account = new Account(client);
const databases = new Databases(client); // Assuming you have databases configured

// Appwrite Collection IDs (replace with your actual IDs)
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default_database_id';
const MARKET_LISTINGS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MARKET_LISTINGS_COLLECTION_ID || 'market_listings';
const USER_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USER_PROFILES_COLLECTION_ID || 'user_profiles'; // Assuming a separate collection for more complex profiles

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Models.User | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user;
  const isVerified = !!user?.emailVerification;

  const fetchUserData = async () => {
    try {
      const loggedInUser = await account.get();
      const prefs = await account.getPrefs();
      setUser(loggedInUser);
      // Ensure all required UserPreferences fields are present, providing defaults if missing
      setUserPreferences({
        name: loggedInUser.name,
        yearOfStudy: (prefs as UserPreferences).yearOfStudy || 'I', // Default to 'I' if not set
        collegeName: (prefs as UserPreferences).collegeName || undefined,
        level: (prefs as UserPreferences).level || 1,
        isDeveloper: (prefs as UserPreferences).isDeveloper || false,
        isAmbassador: (prefs as UserPreferences).isAmbassador || false,
        dailyQuestCompleted: (prefs as UserPreferences).dailyQuestCompleted || undefined,
        lastLoginStreakClaim: (prefs as UserPreferences).lastLoginStreakClaim || undefined,
        ambassadorDeliveriesCount: (prefs as UserPreferences).ambassadorDeliveriesCount || 0,
        ...prefs, // Spread existing preferences to include any others
      } as UserPreferences);
    } catch (error) {
      setUser(null);
      setUserPreferences(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const signup = async (email: string, password: string, name: string, yearOfStudy: string) => {
    try {
      const newUser = await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password); // Corrected Appwrite method
      await account.updatePrefs({
        yearOfStudy,
        name,
        level: 1,
        isDeveloper: false,
        isAmbassador: false,
        dailyQuestCompleted: undefined, // Initialize as undefined
        ambassadorDeliveriesCount: 0
      }); // Save initial preferences
      await fetchUserData(); // Re-fetch to update context
      navigate('/');
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password); // Corrected Appwrite method
      await fetchUserData(); // Re-fetch to update context
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to log in');
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      setUserPreferences(null);
      navigate('/auth');
      toast.success('Logged out successfully.');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Failed to log out.');
    }
  };

  const addXp = async (amount: number) => {
    if (!userPreferences || !user) {
      toast.error("User not logged in.");
      return;
    }
    try {
      const currentLevel = userPreferences.level || 1;
      const newLevel = currentLevel + amount; // Simple XP to level conversion
      await account.updatePrefs({ level: newLevel });
      setUserPreferences(prev => prev ? { ...prev, level: newLevel } : null);
      toast.success(`Gained ${amount} XP! New level: ${newLevel}`);
    } catch (error: any) {
      console.error('Failed to add XP:', error);
      toast.error('Failed to add XP.');
    }
  };

  const updateUserPreferences = async (data: Partial<UserPreferences>) => {
    if (!userPreferences || !user) {
      toast.error("User not logged in.");
      return;
    }
    try {
      await account.updatePrefs(data);
      setUserPreferences(prev => prev ? { ...prev, ...data } : null);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update user profile:', error);
      toast.error('Failed to update profile.');
    }
  };

  const recordMarketListing = async (data: any) => {
    if (!user || !userPreferences?.collegeName) {
      toast.error("User not logged in or college not set.");
      return;
    }
    try {
      // This is a placeholder. You would typically create a document in a 'market_listings' collection.
      // Example: await databases.createDocument(DATABASE_ID, MARKET_LISTINGS_COLLECTION_ID, ID.unique(), { ...data, userId: user.$id, collegeName: userPreferences.collegeName });
      console.log('Market listing recorded:', data);
      toast.success('Market listing posted successfully!');
    } catch (error: any) {
      console.error('Failed to record market listing:', error);
      toast.error('Failed to post market listing.');
    }
  };

  const incrementAmbassadorDeliveriesCount = async () => {
    if (!userPreferences || !user) {
      toast.error("User not logged in.");
      return;
    }
    try {
      const currentCount = userPreferences.ambassadorDeliveriesCount || 0;
      const newCount = currentCount + 1;
      await account.updatePrefs({ ambassadorDeliveriesCount: newCount });
      setUserPreferences(prev => prev ? { ...prev, ambassadorDeliveriesCount: newCount } : null);
      toast.success('Ambassador delivery count updated!');
    } catch (error: any) {
      console.error('Failed to increment ambassador deliveries:', error);
      toast.error('Failed to update ambassador deliveries.');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userPreferences,
      loading,
      isAuthenticated,
      isVerified,
      signup,
      login,
      logout,
      addXp,
      updateUserPreferences,
      recordMarketListing,
      incrementAmbassadorDeliveriesCount,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};