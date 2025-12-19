"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_LOST_FOUND_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query, ID } from 'appwrite';

export interface LostFoundItem extends Models.Document {
  title: string;
  description: string;
  type: 'lost' | 'found';
  category: string; // e.g., 'electronics', 'clothing', 'documents'
  location: string; // Where it was lost/found
  contact: string;
  posterId: string;
  posterName: string;
  collegeName: string;
  imageUrl?: string;
  status: 'active' | 'resolved';
}

export const useLostAndFoundListings = (collegeName?: string) => {
  const [listings, setListings] = useState<LostFoundItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    if (!collegeName) {
      setIsLoading(false);
      setError("College name is required to fetch lost and found listings.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_LOST_FOUND_COLLECTION_ID,
        [
          Query.equal('collegeName', collegeName),
          Query.equal('status', 'active'),
          Query.orderDesc('$createdAt'),
        ]
      );
      setListings(response.documents as unknown as LostFoundItem[]);
    } catch (e: any) {
      console.error("Error fetching lost and found listings:", e);
      setError(e.message || "Failed to load lost and found listings.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeName]);

  const addListing = async (itemData: Omit<LostFoundItem, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>) => {
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_LOST_FOUND_COLLECTION_ID,
        ID.unique(),
        itemData
      );
      fetchListings(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error("Error adding lost and found listing:", e);
      setError(e.message || "Failed to add listing.");
      return false;
    }
  };

  const updateListingStatus = async (listingId: string, status: LostFoundItem['status']) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_LOST_FOUND_COLLECTION_ID,
        listingId,
        { status }
      );
      fetchListings(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error("Error updating listing status:", e);
      setError(e.message || "Failed to update listing status.");
      return false;
    }
  };

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return {
    listings,
    isLoading,
    error,
    refetch: fetchListings,
    addListing,
    updateListingStatus,
  };
};