"use client";

import { useState, useEffect } from 'react';
import { Databases, Query, Models, ID } from 'appwrite';
import { client } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AppwriteDocument } from '@/types/appwrite';

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SERVICE_REVIEWS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SERVICE_REVIEWS_COLLECTION_ID;

export interface ServiceReview extends AppwriteDocument {
  serviceId: string;
  providerId: string; // Added providerId
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1-5
  comment: string;
  collegeName: string;
}

interface ServiceReviewsState {
  reviews: ServiceReview[];
  averageRating: number;
  isLoading: boolean;
  error: string | null;
  submitReview: (serviceId: string, providerId: string, rating: number, comment: string) => Promise<void>;
  refetch: () => void;
}

const useServiceReviews = (serviceId?: string): ServiceReviewsState => {
  const { user, userPreferences } = useAuth();
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (serviceId) {
        queries.push(Query.equal('serviceId', serviceId));
      }
      if (userPreferences?.collegeName && userPreferences.collegeName !== 'N/A') {
        queries.push(Query.equal('collegeName', userPreferences.collegeName));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        SERVICE_REVIEWS_COLLECTION_ID,
        queries
      );
      const fetchedReviews = response.documents as ServiceReview[]; // Type assertion is now safer
      setReviews(fetchedReviews);

      if (fetchedReviews.length > 0) {
        const totalRating = fetchedReviews.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(totalRating / fetchedReviews.length);
      } else {
        setAverageRating(0);
      }
    } catch (err: any) {
      setError('Failed to fetch service reviews.');
      console.error('Error fetching service reviews:', err);
      toast.error('Failed to load service reviews.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [serviceId, userPreferences?.collegeName]);

  const submitReview = async (
    targetServiceId: string,
    providerId: string,
    rating: number,
    comment: string
  ) => {
    if (!user || !userPreferences) {
      toast.error("You must be logged in to submit a review.");
      return;
    }

    try {
      const newReview = await databases.createDocument(
        DATABASE_ID,
        SERVICE_REVIEWS_COLLECTION_ID,
        ID.unique(),
        {
          serviceId: targetServiceId,
          providerId: providerId,
          reviewerId: user.$id,
          reviewerName: user.name,
          rating,
          comment,
          collegeName: userPreferences.collegeName,
        },
        [
          Models.Permission.read(Models.Role.any()),
          Models.Permission.write(Models.Role.user(user.$id)),
        ]
      );
      setReviews(prev => {
        const updatedReviews = [newReview as ServiceReview, ...prev];
        const totalRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(totalRating / updatedReviews.length);
        return updatedReviews;
      });
      toast.success("Review posted successfully!");
    } catch (err: any) {
      toast.error("Failed to post review: " + err.message);
      console.error("Error posting review:", err);
    }
  };

  return { reviews, averageRating, isLoading, error, submitReview, refetch: fetchReviews };
};

export default useServiceReviews;