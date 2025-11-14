"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';

export interface ServicePost extends Models.Document {
  title: string;
  description: string;
  category: string;
  price: string;
  contact: string;
  datePosted: string;
  customOrderDescription?: string;
  isCustomOrder?: boolean;
  posterId: string;
  posterName: string;
}

interface ServiceListingsState {
  services: ServicePost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useServiceListings = (category?: string): ServiceListingsState => {
  const [services, setServices] = useState<ServicePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const queries = [Query.orderDesc('$createdAt')];
    if (category) {
      queries.push(Query.equal('category', category));
    }

    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        queries
      );
      setServices(response.documents as unknown as ServicePost[]);
    } catch (err: any) {
      console.error(`Error fetching service listings for category ${category}:`, err);
      setError(err.message || "Failed to load service listings.");
      toast.error("Failed to load service listings.");
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchServices();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_SERVICES_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as ServicePost;

        // Filter real-time updates based on the current category filter
        const matchesCategory = !category || payload.category === category;

        setServices(prev => {
          const existingIndex = prev.findIndex(s => s.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1 && matchesCategory) {
              toast.info(`New service posted: ${payload.title}`);
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Service updated: ${payload.title}`);
              return prev.map(s => s.$id === payload.$id ? payload : s);
            } else if (matchesCategory) {
                // Handle case where a service is updated and now matches the filter
                return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`Service removed: ${payload.title}`);
              return prev.filter(s => s.$id !== payload.$id);
            }
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchServices, category]);

  return { services, isLoading, error, refetch: fetchServices };
};