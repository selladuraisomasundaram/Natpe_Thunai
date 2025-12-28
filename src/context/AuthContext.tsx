"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account, Client, Databases, Models, ID, Query } from 'appwrite';
import { toast } from 'sonner';
import { AppwriteDocument } from '@/types/appwrite'; // Import the base AppwriteDocument

const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USER_PREFERENCES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USER_PREFERENCES_COLLECTION_ID;
const MARKET_LISTINGS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MARKET_LISTINGS_COLLECTION_ID; // Added for recordMarketListing

// Define UserPreferences interface extending AppwriteDocument
export interface UserPreferences extends AppwriteDocument {
  userId: string;
  name: string;
  yearOfStudy: string;
  level: 'Undergraduate' | 'Postgraduate';
  isDeveloper: boolean;
  collegeName: string;
  profilePictureUrl?: string;
  isVerified: boolean; // Added isVerified
}

// Define Product interface for recordMarketListing
export interface Product extends AppwriteDocument {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  imageUrl?: string;
  sellerId: string;
  sellerName: string;
  collegeName: string;
  contactInfo: string;
  type: 'sell' | 'rent' | 'gift' | 'sports';
  status: 'available' | 'sold' | 'rented';
}

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  userPreferences: UserPreferences | null; // Added userPreferences
  loading: boolean; // Added loading
  isVerified: boolean; // Added isVerified
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, collegeName: string) => Promise<void>; // Added signup
  logout: () => Promise<void>;
  recordMarketListing: (productData: Omit<Product, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId' | '$sequence' | 'sellerId' | 'sellerName' | 'collegeName' | 'status'>) => Promise<void>; // Added recordMarketListing
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);
        setIsVerified(currentUser.emailVerification);

        // Fetch user preferences
        const prefsResponse = await databases.listDocuments(
          DATABASE_ID,
          USER_PREFERENCES_COLLECTION_ID,
          [Query.equal('userId', currentUser.$id)]
        );

        let prefs: UserPreferences | null = null;
        if (prefsResponse.documents.length > 0) {
          const prefsDoc = prefsResponse.documents[0];
          // Safely cast to UserPreferences after ensuring it extends AppwriteDocument
          prefs = prefsDoc as UserPreferences;
        } else {
          // If no preferences, create a default one
          const newPrefs = await databases.createDocument(
            DATABASE_ID,
            USER_PREFERENCES_COLLECTION_ID,
            ID.unique(),
            {
              userId: currentUser.$id,
              name: currentUser.name,
              yearOfStudy: 'N/A', // Default
              level: 'Undergraduate', // Default
              isDeveloper: false, // Default
              collegeName: 'N/A', // Default
              isVerified: currentUser.emailVerification,
            },
            [
              Models.Permission.read(Models.Role.user(currentUser.$id)),
              Models.Permission.write(Models.Role.user(currentUser.$id)),
            ]
          );
          prefs = newPrefs as UserPreferences;
        }
        setUserPreferences(prefs);
      } catch (err) {
        setUser(null);
        setUserPreferences(null);
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      setUser(currentUser);
      setIsVerified(currentUser.emailVerification);

      const prefsResponse = await databases.listDocuments(
        DATABASE_ID,
        USER_PREFERENCES_COLLECTION_ID,
        [Query.equal('userId', currentUser.$id)]
      );

      let prefs: UserPreferences | null = null;
      if (prefsResponse.documents.length > 0) {
        prefs = prefsResponse.documents[0] as UserPreferences;
      } else {
        // Create default preferences if none exist
        const newPrefs = await databases.createDocument(
          DATABASE_ID,
          USER_PREFERENCES_COLLECTION_ID,
          ID.unique(),
          {
            userId: currentUser.$id,
            name: currentUser.name,
            yearOfStudy: 'N/A',
            level: 'Undergraduate',
            isDeveloper: false,
            collegeName: 'N/A',
            isVerified: currentUser.emailVerification,
          },
          [
            Models.Permission.read(Models.Role.user(currentUser.$id)),
            Models.Permission.write(Models.Role.user(currentUser.$id)),
          ]
        );
        prefs = newPrefs as UserPreferences;
      }
      setUserPreferences(prefs);
      toast.success("Logged in successfully!");
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, collegeName: string) => {
    setLoading(true);
    try {
      const newUser = await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);

      // Create user preferences immediately after signup
      const newPrefs = await databases.createDocument(
        DATABASE_ID,
        USER_PREFERENCES_COLLECTION_ID,
        ID.unique(),
        {
          userId: newUser.$id,
          name: newUser.name,
          yearOfStudy: 'N/A', // Default
          level: 'Undergraduate', // Default
          isDeveloper: false, // Default
          collegeName: collegeName, // Use provided collegeName
          isVerified: newUser.emailVerification,
        },
        [
          Models.Permission.read(Models.Role.user(newUser.$id)),
          Models.Permission.write(Models.Role.user(newUser.$id)),
        ]
      );

      setUser(newUser);
      setUserPreferences(newPrefs as UserPreferences);
      setIsVerified(newUser.emailVerification);
      toast.success("Account created and logged in!");
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await account.deleteSession('current');
      setUser(null);
      setUserPreferences(null);
      setIsVerified(false);
      toast.info("Logged out successfully.");
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const recordMarketListing = async (productData: Omit<Product, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId' | '$sequence' | 'sellerId' | 'sellerName' | 'collegeName' | 'status'>) => {
    if (!user || !userPreferences) {
      toast.error("You must be logged in to post a listing.");
      return;
    }

    try {
      const newProduct = await databases.createDocument(
        DATABASE_ID,
        MARKET_LISTINGS_COLLECTION_ID,
        ID.unique(),
        {
          ...productData,
          sellerId: user.$id,
          sellerName: user.name,
          collegeName: userPreferences.collegeName,
          status: 'available',
        },
        [
          Models.Permission.read(Models.Role.any()),
          Models.Permission.write(Models.Role.user(user.$id)),
        ]
      );
      toast.success("Market listing recorded successfully!");
    } catch (error: any) {
      toast.error("Failed to record market listing: " + error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userPreferences, loading, isVerified, login, signup, logout, recordMarketListing }}>
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