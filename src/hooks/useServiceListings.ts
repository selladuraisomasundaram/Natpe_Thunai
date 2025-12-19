"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';

export interface ServicePost extends Models.Document {
  title: string;
  description: string;
  category: string; // e.g., 'homemade-meals', 'wellness-products', 'tutoring', 'freelance-design'
  price: number;
  contact: string;
  posterId: string;
  posterName: string;
  collegeName: string;
  imageUrl?: string;
  isCustomOrder?: boolean; // Added
  customOrderDescription?: string; // Added
}

export const useServiceListings = (categories?: string[], collegeName?: string) => { // Made categories optional
  const [serviceListings, setServiceListings] = useState<ServicePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceListings = useCallback(async () => {
    if (!collegeName) {
      setIsLoading(false);
      setError("College name is required to fetch service listings.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.equal('collegeName', collegeName),
        Query.orderDesc('$createdAt'),
      ];

      if (categories && categories.length > 0) {
        queries.push(Query.equal('category', categories));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        queries
      );
      setServiceListings(response.documents as unknown as ServicePost[]);
    } catch (e: any) {
      console.error("Error fetching service listings:", e);
      setError(e.message || "Failed to load service listings.");
    } finally {
      setIsLoading(false);
    }
  }, [categories, collegeName]);

  useEffect(() => {
    fetchServiceListings();
  }, [fetchServiceListings]);

  return { serviceListings, isLoading, error, refetch: fetchServiceListings };
};