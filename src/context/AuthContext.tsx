"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account } from '@/lib/appwrite';
import { Models, ID } from 'appwrite'; // Corrected Models import
import { toast } from 'sonner';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  userProfile: { collegeName: string; age: number; isVerified: boolean; xp: number; role: string; } | null; // More specific type for userProfile
  isLoading: boolean;
  isAuthenticated: boolean; // Added
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkUserStatus: () => Promise<void>;
  addXp: (amount: number) => void; // Added
  updateUserProfile: (updates: Partial<{ collegeName: string; age: number; isVerified: boolean; xp: number; role: string; }>) => void; // Added
  recordMarketListing: () => void; // Added
  incrementAmbassadorDeliveriesCount: () => void; // Added
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userProfile, setUserProfile] = useState<{ collegeName: string; age: number; isVerified: boolean; xp: number; role: string; } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = !!user; // Derived state

  const checkUserStatus = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      // Placeholder for fetching user profile from your database
      // In a real app, you'd fetch this from APPWRITE_USER_PROFILES_COLLECTION_ID
      setUserProfile({ collegeName: "Example University", age: 20, isVerified: true, xp: 100, role: "student" }); 
    } catch (error) {
      setUser(null);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await account.createEmailPasswordSession(email, password); // Corrected method
      await checkUserStatus();
      toast.success("Logged in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Login failed.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      await account.create(ID.unique(), email, password, name); // Models.ID.unique() is not needed, ID.unique() is correct
      await account.createEmailPasswordSession(email, password); // Corrected method
      await checkUserStatus();
      toast.success("Account created and logged in!");
    } catch (error: any) {
      toast.error(error.message || "Registration failed.");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await account.deleteSession('current');
      setUser(null);
      setUserProfile(null);
      toast.info("Logged out.");
    } catch (error: any) {
      toast.error(error.message || "Logout failed.");
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder implementations for new methods
  const addXp = (amount: number) => {
    if (userProfile) {
      setUserProfile(prev => prev ? { ...prev, xp: prev.xp + amount } : null);
      toast.info(`Gained ${amount} XP!`);
    }
  };

  const updateUserProfile = (updates: Partial<{ collegeName: string; age: number; isVerified: boolean; xp: number; role: string; }>) => {
    if (userProfile) {
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success("Profile updated!");
    }
  };

  const recordMarketListing = () => {
    toast.info("Market listing recorded (placeholder).");
  };

  const incrementAmbassadorDeliveriesCount = () => {
    toast.info("Ambassador deliveries count incremented (placeholder).");
  };


  return (
    <AuthContext.Provider value={{ user, userProfile, isLoading, isAuthenticated, login, register, logout, checkUserStatus, addXp, updateUserProfile, recordMarketListing, incrementAmbassadorDeliveriesCount }}>
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