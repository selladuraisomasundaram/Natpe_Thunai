"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CASH_EXCHANGE_COLLECTION_ID } from '@/lib/appwrite';
import { ID, Models, Query } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface Contribution {
  userId: string;
  amount: number;
}

export interface CashExchangeRequest extends Models.Document {
  type: "request" | "offer" | "group-contribution";
  amount: number;
  commission: number;
  notes: string;
  status: "Open" | "Accepted" | "Completed" | "Group Contribution";
  meetingLocation: string;
  meetingTime: string;
  contributions?: Contribution[]; // This is the deserialized type for the component's state
  posterId: string; // ID of the user who posted the request/offer
  posterName: string; // Name of the user who posted
  collegeName: string;
}

interface UseCashExchangeListingsState {
  requests: CashExchangeRequest[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  deleteRequest: (requestId: string) => Promise<void>;
}

// Helper functions for serialization/deserialization
const serializeContributions = (contributions: Contribution[]): string[] => {
  return contributions.map(c => JSON.stringify(c));
};

const deserializeContributions = (contributions: string[] | undefined): Contribution[] => {
  if (!contributions || !Array.isArray(contributions)) return [];
  return contributions.map(c => {
    try {
      return JSON.parse(c);
    } catch (e) {
      console.error("Failed to parse contribution item:", c, e);
      return { userId: "unknown", amount: 0 };
    }
  });
};

export const useCashExchangeListings = (): UseCashExchangeListingsState => {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<CashExchangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setRequests([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.equal('collegeName', userProfile.collegeName)
        ]
      );
      // Deserialize contributions when fetching
      const deserializedRequests = (response.documents as any[]).map(doc => ({
        ...doc,
        contributions: deserializeContributions(doc.contributions as string[] || []),
      })) as unknown as CashExchangeRequest[];
      setRequests(deserializedRequests);
    } catch (err: any) {
      console.error("Error fetching cash exchange data:", err);
      setError(err.message || "Failed to load cash exchange listings.");
      toast.error("Failed to load cash exchange listings.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]);

  const deleteRequest = useCallback(async (requestId: string) => {
    if (!window.confirm("Are you sure you want to delete this cash exchange post?")) {
      return;
    }
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        requestId
      );
      toast.success("Cash exchange post deleted successfully!");
      // The real-time subscription will handle updating the state
    } catch (err: any) {
      console.error("Error deleting cash exchange post:", err);
      toast.error(err.message || "Failed to delete cash exchange post.");
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchRequests();

    if (!userProfile?.collegeName) return;

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_CASH_EXCHANGE_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as any;
        
        if (payload.collegeName !== userProfile.collegeName) {
            return;
        }

        setRequests(prev => {
          const existingIndex = prev.findIndex(r => r.$id === payload.$id);
          
          const deserializedPayload: CashExchangeRequest = {
            ...payload,
            contributions: deserializeContributions(payload.contributions as string[] || []),
          };

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New cash exchange post: ${deserializedPayload.type} for ₹${deserializedPayload.amount}`);
              return [deserializedPayload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Cash exchange updated: ${deserializedPayload.type} status is now ${deserializedPayload.status}`);
              return prev.map(r => r.$id === deserializedPayload.$id ? deserializedPayload : r);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`Cash exchange post removed.`);
              return prev.filter(r => r.$id !== deserializedPayload.$id);
            }
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchRequests, userProfile?.collegeName]);

  return { requests, isLoading, error, refetch: fetchRequests, deleteRequest };
};