"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query, ID } from 'appwrite';

export interface BargainRequest extends Models.Document {
  productId: string;
  productTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  proposedPrice: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  message?: string;
  collegeName: string;
}

export const useBargainRequests = (productId?: string, collegeName?: string) => {
  const [bargainRequests, setBargainRequests] = useState<BargainRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBargainRequests = useCallback(async () => {
    if (!collegeName) {
      setIsLoading(false);
      setError("College name is required to fetch bargain requests.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.equal('collegeName', collegeName)];
      if (productId) {
        queries.push(Query.equal('productId', productId));
      }
      queries.push(Query.orderDesc('$createdAt'));

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
        queries
      );
      setBargainRequests(response.documents as unknown as BargainRequest[]);
    } catch (e: any) {
      console.error("Error fetching bargain requests:", e);
      setError(e.message || "Failed to load bargain requests.");
    } finally {
      setIsLoading(false);
    }
  }, [productId, collegeName]);

  const createBargainRequest = async (
    productId: string,
    productTitle: string,
    sellerId: string,
    sellerName: string,
    proposedPrice: number,
    message: string,
    buyerId: string,
    buyerName: string,
    collegeName: string
  ) => {
    try {
      const newRequest: Omit<BargainRequest, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'> = {
        productId,
        productTitle,
        buyerId,
        buyerName,
        sellerId,
        sellerName,
        proposedPrice,
        status: 'pending',
        message,
        collegeName,
      };
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
        ID.unique(),
        newRequest
      );
      fetchBargainRequests(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error("Error creating bargain request:", e);
      setError(e.message || "Failed to create bargain request.");
      return false;
    }
  };

  const updateBargainRequestStatus = async (requestId: string, status: BargainRequest['status']) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
        requestId,
        { status }
      );
      fetchBargainRequests(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error("Error updating bargain request status:", e);
      setError(e.message || "Failed to update bargain request status.");
      return false;
    }
  };

  // Placeholder for sendBargainRequest (used in ProductDetailsPage)
  const sendBargainRequest = async (
    productId: string,
    productTitle: string,
    sellerId: string,
    sellerName: string,
    proposedPrice: number,
    message: string,
    buyerId: string,
    buyerName: string,
    collegeName: string
  ) => {
    console.log("Simulating sending bargain request:", { productId, proposedPrice });
    return createBargainRequest(productId, productTitle, sellerId, sellerName, proposedPrice, message, buyerId, buyerName, collegeName);
  };

  // Placeholder for getBargainStatusForProduct (used in ProductDetailsPage)
  const getBargainStatusForProduct = (productId: string, buyerId: string) => {
    const request = bargainRequests.find(req => req.productId === productId && req.buyerId === buyerId);
    return request ? request.status : null;
  };

  useEffect(() => {
    fetchBargainRequests();
  }, [fetchBargainRequests]);

  return {
    bargainRequests,
    isLoading,
    error,
    refetch: fetchBargainRequests,
    createBargainRequest,
    updateBargainRequestStatus,
    sendBargainRequest, // Added to return
    getBargainStatusForProduct, // Added to return
  };
};