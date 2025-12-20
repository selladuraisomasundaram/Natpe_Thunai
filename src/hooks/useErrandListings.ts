"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface ErrandPost extends Models.Document {
  title: string;
  description: string;
  type: string;
  compensation: string;
  deadline?: string;
  contact: string;
  posterId: string;
  posterName: string;
  collegeName: string;
}

interface ErrandListingsState {
  errands: ErrandPost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  deleteErrand: (errandId: string) => Promise<void>; // NEW: Add deleteErrand
}

export const useErrandListings = (filterTypes: string[] = []): ErrandListingsState => {
  const { userProfile } = useAuth();
  const [errands, setErrands] = useState<ErrandPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchErrands = useCallback(async () => {
    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setErrands([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const queries = [
      Query.orderDesc('$createdAt'),
      Query.equal('collegeName', userProfile.collegeName)
    ];
    
    if (filterTypes.length > 0) {
      queries.push(Query.or(filterTypes.map(type => Query.equal('type', type))));
    }

    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_ERRANDS_COLLECTION_ID,
        queries
      );
      setErrands(response.documents as unknown as ErrandPost[]);
    } catch (err: any) {
      console.error("Error fetching errand listings:", err);
      setError(err.message || "Failed to load errand listings.");
      toast.error("Failed to load errand listings.");
    } finally {
      setIsLoading(false);
    }
  }, [filterTypes, userProfile?.collegeName]);

  const deleteErrand = useCallback(async (errandId: string) => {
    if (!window.confirm("Are you sure you want to delete this errand post?")) {
      return;
    }
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ERRANDS_COLLECTION_ID,
        errandId
      );
      toast.success("Errand post deleted successfully!");
      // The real-time subscription will handle updating the state
    } catch (err: any) {
      console.error("Error deleting errand post:", err);
      toast.error(err.message || "Failed to delete errand post.");
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchErrands();

    if (!userProfile?.collegeName) return;

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_ERRANDS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as ErrandPost;
        
        const matchesFilter = filterTypes.length === 0 || filterTypes.includes(payload.type);
        const matchesCollege = payload.collegeName === userProfile.collegeName;

        if (!matchesCollege) return;

        setErrands(prev => {
          const existingIndex = prev.findIndex(e => e.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1 && matchesFilter) {
              toast.info(`New errand posted: ${payload.title}`);
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Errand updated: ${payload.title}`);
              return prev.map(e => e.$id === payload.$id ? payload : e);
            } else if (matchesFilter) {
                return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`Errand removed: ${payload.title}`);
              return prev.filter(e => e.$id !== payload.$id);
            }
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchErrands, filterTypes, userProfile?.collegeName]);

  return { errands, isLoading, error, refetch: fetchErrands, deleteErrand };
};