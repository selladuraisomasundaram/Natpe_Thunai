"use client";

import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, ID, Models } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; // Ensure toast is imported

export interface BargainRequest extends Models.Document { // Extend Models.Document
  productId: string;
  productTitle: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  requestedPrice: number; // Changed to number
  status: 'initiated' | 'accepted' | 'rejected' | 'cancelled';
  collegeName: string;
  // createdAt: string; // Already in Models.Document
  // updatedAt: string; // Already in Models.Document
}

interface UseBargainRequestsState {
  buyerRequests: BargainRequest[];
  sellerRequests: BargainRequest[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  sendBargainRequest: (productId: string, productTitle: string, sellerId: string, sellerName: string, requestedPrice: number) => Promise<void>;
  acceptBargainRequest: (requestId: string) => Promise<void>;
  rejectBargainRequest: (requestId: string) => Promise<void>;
  cancelBargainRequest: (requestId: string) => Promise<void>;
  getBargainStatusForProduct: (productId: string) => Promise<'none' | 'initiated' | 'accepted' | 'rejected' | 'cancelled'>; // Updated return type
}

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default_database_id';
const BARGAIN_REQUESTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID || 'bargain_requests';

export const useBargainRequests = (): UseBargainRequestsState => {
  const { user, userPreferences, loading: isAuthLoading } = useAuth();
  const [buyerRequests, setBuyerRequests] = useState<BargainRequest[]>([]);
  const [sellerRequests, setSellerRequests] = useState<BargainRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBargainRequests = useCallback(async () => {
    if (isAuthLoading || !user?.$id || !userPreferences?.collegeName) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Fetch requests where current user is the buyer
      const buyerResponse = await databases.listDocuments(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        [
          Query.equal('buyerId', user.$id),
          Query.equal('collegeName', userPreferences.collegeName),
          Query.orderDesc('$createdAt')
        ]
      );
      setBuyerRequests(buyerResponse.documents as BargainRequest[]); // Corrected type assertion

      // Fetch requests where current user is the seller
      const sellerResponse = await databases.listDocuments(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        [
          Query.equal('sellerId', user.$id),
          Query.equal('collegeName', userPreferences.collegeName),
          Query.orderDesc('$createdAt')
        ]
      );
      setSellerRequests(sellerResponse.documents as BargainRequest[]); // Corrected type assertion

    } catch (err: any) {
      console.error("Failed to fetch bargain requests:", err);
      setError(err.message || "Failed to fetch bargain requests.");
      toast.error(err.message || "Failed to fetch bargain requests.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.$id, userPreferences?.collegeName, isAuthLoading]);

  useEffect(() => {
    fetchBargainRequests();

    const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.${BARGAIN_REQUESTS_COLLECTION_ID}.documents`, response => {
      if (!user?.$id || !userPreferences?.collegeName) return;

      const payload = response.payload as BargainRequest;
      if (payload.collegeName !== userPreferences.collegeName) return; // Only process for current college

      if (response.events.includes("databases.*.collections.*.documents.*.create") ||
          response.events.includes("databases.*.collections.*.documents.*.update") ||
          response.events.includes("databases.*.collections.*.documents.*.delete")) {

        if (payload.buyerId === user.$id) {
          setBuyerRequests(prev => {
            const existing = prev.find(req => req.$id === payload.$id);
            if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
              return prev.filter(req => req.$id !== payload.$id);
            } else if (existing) {
              return prev.map(req => req.$id === payload.$id ? payload : req);
            } else {
              return [payload, ...prev];
            }
          });
        }

        if (payload.sellerId === user.$id) {
          setSellerRequests(prev => {
            const existing = prev.find(req => req.$id === payload.$id);
            if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
              return prev.filter(req => req.$id !== payload.$id);
            } else if (existing) {
              return prev.map(req => req.$id === payload.$id ? payload : req);
            } else {
              return [payload, ...prev];
            }
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchBargainRequests, user?.$id, userPreferences?.collegeName]);

  const sendBargainRequest = async (productId: string, productTitle: string, sellerId: string, sellerName: string, requestedPrice: number) => {
    if (!user?.$id || !userPreferences?.collegeName || !userPreferences?.name) {
      toast.error("Please log in to send a bargain request.");
      return;
    }
    try {
      await databases.createDocument(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        ID.unique(),
        {
          productId,
          productTitle,
          sellerId,
          sellerName,
          buyerId: user.$id,
          buyerName: userPreferences.name,
          requestedPrice, // Already a number
          status: 'initiated',
          collegeName: userPreferences.collegeName,
        }
      );
      toast.success("Bargain request sent!");
      fetchBargainRequests();
    } catch (err: any) {
      console.error("Failed to send bargain request:", err);
      toast.error(err.message || "Failed to send bargain request.");
      throw err;
    }
  };

  const updateBargainStatus = async (requestId: string, status: BargainRequest['status']) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        requestId,
        { status }
      );
      toast.success(`Bargain request ${status}!`);
      fetchBargainRequests();
    } catch (err: any) {
      console.error(`Failed to ${status} bargain request:`, err);
      toast.error(`Failed to ${status} bargain request.`);
      throw err;
    }
  };

  const acceptBargainRequest = (requestId: string) => updateBargainStatus(requestId, 'accepted');
  const rejectBargainRequest = (requestId: string) => updateBargainStatus(requestId, 'rejected');
  const cancelBargainRequest = (requestId: string) => updateBargainStatus(requestId, 'cancelled');

  const getBargainStatusForProduct = useCallback(async (productId: string): Promise<'none' | 'initiated' | 'accepted' | 'rejected' | 'cancelled'> => {
    if (!user?.$id) return 'none';
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        [
          Query.equal('productId', productId),
          Query.equal('buyerId', user.$id),
          Query.orderDesc('$createdAt'),
          Query.limit(1)
        ]
      );
      if (response.documents.length > 0) {
        return (response.documents[0] as BargainRequest).status; // Corrected type assertion
      }
      return 'none';
    } catch (error) {
      console.error("Error fetching bargain status:", error);
      return 'none';
    }
  }, [user?.$id]);

  return {
    buyerRequests,
    sellerRequests,
    isLoading,
    error,
    refetch: fetchBargainRequests,
    sendBargainRequest,
    acceptBargainRequest,
    rejectBargainRequest,
    cancelBargainRequest,
    getBargainStatusForProduct,
  };
};