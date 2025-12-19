"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_COLLABORATORS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';

export interface CollaboratorPost extends Models.Document {
  title: string;
  description: string;
  skillsNeeded: string[]; // e.g., ['frontend', 'backend', 'design']
  contact: string;
  posterId: string;
  posterName: string;
  collegeName: string;
  status: 'open' | 'closed';
}

export const useCollaboratorPosts = (collegeName?: string) => {
  const [posts, setPosts] = useState<CollaboratorPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!collegeName) {
      setIsLoading(false);
      setError("College name is required to fetch collaborator posts.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLABORATORS_COLLECTION_ID,
        [
          Query.equal('collegeName', collegeName),
          Query.equal('status', 'open'),
          Query.orderDesc('$createdAt'),
        ]
      );
      setPosts(response.documents as unknown as CollaboratorPost[]);
    } catch (e: any) {
      console.error("Error fetching collaborator posts:", e);
      setError(e.message || "Failed to load collaborator posts.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeName]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, isLoading, error, refetch: fetchPosts };
};