"use client";

import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, Models } from 'appwrite';
import { useAuth } from '@/context/AuthContext'; // NEW: Use useAuth to get current user's college
import toast from 'react-hot-toast';

export interface DeveloperMessage {
  $id: string;
  senderId: string;
  senderName: string;
  collegeName: string;
  message: string;
  createdAt: string;
}

interface DeveloperMessagesState {
  allMessages: DeveloperMessage[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  sendMessage: (message: string) => Promise<void>;
}

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default_database_id';
const DEVELOPER_MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID || 'developer_messages';

export const useDeveloperMessages = (collegeNameFilter?: string): DeveloperMessagesState => { // NEW: Add collegeNameFilter parameter
  const { user, userPreferences, loading: isAuthLoading } = useAuth(); // NEW: Use useAuth to get current user's college
  const [allMessages, setAllMessages] = useState<DeveloperMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveCollegeNameFilter = collegeNameFilter || userPreferences?.collegeName;

  const fetchMessages = useCallback(async () => {
    if (isAuthLoading) return; // Wait for auth to load

    setIsLoading(true);
    setError(null);
    try {
      let queries = [
        Query.orderAsc('$createdAt'),
        Query.limit(100) // Fetch last 100 messages
      ];

      if (effectiveCollegeNameFilter) {
        queries.push(Query.equal('collegeName', effectiveCollegeNameFilter));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        DEVELOPER_MESSAGES_COLLECTION_ID,
        queries
      );
      setAllMessages(response.documents as DeveloperMessage[]);
    } catch (err: any) {
      console.error("Failed to fetch developer messages:", err);
      setError(err.message || "Failed to fetch developer messages.");
      toast.error(err.message || "Failed to fetch developer messages.");
    } finally {
      setIsLoading(false);
    }
  }, [effectiveCollegeNameFilter, isAuthLoading]);

  useEffect(() => {
    fetchMessages();

    const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.${DEVELOPER_MESSAGES_COLLECTION_ID}.documents`, response => {
      const payload = response.payload as DeveloperMessage;
      if (!effectiveCollegeNameFilter || payload.collegeName === effectiveCollegeNameFilter) {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setAllMessages(prev => [...prev, payload]);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchMessages, effectiveCollegeNameFilter]);

  const sendMessage = async (message: string) => {
    if (!user?.$id || !userPreferences?.name || !effectiveCollegeNameFilter) {
      toast.error("Please log in and ensure your college is set to send messages.");
      return;
    }
    try {
      await databases.createDocument(
        DATABASE_ID,
        DEVELOPER_MESSAGES_COLLECTION_ID,
        Models.ID.unique(),
        {
          senderId: user.$id,
          senderName: userPreferences.name,
          collegeName: effectiveCollegeNameFilter,
          message,
        }
      );
    } catch (err: any) {
      console.error("Failed to send message:", err);
      toast.error(err.message || "Failed to send message.");
      throw err;
    }
  };

  return { allMessages, isLoading, error, refetch: fetchMessages, sendMessage };
};