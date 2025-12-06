"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_LOOKING_FOR_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query, ID } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface LookingForPost extends Models.Document {
  title: string;
  description: string;
  category: string; // e.g., "electronics", "books", "service", "other"
  budget: string; // e.g., "₹500-₹1000", "Negotiable"
  contact: string; // Email or phone number
  posterId: string;
  posterName: string;
  collegeName: string;
}

// NEW: Define a specific interface for the data that can be created
export interface CreateLookingForPostData {
  title: string;
  description: string;
  category: string;
  budget: string;
  contact: string;
}

interface LookingForPostsState {
  posts: LookingForPost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createPost: (postData: CreateLookingForPostData) => Promise<void>; // NEW: Use CreateLookingForPostData
}

export const useLookingForPosts = (): LookingForPostsState => {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState<LookingForPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setPosts([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_LOOKING_FOR_COLLECTION_ID,
        [
          Query.equal('collegeName', userProfile.collegeName),
          Query.orderDesc('$createdAt')
        ]
      );
      setPosts(response.documents as unknown as LookingForPost[]);
    } catch (err: any) {
      console.error("Error fetching 'Looking For' posts:", err);
      setError(err.message || "Failed to load 'Looking For' posts.");
      toast.error("Failed to load 'Looking For' posts.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]);

  const createPost = useCallback(async (postData: CreateLookingForPostData) => { // NEW: Use CreateLookingForPostData
    if (!user || !userProfile) {
      toast.error("You must be logged in to create a post.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_LOOKING_FOR_COLLECTION_ID,
        ID.unique(),
        {
          ...postData,
          posterId: user.$id,
          posterName: user.name,
          collegeName: userProfile.collegeName,
        }
      );
      toast.success("Your 'Looking For' post has been created!");
      fetchPosts(); // Refetch to update the list
    } catch (err: any) {
      console.error("Error creating 'Looking For' post:", err);
      toast.error(err.message || "Failed to create post.");
      throw err;
    }
  }, [user, userProfile, fetchPosts]);

  useEffect(() => {
    fetchPosts();

    if (!userProfile?.collegeName) return;

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_LOOKING_FOR_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as LookingForPost;

        if (payload.collegeName !== userProfile.collegeName) {
          return;
        }

        setPosts(prev => {
          let updatedPosts = prev;
          const existingIndex = prev.findIndex(p => p.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New 'Looking For' post: ${payload.title}`);
              updatedPosts = [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              updatedPosts = prev.map(p => p.$id === payload.$id ? payload : p);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`'Looking For' post removed: ${payload.title}`);
              updatedPosts = prev.filter(p => p.$id !== payload.$id);
            }
          }
          return updatedPosts;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchPosts, userProfile?.collegeName]);

  return { posts, isLoading, error, refetch: fetchPosts, createPost };
};