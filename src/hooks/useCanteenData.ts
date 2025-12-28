"use client";

import { useState, useEffect } from 'react';
import { Databases, Query, Models, ID } from 'appwrite';
import { client } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AppwriteDocument } from '@/types/appwrite';

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const CANTEENS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CANTEENS_COLLECTION_ID;
const FOOD_OFFERINGS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FOOD_OFFERINGS_COLLECTION_ID;

export interface CanteenData extends AppwriteDocument {
  name: string;
  collegeName: string;
  location: string;
  contactInfo: string;
  openingHours: string;
  description?: string;
  imageUrl?: string;
}

export interface FoodOffering extends AppwriteDocument {
  canteenId: string;
  canteenName: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

const useCanteenData = () => {
  const { user, userPreferences } = useAuth();
  const [allCanteens, setAllCanteens] = useState<CanteenData[]>([]);
  const [allOfferings, setAllOfferings] = useState<FoodOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCanteenAndOfferingData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const canteenQueries = [Query.orderAsc('name')];
      if (userPreferences?.collegeName && userPreferences.collegeName !== 'N/A') {
        canteenQueries.push(Query.equal('collegeName', userPreferences.collegeName));
      }

      const canteenResponse = await databases.listDocuments(
        DATABASE_ID,
        CANTEENS_COLLECTION_ID,
        canteenQueries
      );
      setAllCanteens(canteenResponse.documents as CanteenData[]); // Type assertion is now safer

      const offeringQueries = [Query.orderAsc('name')];
      // Filter offerings by canteens in the user's college
      const collegeCanteenIds = canteenResponse.documents.map(c => c.$id);
      if (collegeCanteenIds.length > 0) {
        offeringQueries.push(Query.equal('canteenId', collegeCanteenIds));
      } else if (userPreferences?.collegeName && userPreferences.collegeName !== 'N/A') {
        // If no canteens found for college, no offerings either
        setAllOfferings([]);
        setIsLoading(false);
        return;
      }

      const offeringResponse = await databases.listDocuments(
        DATABASE_ID,
        FOOD_OFFERINGS_COLLECTION_ID,
        offeringQueries
      );
      setAllOfferings(offeringResponse.documents as FoodOffering[]); // Type assertion is now safer

    } catch (err: any) {
      setError('Failed to fetch canteen and food offering data.');
      console.error('Error fetching canteen data:', err);
      toast.error('Failed to load canteen data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCanteenAndOfferingData();
  }, [userPreferences?.collegeName]);

  const addCanteen = async (canteenData: Omit<CanteenData, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId' | '$sequence' | 'collegeName'>) => {
    if (!user || !userPreferences) {
      toast.error("You must be logged in to add a canteen.");
      return;
    }
    try {
      const newCanteen = await databases.createDocument(
        DATABASE_ID,
        CANTEENS_COLLECTION_ID,
        ID.unique(),
        {
          ...canteenData,
          collegeName: userPreferences.collegeName,
        },
        [
          Models.Permission.read(Models.Role.any()),
          Models.Permission.write(Models.Role.user(user.$id)),
        ]
      );
      setAllCanteens(prev => [newCanteen as CanteenData, ...prev]); // Type assertion is now safer
      toast.success("Canteen added successfully!");
    } catch (err: any) {
      toast.error("Failed to add canteen: " + err.message);
      console.error("Error adding canteen:", err);
    }
  };

  const addFoodOffering = async (offeringData: Omit<FoodOffering, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId' | '$sequence'>) => {
    if (!user) {
      toast.error("You must be logged in to add a food offering.");
      return;
    }
    try {
      const newOffering = await databases.createDocument(
        DATABASE_ID,
        FOOD_OFFERINGS_COLLECTION_ID,
        ID.unique(),
        offeringData,
        [
          Models.Permission.read(Models.Role.any()),
          Models.Permission.write(Models.Role.user(user.$id)),
        ]
      );
      setAllOfferings(prev => [newOffering as FoodOffering, ...prev]);
      toast.success("Food offering added successfully!");
    } catch (err: any) {
      toast.error("Failed to add food offering: " + err.message);
      console.error("Error adding food offering:", err);
    }
  };

  const updateCanteen = async (canteenId: string, updatedData: Partial<CanteenData>) => {
    if (!user) {
      toast.error("You must be logged in to update a canteen.");
      return;
    }
    try {
      const updatedCanteen = await databases.updateDocument(
        DATABASE_ID,
        CANTEENS_COLLECTION_ID,
        canteenId,
        updatedData,
        [Models.Permission.write(Models.Role.user(user.$id))]
      );
      setAllCanteens(prev =>
        prev.map(canteen =>
          canteen.$id === canteenId ? { ...canteen, ...updatedData } : canteen
        )
      );
      toast.success("Canteen updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update canteen: " + err.message);
      console.error("Error updating canteen:", err);
    }
  };

  const updateFoodOffering = async (offeringId: string, updatedData: Partial<FoodOffering>) => {
    if (!user) {
      toast.error("You must be logged in to update a food offering.");
      return;
    }
    try {
      const updatedOffering = await databases.updateDocument(
        DATABASE_ID,
        FOOD_OFFERINGS_COLLECTION_ID,
        offeringId,
        updatedData,
        [Models.Permission.write(Models.Role.user(user.$id))]
      );
      setAllOfferings(prev =>
        prev.map(offering =>
          offering.$id === offeringId ? { ...offering, ...updatedData } : offering
        )
      );
      toast.success("Food offering updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update food offering: " + err.message);
      console.error("Error updating food offering:", err);
    }
  };

  const deleteCanteen = async (canteenId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete a canteen.");
      return;
    }
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        CANTEENS_COLLECTION_ID,
        canteenId,
      );
      setAllCanteens(prev => prev.filter(canteen => canteen.$id !== canteenId));
      // Also delete associated offerings
      setAllOfferings(prev => prev.filter(offering => offering.canteenId !== canteenId));
      toast.success("Canteen deleted successfully!");
    } catch (err: any) {
      toast.error("Failed to delete canteen: " + err.message);
      console.error("Error deleting canteen:", err);
    }
  };

  const deleteFoodOffering = async (offeringId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete a food offering.");
      return;
    }
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        FOOD_OFFERINGS_COLLECTION_ID,
        offeringId,
      );
      setAllOfferings(prev => prev.filter(offering => offering.$id !== offeringId));
      toast.success("Food offering deleted successfully!");
    } catch (err: any) {
      toast.error("Failed to delete food offering: " + err.message);
      console.error("Error deleting food offering:", err);
    }
  };

  return {
    allCanteens,
    allOfferings,
    isLoading,
    error,
    refetch: fetchCanteenAndOfferingData,
    addCanteen,
    addFoodOffering,
    updateCanteen,
    updateFoodOffering,
    deleteCanteen,
    deleteFoodOffering,
  };
};

export default useCanteenData;