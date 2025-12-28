"use client";

import { useState, useEffect } from 'react';
import { Databases, Query, Models, ID } from 'appwrite';
import { client } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AppwriteDocument } from '@/types/appwrite';

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const BARGAIN_REQUESTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID;

export type BargainStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface BargainRequest extends AppwriteDocument {
  productId: string;
  productTitle: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  offeredPrice: number;
  status: BargainStatus;
  message?: string;
  collegeName: string;
}

const useBargainRequests = () => {
  const { user, userPreferences } = useAuth();
  const [buyerRequests, setBuyerRequests] = useState<BargainRequest[]>([]);
  const [sellerRequests, setSellerRequests] = useState<BargainRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBargainRequests = async () => {
    setIsLoading(true);
    setError(null);
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const commonQueries = [Query.orderDesc('$createdAt')];
      if (userPreferences?.collegeName && userPreferences.collegeName !== 'N/A') {
        commonQueries.push(Query.equal('collegeName', userPreferences.collegeName));
      }

      // Fetch requests where current user is the buyer
      const buyerResponse = await databases.listDocuments(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        [...commonQueries, Query.equal('buyerId', user.$id)]
      );
      setBuyerRequests(buyerResponse.documents as BargainRequest[]); // Type assertion is now safer

      // Fetch requests where current user is the seller
      const sellerResponse = await databases.listDocuments(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        [...commonQueries, Query.equal('sellerId', user.$id)]
      );
      setSellerRequests(sellerResponse.documents as BargainRequest[]); // Type assertion is now safer

    } catch (err: any) {
      setError('Failed to fetch bargain requests.');
      console.error('Error fetching bargain requests:', err);
      toast.error('Failed to load bargain requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBargainRequests();
  }, [user, userPreferences?.collegeName]);

  const sendBargainRequest = async (
    productId: string,
    productTitle: string,
    sellerId: string,
    sellerName: string,
    offeredPrice: number,
    message?: string
  ) => {
    if (!user || !userPreferences) {
      toast.error("You must be logged in to send a bargain request.");
      return;
    }

    try {
      const newRequest = await databases.createDocument(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        ID.unique(),
        {
          productId,
          productTitle,
          sellerId,
          sellerName,
          buyerId: user.$id,
          buyerName: user.name,
          offeredPrice,
          status: 'pending',
          message,
          collegeName: userPreferences.collegeName,
        },
        [
          Models.Permission.read(Models.Role.user(user.$id)),
          Models.Permission.write(Models.Role.user(user.$id)),
          Models.Permission.read(Models.Role.user(sellerId)),
          Models.Permission.write(Models.Role.user(sellerId)),
        ]
      );
      setBuyerRequests(prev => [newRequest as BargainRequest, ...prev]); // Type assertion is now safer
      toast.success("Bargain request sent!");
    } catch (err: any) {
      toast.error("Failed to send bargain request: " + err.message);
      console.error("Error sending bargain request:", err);
    }
  };

  const updateBargainRequestStatus = async (requestId: string, newStatus: BargainStatus) => {
    if (!user) {
      toast.error("You must be logged in to update a bargain request.");
      return;
    }
    try {
      await databases.updateDocument(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        requestId,
        { status: newStatus },
        [Models.Permission.write(Models.Role.user(user.$id))] // Only seller or buyer can update status
      );
      setBuyerRequests(prev =>
        prev.map(req =>
          req.$id === requestId ? { ...req, status: newStatus } : req
        )
      );
      setSellerRequests(prev =>
        prev.map(req =>
          req.$id === requestId ? { ...req, status: newStatus } : req
        )
      );
      toast.success("Bargain request status updated.");
    } catch (err: any) {
      toast.error("Failed to update bargain request status: " + err.message);
      console.error("Error updating bargain request status:", err);
    }
  };

  const checkExistingBargainRequest = async (productId: string, buyerId: string) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        [
          Query.equal('productId', productId),
          Query.equal('buyerId', buyerId),
          Query.notEqual('status', 'rejected'), // Consider only active or pending requests
          Query.limit(1)
        ]
      );
      if (response.documents.length > 0) {
        const request = response.documents[0] as BargainRequest; // Type assertion is now safer
        return { status: request.status, requestId: request.$id };
      }
      return null;
    } catch (err: any) {
      console.error("Error checking existing bargain request:", err);
      return null;
    }
  };

  return {
    buyerRequests,
    sellerRequests,
    isLoading,
    error,
    refetch: fetchBargainRequests,
    sendBargainRequest,
    updateBargainRequestStatus,
    checkExistingBargainRequest,
  };
};

export default useBargainRequests;