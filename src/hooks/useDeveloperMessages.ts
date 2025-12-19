"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';

export interface DeveloperMessage extends Models.Document {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isDeveloper?: boolean; // Added for DeveloperDashboardPage
  collegeName?: string; // Added for DeveloperDashboardPage
}

export const useDeveloperMessages = () => {
  const [messages, setMessages] = useState<DeveloperMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID,
        [Query.orderDesc('timestamp')]
      );
      setMessages(response.documents as unknown as DeveloperMessage[]); // Corrected type assertion
    } catch (e: any) {
      console.error("Error fetching developer messages:", e);
      setError(e.message || "Failed to load developer messages.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, isLoading, error, refetch: fetchMessages };
};