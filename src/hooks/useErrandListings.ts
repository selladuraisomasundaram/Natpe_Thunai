"use client";

import { useState, useEffect, useCallback } from "react";
import { Query, Models } from "appwrite"; // Import Models
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";

// Define the structure of an errand post document
export interface ErrandPost extends Models.Document { // Extend Models.Document
  posterId: string;
  posterName: string;
  collegeName: string;
  title: string;
  description: string;
  category: string;
  otherCategoryDescription?: string;
  compensation: string;
  deadline?: string;
  contact: string;
}

export const useErrandListings = (categories: string[] = []) => {
  const { userProfile } = useAuth();
  const [errands, setErrands] = useState<ErrandPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchErrands = useCallback(async () => {
    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setError("User college information not available.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.equal("collegeName", userProfile.collegeName),
        Query.orderDesc("$createdAt"),
      ];

      if (categories.length > 0) {
        queries.push(Query.or(categories.map(cat => Query.equal("category", cat))));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_ERRANDS_COLLECTION_ID,
        queries
      );
      setErrands(response.documents as ErrandPost[]);
    } catch (err: any) {
      console.error("Error fetching errands:", err);
      setError(err.message || "Failed to fetch errand listings.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName, categories]);

  useEffect(() => {
    fetchErrands();

    // Realtime updates
    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_ERRANDS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setErrands((prev) => [response.payload as ErrandPost, ...prev]);
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          setErrands((prev) =>
            prev.map((errand) =>
              errand.$id === (response.payload as ErrandPost).$id
                ? (response.payload as ErrandPost)
                : errand
            )
          );
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          setErrands((prev) =>
            prev.filter((errand) => errand.$id !== (response.payload as ErrandPost).$id)
          );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchErrands]);

  return { errands, isLoading, error, refetchErrands: fetchErrands };
};