"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CANTEEN_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query, ID } from 'appwrite';

export interface CanteenItem extends Models.Document {
  name: string;
  description: string;
  price: number;
  category: string; // e.g., 'snacks', 'drinks', 'meals'
  imageUrl?: string;
  isAvailable: boolean;
  collegeName: string;
}

export const useCanteenData = (collegeName?: string) => {
  const [canteenItems, setCanteenItems] = useState<CanteenItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCanteenItems = useCallback(async () => {
    if (!collegeName) {
      setIsLoading(false);
      setError("College name is required to fetch canteen items.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        [
          Query.equal('collegeName', collegeName),
          Query.orderAsc('name'),
        ]
      );
      setCanteenItems(response.documents as unknown as CanteenItem[]);
    } catch (e: any) {
      console.error("Error fetching canteen items:", e);
      setError(e.message || "Failed to load canteen items.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeName]);

  const addCanteenItem = async (itemData: Omit<CanteenItem, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>) => {
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        ID.unique(),
        itemData
      );
      fetchCanteenItems(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error("Error adding canteen item:", e);
      setError(e.message || "Failed to add canteen item.");
      return false;
    }
  };

  const updateCanteenItem = async (itemId: string, itemData: Partial<Omit<CanteenItem, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>>) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        itemId,
        itemData
      );
      fetchCanteenItems(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error("Error updating canteen item:", e);
      setError(e.message || "Failed to update canteen item.");
      return false;
    }
  };

  const deleteCanteenItem = async (itemId: string) => {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        itemId
      );
      fetchCanteenItems(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error("Error deleting canteen item:", e);
      setError(e.message || "Failed to delete canteen item.");
      return false;
    }
  };

  useEffect(() => {
    fetchCanteenItems();
  }, [fetchCanteenItems]);

  return {
    canteenItems,
    isLoading,
    error,
    refetch: fetchCanteenItems,
    addCanteenItem,
    updateCanteenItem,
    deleteCanteenItem,
  };
};