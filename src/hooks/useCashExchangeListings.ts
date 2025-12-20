"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from '@/lib/appwrite'; // Changed to PRODUCTS_COLLECTION_ID
import { Query } from 'appwrite';
import { toast } from 'sonner';

// Updated interface to align with Product structure, adding 'type' for distinction
export interface CashExchangeListing {
  $id: string;
  title: string; // e.g., "Exchange INR for USD"
  description: string; // e.g., "Need 100 USD, offering 8300 INR. Rate: 83 INR/USD"
  price: number; // This will store the amount being exchanged (e.g., INR amount)
  type: "cash-exchange"; // Crucial for filtering within products collection
  sellerId: string; // The user posting the exchange
  sellerName: string;
  collegeName: string;
  $createdAt: string;
}

export const useCashExchangeListings = (collegeName?: string) => {
  const [listings, setListings] = useState<CashExchangeListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.equal('type', 'cash-exchange'), // Filter for cash exchange listings
        Query.orderDesc('$createdAt'),
      ];

      if (collegeName) {
        queries.push(Query.equal('collegeName', collegeName));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID, // Fetch from products collection
        queries
      );
      setListings(response.documents as unknown as CashExchangeListing[]);
    } catch (err: any) {
      console.error("Error fetching cash exchange listings:", err);
      setError(err.message || "Failed to fetch cash exchange listings.");
      toast.error("Failed to load cash exchange listings.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeName]);

  useEffect(() => {
    fetchListings();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_PRODUCTS_COLLECTION_ID}.documents`, // Subscribe to products collection
      (response) => {
        const payload = response.payload as unknown as CashExchangeListing;
        if (payload.type !== 'cash-exchange') return; // Only process cash-exchange types

        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setListings((prev) => [payload, ...prev].sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()));
          toast.info(`New cash exchange listing posted: "${payload.title}"`);
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          setListings((prev) =>
            prev.map((l) =>
              l.$id === payload.$id ? payload : l
            ).sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
          );
          toast.info(`Cash exchange listing updated: "${payload.title}"`);
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          setListings((prev) => prev.filter((l) => l.$id !== payload.$id));
          toast.info(`Cash exchange listing removed: "${payload.title}"`);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchListings]);

  return {
    listings,
    isLoading,
    error,
    refetchListings: fetchListings,
  };
};