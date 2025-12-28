"use client";

import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, ID, Models } from 'appwrite';
import { useAuth } from '@/context/AuthContext'; // NEW: Use useAuth hook to get current user's college
import toast from 'react-hot-toast'; // Ensure toast is imported

interface CanteenData extends Models.Document { // Extend Models.Document for Appwrite properties
  name: string;
  collegeName: string;
  // createdAt: string; // Already in Models.Document
  // updatedAt: string; // Already in Models.Document
}

interface CanteenDataState {
  allCanteens: CanteenData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updateCanteen: (id: string, newName: string) => Promise<void>;
  addCanteen: (name: string, collegeName: string) => Promise<void>;
}

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default_database_id';
const CANTEENS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CANTEENS_COLLECTION_ID || 'canteens';

export const useCanteenData = (): CanteenDataState => {
  const { userPreferences, loading: isAuthLoading } = useAuth(); // NEW: Use useAuth hook to get current user's college
  const [allCanteens, setAllCanteens] = useState<CanteenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const collegeName = userPreferences?.collegeName;

  const fetchCanteens = useCallback(async () => {
    if (isAuthLoading) return; // Wait for auth to load

    setIsLoading(true);
    setError(null);
    try {
      let queries = [];
      if (collegeName) {
        queries.push(Query.equal('collegeName', collegeName));
      } else {
        // If no collegeName, fetch all canteens (e.g., for developer or initial setup)
        // Or, if collegeName is required, you might want to return early or show an error.
        // For now, we'll allow fetching all if no collegeName is set.
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        CANTEENS_COLLECTION_ID,
        queries
      );
      setAllCanteens(response.documents as CanteenData[]); // Corrected type assertion
    } catch (err: any) {
      console.error("Failed to fetch canteens:", err);
      setError(err.message || "Failed to fetch canteens.");
      toast.error(err.message || "Failed to fetch canteens.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeName, isAuthLoading]);

  useEffect(() => {
    fetchCanteens();
  }, [fetchCanteens]);

  const updateCanteen = async (id: string, newName: string) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        CANTEENS_COLLECTION_ID,
        id,
        { name: newName }
      );
      toast.success("Canteen updated successfully!");
      fetchCanteens(); // Refetch to update UI
    } catch (err: any) {
      console.error("Failed to update canteen:", err);
      toast.error(err.message || "Failed to update canteen.");
    }
  };

  const addCanteen = async (name: string, collegeName: string) => {
    try {
      await databases.createDocument(
        DATABASE_ID,
        CANTEENS_COLLECTION_ID,
        ID.unique(),
        { name, collegeName }
      );
      toast.success("Canteen added successfully!");
      fetchCanteens(); // Refetch to update UI
    } catch (err: any) {
      console.error("Failed to add canteen:", err);
      toast.error(err.message || "Failed to add canteen.");
    }
  };

  return { allCanteens, isLoading, error, refetch: fetchCanteens, updateCanteen, addCanteen };
};