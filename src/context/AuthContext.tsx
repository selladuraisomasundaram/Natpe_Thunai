"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

// Define the User interface based on common Appwrite user properties and application needs
interface User {
  $id: string; // Appwrite document ID
  $createdAt: string; // Appwrite creation timestamp
  name: string;
  email: string;
  emailVerification: boolean;
  xp: number;
  currentStreak: number;
  lastClaimedTimestamp: number | null; // Unix timestamp of the last successful claim
  // Add any other core user properties that might be directly on the Appwrite User object
}

// Define the UserProfile interface for additional user-specific data
interface UserProfile {
  collegeName: string | null;
  upiId: string | null;
  isAmbassador: boolean;
  ambassadorDeliveriesCount: number;
  isDeveloper: boolean;
  role: 'student' | 'ambassador' | 'developer' | 'admin'; // Example roles
  status: 'active' | 'suspended' | 'deleted'; // Account status
  // Added properties to resolve TypeScript errors
  itemsListedToday?: number;
  lastQuestCompletedDate?: string | null;
  level: number;
  currentXp: number;
  maxXp: number;
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  userType: 'student' | 'staff' | 'alumni' | 'other';
  avatarStyle: string;
  age: number;
  mobileNumber: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Added isLoading state
  isVerified: boolean; // Added isVerified state (derived from user.emailVerification for now)
  addXp: (amount: number) => void;
  updateStreakInfo: (newStreak: number, newTimestamp: number) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void; // Added updateUserProfile
  incrementAmbassadorDeliveriesCount: () => void; // Added incrementAmbassadorDeliveriesCount
  recordMarketListing: () => void; // Added recordMarketListing
  login: (email: string, password: string) => Promise<void>; // Added login
  logout: () => Promise<void>; // Added logout
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Default to true while loading from localStorage

  // Load user and userProfile data from local storage on initial mount
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        const storedUserProfile = localStorage.getItem('currentUserProfile');

        if (storedUser && storedUserProfile) {
          const parsedUser: User = JSON.parse(storedUser);
          const parsedUserProfile: UserProfile = JSON.parse(storedUserProfile);
          setUser(parsedUser);
          setUserProfile(parsedUserProfile);
          setIsAuthenticated(true);
        } else {
          // Simulate a new user signing up for the first time
          const newUser: User = {
            $id: 'user-' + Date.now(), // Unique ID
            $createdAt: new Date().toISOString(),
            name: 'New User',
            email: 'newuser@example.com',
            emailVerification: false,
            xp: 0,
            currentStreak: 0,
            lastClaimedTimestamp: null,
          };
          const newUserProfile: UserProfile = {
            collegeName: 'Example College',
            upiId: null,
            isAmbassador: false,
            ambassadorDeliveriesCount: 0,
            isDeveloper: false,
            role: 'student',
            status: 'active',
            // Initialize new properties
            itemsListedToday: 0,
            lastQuestCompletedDate: null,
            level: 1,
            currentXp: 0,
            maxXp: 100,
            gender: 'prefer-not-to-say',
            userType: 'student',
            avatarStyle: 'lorelei',
            age: 18,
            mobileNumber: null,
            firstName: 'New',
            lastName: 'User',
          };
          setUser(newUser);
          setUserProfile(newUserProfile);
          setIsAuthenticated(true);
          localStorage.setItem('currentUser', JSON.stringify(newUser));
          localStorage.setItem('currentUserProfile', JSON.stringify(newUserProfile));
        }
      } catch (error) {
        console.error("Failed to load auth data from localStorage", error);
        // Reset to default if parsing fails
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

  // Save user data to local storage whenever the user or userProfile state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('currentUserProfile', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  const addXp = (amount: number) => {
    setUser((prevUser) => {
      if (prevUser) {
        const newXp = prevUser.xp + amount;
        toast.success(`+${amount} XP! Total: ${newXp}`);
        return { ...prevUser, xp: newXp };
      }
      return prevUser;
    });
  };

  const updateStreakInfo = (newStreak: number, newTimestamp: number) => {
    setUser((prevUser) => {
      if (prevUser) {
        return { ...prevUser, currentStreak: newStreak, lastClaimedTimestamp: newTimestamp };
      }
      return prevUser;
    });
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prevProfile) => {
      if (prevProfile) {
        return { ...prevProfile, ...updates };
      }
      return prevProfile;
    });
  };

  const incrementAmbassadorDeliveriesCount = () => {
    setUserProfile((prevProfile) => {
      if (prevProfile) {
        return { ...prevProfile, ambassadorDeliveriesCount: prevProfile.ambassadorDeliveriesCount + 1 };
      }
      return prevProfile;
    });
  };

  const recordMarketListing = () => {
    // Placeholder for recording a market listing
    toast.info("Market listing recorded (placeholder).");
    setUserProfile((prevProfile) => {
      if (prevProfile) {
        return { ...prevProfile, itemsListedToday: (prevProfile.itemsListedToday || 0) + 1 };
      }
      return prevProfile;
    });
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const loggedInUser: User = {
        $id: 'user-' + Date.now(),
        $createdAt: new Date().toISOString(),
        name: 'Logged In User',
        email: email,
        emailVerification: true,
        xp: 100,
        currentStreak: 5,
        lastClaimedTimestamp: Date.now() - (12 * 60 * 60 * 1000), // 12 hours ago
      };
      const loggedInUserProfile: UserProfile = {
        collegeName: 'Example College',
        upiId: 'user@upi',
        isAmbassador: true,
        ambassadorDeliveriesCount: 10,
        isDeveloper: false,
        role: 'ambassador',
        status: 'active',
        // Initialize new properties for logged-in user
        itemsListedToday: 2,
        lastQuestCompletedDate: new Date().toISOString(),
        level: 5,
        currentXp: 250,
        maxXp: 500,
        gender: 'male',
        userType: 'student',
        avatarStyle: 'avataaars',
        age: 20,
        mobileNumber: '1234567890',
        firstName: 'Logged',
        lastName: 'In',
      };
      setUser(loggedInUser);
      setUserProfile(loggedInUserProfile);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      localStorage.setItem('currentUserProfile', JSON.stringify(loggedInUserProfile));
      toast.success("Logged in successfully!");
    } catch (error) {
      toast.error("Login failed.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserProfile');
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error("Logout failed.");
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isVerified = user?.emailVerification ?? false; // Derived from user.emailVerification

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAuthenticated,
        isLoading,
        isVerified,
        addXp,
        updateStreakInfo,
        updateUserProfile,
        incrementAmbassadorDeliveriesCount,
        recordMarketListing,
        login,
        logout,
      }}
    >
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