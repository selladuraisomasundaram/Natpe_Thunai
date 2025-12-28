"use client";

import { useState, useEffect } from 'react';
import { Databases, Query, Models, ID } from 'appwrite';
import { client } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AppwriteDocument } from '@/types/appwrite';

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SERVICE_LISTINGS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SERVICE_LISTINGS_COLLECTION_ID;

export type ServiceCategory = 'academic' | 'tech' | 'creative' | 'manual' | 'custom' | 'other';
export type ServiceStatus = 'available' | 'unavailable' | 'completed';

export interface ServicePost extends AppwriteDocument {
  title: string;
  description: string;
  category: ServiceCategory;
  price: number; // Can be 0 for free services, or a budget for custom requests
  isCustomOrder: boolean; // True if it's a request for a custom service
  imageUrl?: string;
  posterId: string;
  posterName: string; // Added posterName
  collegeName: string;
  contact: string; // Added contact
  status: ServiceStatus;
}

const useServiceListings = () => {
  const { user, userPreferences } = useAuth();
  const [services, setServices] = useState<ServicePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (userPreferences?.collegeName && userPreferences.collegeName !== 'N/A') {
        queries.push(Query.equal('collegeName', userPreferences.collegeName));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        SERVICE_LISTINGS_COLLECTION_ID,
        queries
      );
      setServices(response.documents as ServicePost[]); // Type assertion is now safer
    } catch (err: any) {
      setError('Failed to fetch service listings.');
      console.error('Error fetching service listings:', err);
      toast.error('Failed to load service listings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [userPreferences?.collegeName]);

  const postService = async (serviceData: Omit<ServicePost, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId' | '$sequence' | 'posterId' | 'posterName' | 'collegeName' | 'status'>) => {
    if (!user || !userPreferences) {
      toast.error("You must be logged in to post a service.");
      return;
    }

    try {
      const newService = await databases.createDocument(
        DATABASE_ID,
        SERVICE_LISTINGS_COLLECTION_ID,
        ID.unique(),
        {
          ...serviceData,
          posterId: user.$id,
          posterName: user.name,
          collegeName: userPreferences.collegeName,
          status: 'available',
        },
        [
          Models.Permission.read(Models.Role.any()),
          Models.Permission.write(Models.Role.user(user.$id)),
        ]
      );
      setServices(prev => [newService as ServicePost, ...prev]); // Type assertion is now safer
      toast.success("Service posted successfully!");
    } catch (err: any) {
      toast.error("Failed to post service: " + err.message);
      console.error("Error posting service:", err);
    }
  };

  const updateServiceStatus = async (serviceId: string, newStatus: ServiceStatus) => {
    if (!user) {
      toast.error("You must be logged in to update service status.");
      return;
    }
    try {
      await databases.updateDocument(
        DATABASE_ID,
        SERVICE_LISTINGS_COLLECTION_ID,
        serviceId,
        { status: newStatus },
        [Models.Permission.write(Models.Role.user(user.$id))]
      );
      setServices(prev =>
        prev.map(service =>
          service.$id === serviceId ? { ...service, status: newStatus } : service
        )
      );
      toast.success("Service status updated.");
    } catch (err: any) {
      toast.error("Failed to update service status: " + err.message);
      console.error("Error updating service status:", err);
    }
  };

  return { services, isLoading, error, refetch: fetchServices, postService, updateServiceStatus };
};

export default useServiceListings;