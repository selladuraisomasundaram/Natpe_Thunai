"use client";

import { useState, useEffect } from 'react';
import { Databases, Query, Models, ID } from 'appwrite';
import { client } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AppwriteDocument } from '@/types/appwrite';

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const LOST_FOUND_COLLECTION_ID = import.meta.env.VITE_APPWRITE_LOST_FOUND_COLLECTION_ID;

export type ItemType = 'Lost' | 'Found'; // Capitalized for consistency
export type ItemStatus = 'Active' | 'Resolved'; // Capitalized for consistency

export interface LostFoundItem extends AppwriteDocument {
  itemName: string; // Added itemName
  title: string;
  description: string;
  type: ItemType;
  status: ItemStatus;
  location: string;
  date: string; // ISO date string, e.g., when lost/found - Added date
  imageUrl?: string;
  posterId: string;
  posterName: string;
  collegeName: string;
  contact: string; // Added contact
  reclaimedBy?: string; // Name of the person who reclaimed it
}

const useLostAndFoundListings = () => {
  const { user, userPreferences } = useAuth();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (userPreferences?.collegeName && userPreferences.collegeName !== 'N/A') {
        queries.push(Query.equal('collegeName', userPreferences.collegeName));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        LOST_FOUND_COLLECTION_ID,
        queries
      );
      setItems(response.documents as LostFoundItem[]); // Type assertion is now safer
    } catch (err: any) {
      setError('Failed to fetch lost and found items.');
      console.error('Error fetching lost and found items:', err);
      toast.error('Failed to load lost and found items.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [userPreferences?.collegeName]);

  const postItem = async (itemData: Omit<LostFoundItem, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId' | '$sequence' | 'posterId' | 'posterName' | 'collegeName' | 'status' | 'reclaimedBy'>) => {
    if (!user || !userPreferences) {
      toast.error("You must be logged in to post an item.");
      return;
    }

    try {
      const newItem = await databases.createDocument(
        DATABASE_ID,
        LOST_FOUND_COLLECTION_ID,
        ID.unique(),
        {
          ...itemData,
          posterId: user.$id,
          posterName: user.name,
          collegeName: userPreferences.collegeName,
          status: itemData.type === "Lost" ? "Active" : "Active", // Default status based on type
        },
        [
          Models.Permission.read(Models.Role.any()),
          Models.Permission.write(Models.Role.user(user.$id)),
        ]
      );
      setItems(prev => [newItem as LostFoundItem, ...prev]); // Type assertion is now safer
      toast.success("Item posted successfully!");
    } catch (err: any) {
      toast.error("Failed to post item: " + err.message);
      console.error("Error posting item:", err);
    }
  };

  const updateItemStatus = async (itemId: string, newStatus: ItemStatus, reclaimedBy?: string) => {
    if (!user) {
      toast.error("You must be logged in to update item status.");
      return;
    }
    try {
      const updateData: Partial<LostFoundItem> = { status: newStatus };
      if (reclaimedBy) updateData.reclaimedBy = reclaimedBy;

      await databases.updateDocument(
        DATABASE_ID,
        LOST_FOUND_COLLECTION_ID,
        itemId,
        updateData,
        [Models.Permission.write(Models.Role.user(user.$id))]
      );
      setItems(prev =>
        prev.map(item =>
          item.$id === itemId ? { ...item, ...updateData } : item
        )
      );
      toast.success("Item status updated.");
    } catch (err: any) {
      toast.error("Failed to update item status: " + err.message);
      console.error("Error updating item status:", err);
    }
  };

  return { items, isLoading, error, refetch: fetchItems, postItem, updateItemStatus };
};

export default useLostAndFoundListings;