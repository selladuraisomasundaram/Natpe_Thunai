"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICE_REVIEWS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query, ID } from 'appwrite';

export interface ServiceReview extends Models.Document {
  serviceId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1-5 stars
  comment: string;
  collegeName: string;
}

export const useServiceReviews = (serviceId?: string, collegeName?: string) => {
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null); // Added averageRating

  const fetchReviews = useCallback(async () => {
    if (!collegeName) {
      setIsLoading(false);
      setError("College name is required to fetch service reviews.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.equal('collegeName', collegeName)];
      if (serviceId) {
        queries.push(Query.equal('serviceId', serviceId));
      }
      queries.push(Query.orderDesc('$createdAt'));

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
        queries
      );
      const fetchedReviews = response.documents as unknown as ServiceReview[];
      setReviews(fetchedReviews);

      if (fetchedReviews.length > 0) {
        const totalRating = fetchedReviews.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(totalRating / fetchedReviews.length);
      } else {
        setAverageRating(null);
      }

    } catch (e: any) {
      console.error("Error fetching service reviews:", e);
      setError(e.message || "Failed to load service reviews.");
    } finally {
      setIsLoading(false);
    }
  }, [serviceId, collegeName]);

  const addReview = async (reviewData: Omit<ServiceReview, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>) => {
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
        ID.unique(),
        reviewData
      );
      fetchReviews(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error("Error adding service review:", e);
      setError(e.message || "Failed to add service review.");
      return false;
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    isLoading,
    error,
    refetch: fetchReviews,
    addReview,
    averageRating, // Added to return
  };
};