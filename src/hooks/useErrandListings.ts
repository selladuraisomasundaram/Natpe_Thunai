"use client";

import { useState, useEffect } from 'react';
import { Databases, Query, Models, ID } from 'appwrite';
import { client } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AppwriteDocument } from '@/types/appwrite';

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const ERRAND_LISTINGS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ERRAND_LISTINGS_COLLECTION_ID;

export type ErrandType = 'delivery' | 'pickup' | 'task' | 'other';
export type ErrandStatus = 'open' | 'assigned' | 'completed' | 'cancelled';

export interface ErrandPost extends AppwriteDocument {
  title: string;
  description: string;
  type: ErrandType;
  reward: number; // e.g., cash reward
  location: string; // Pickup/delivery location
  deadline: string; // ISO date string
  posterId: string;
  posterName: string;
  collegeName: string;
  contactInfo: string;
  status: ErrandStatus;
  assignedToId?: string;
  assignedToName?: string;
}

const useErrandListings = () => {
  const { user, userPreferences } = useAuth();
  const [errands, setErrands] = useState<ErrandPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchErrands = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (userPreferences?.collegeName && userPreferences.collegeName !== 'N/A') {
        queries.push(Query.equal('collegeName', userPreferences.collegeName));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        ERRAND_LISTINGS_COLLECTION_ID,
        queries
      );
      setErrands(response.documents as ErrandPost[]); // Type assertion is now safer
    } catch (err: any) {
      setError('Failed to fetch errand listings.');
      console.error('Error fetching errand listings:', err);
      toast.error('Failed to load errand listings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchErrands();
  }, [userPreferences?.collegeName]);

  const postErrand = async (errandData: Omit<ErrandPost, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId' | '$sequence' | 'posterId' | 'posterName' | 'collegeName' | 'status' | 'assignedToId' | 'assignedToName'>) => {
    if (!user || !userPreferences) {
      toast.error("You must be logged in to post an errand.");
      return;
    }

    try {
      const newErrand = await databases.createDocument(
        DATABASE_ID,
        ERRAND_LISTINGS_COLLECTION_ID,
        ID.unique(),
        {
          ...errandData,
          posterId: user.$id,
          posterName: user.name,
          collegeName: userPreferences.collegeName,
          status: 'open',
        },
        [
          Models.Permission.read(Models.Role.any()),
          Models.Permission.write(Models.Role.user(user.$id)),
        ]
      );
      setErrands(prev => [newErrand as ErrandPost, ...prev]); // Type assertion is now safer
      toast.success("Errand posted successfully!");
    } catch (err: any) {
      toast.error("Failed to post errand: " + err.message);
      console.error("Error posting errand:", err);
    }
  };

  const updateErrandStatus = async (errandId: string, newStatus: ErrandStatus, assignedToId?: string, assignedToName?: string) => {
    if (!user) {
      toast.error("You must be logged in to update errand status.");
      return;
    }
    try {
      const updateData: Partial<ErrandPost> = { status: newStatus };
      if (assignedToId) updateData.assignedToId = assignedToId;
      if (assignedToName) updateData.assignedToName = assignedToName;

      await databases.updateDocument(
        DATABASE_ID,
        ERRAND_LISTINGS_COLLECTION_ID,
        errandId,
        updateData,
        [Models.Permission.write(Models.Role.user(user.$id))] // Only poster or assigned user can update
      );
      setErrands(prev =>
        prev.map(errand =>
          errand.$id === errandId ? { ...errand, ...updateData } : errand
        )
      );
      toast.success("Errand status updated.");
    } catch (err: any) {
      toast.error("Failed to update errand status: " + err.message);
      console.error("Error updating errand status:", err);
    }
  };

  return { errands, isLoading, error, refetch: fetchErrands, postErrand, updateErrandStatus };
};

export default useErrandListings;