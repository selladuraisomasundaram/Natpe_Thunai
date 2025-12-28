"use client";

import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; // Ensure toast is imported

interface TotalUsersState {
  totalUsers: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default_database_id';
const USER_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USER_PROFILES_COLLECTION_ID || 'user_profiles'; // Assuming a collection to store user profiles with collegeName

export const useTotalUsers = (collegeNameFilter?: string): TotalUsersState => {
  const { userPreferences, loading: isAuthLoading } = useAuth();
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveCollegeNameFilter = collegeNameFilter || userPreferences?.collegeName;

  const fetchTotalUsers = useCallback(async () => {
    if (isAuthLoading) return; // Wait for auth to load

    setIsLoading(true);
    setError(null);
    try {
      let queries = [];
      if (effectiveCollegeNameFilter) {
        queries.push(Query.equal('collegeName', effectiveCollegeNameFilter));
      }
      // Note: Appwrite's listDocuments has a limit. For a true total count,
      // you might need to adjust pagination or use a cloud function if the number of users is very large.
      // For now, we'll assume listDocuments with default limit is sufficient for a count.
      const response = await databases.listDocuments(
        DATABASE_ID,
        USER_PROFILES_COLLECTION_ID,
        queries
      );
      setTotalUsers(response.total); // Appwrite's response includes total count
    } catch (err: any) {
      console.error("Failed to fetch total users:", err);
      setError(err.message || "Failed to fetch total users.");
      toast.error(err.message || "Failed to fetch total users.");
    } finally {
      setIsLoading(false);
    }
  }, [effectiveCollegeNameFilter, isAuthLoading]);

  useEffect(() => {
    fetchTotalUsers();
  }, [fetchTotalUsers]);

  return { totalUsers, isLoading, error, refetch: fetchTotalUsers };
};