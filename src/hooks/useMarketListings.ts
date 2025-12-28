"use client";

import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, Models } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; // Ensure toast is imported

export interface Product extends Models.Document { // Extend Models.Document
  title: string;
  description: string;
  price: number;
  category: string; // e.g., "sell", "rent", "gift", "sports"
  imageUrl?: string;
  userId: string; // ID of the user who posted the listing
  sellerName: string; // Name of the user who posted the listing
  collegeName: string; // College of the user who posted the listing
  status: 'available' | 'sold' | 'rented' | 'gifted';
  // createdAt: string; // Already in Models.Document
  // updatedAt: string; // Already in Models.Document
}

interface MarketListingsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default_database_id';
const MARKET_LISTINGS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MARKET_LISTINGS_COLLECTION_ID || 'market_listings';

export const useMarketListings = (): MarketListingsState => {
  const { userPreferences, loading: isAuthLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const collegeName = userPreferences?.collegeName;

  const fetchListings = useCallback(async () => {
    if (isAuthLoading) return; // Wait for auth to load

    setIsLoading(true);
    setError(null);
    try {
      let queries = [
        Query.equal('status', 'available'),
        Query.orderDesc('$createdAt'),
      ];

      if (collegeName) {
        queries.push(Query.equal('collegeName', collegeName));
      } else {
        // If collegeName is not available, we might want to restrict listings or show a message.
        // For now, if no collegeName, it will fetch all available listings (if no collegeName query is added).
        // If collegeName is mandatory, you might want to return early here.
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        MARKET_LISTINGS_COLLECTION_ID,
        queries
      );
      setProducts(response.documents as Product[]); // Corrected type assertion
    } catch (err: any) {
      console.error("Failed to fetch market listings:", err);
      setError(err.message || "Failed to fetch market listings.");
      toast.error(err.message || "Failed to fetch market listings.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeName, isAuthLoading]);

  useEffect(() => {
    fetchListings();

    // Realtime updates
    const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.${MARKET_LISTINGS_COLLECTION_ID}.documents`, response => {
      if (response.events.includes("databases.*.collections.*.documents.*.create") ||
          response.events.includes("databases.*.collections.*.documents.*.update") ||
          response.events.includes("databases.*.collections.*.documents.*.delete")) {
        // Only refetch if the document's collegeName matches the current user's collegeName
        const payload = response.payload as Product;
        if (!collegeName || payload.collegeName === collegeName) {
          fetchListings();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchListings, collegeName]);

  return { products, isLoading, error, refetch: fetchListings };
};