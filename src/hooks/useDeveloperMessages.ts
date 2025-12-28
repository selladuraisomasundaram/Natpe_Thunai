"use client";

import { useState, useEffect } from 'react';
import { Databases, Query, Models, ID } from 'appwrite';
import { client } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AppwriteDocument } from '@/types/appwrite';

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const DEVELOPER_MESSAGES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID;

export interface DeveloperMessage extends AppwriteDocument {
  senderId: string;
  senderName: string;
  collegeName: string;
  message: string;
  status: 'pending' | 'resolved';
}

const useDeveloperMessages = () => {
  const { user, userPreferences } = useAuth();
  const [messages, setMessages] = useState<DeveloperMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (userPreferences?.collegeName && userPreferences.collegeName !== 'N/A') {
        queries.push(Query.equal('collegeName', userPreferences.collegeName));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        DEVELOPER_MESSAGES_COLLECTION_ID,
        queries
      );
      setMessages(response.documents as DeveloperMessage[]); // Type assertion is now safer
    } catch (err: any) {
      setError('Failed to fetch developer messages.');
      console.error('Error fetching developer messages:', err);
      toast.error('Failed to load developer messages.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [userPreferences?.collegeName]);

  const sendMessage = async (messageContent: string) => {
    if (!user || !userPreferences) {
      toast.error("You must be logged in to send a message.");
      return;
    }

    try {
      const newMessage = await databases.createDocument(
        DATABASE_ID,
        DEVELOPER_MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          senderId: user.$id,
          senderName: user.name,
          collegeName: userPreferences.collegeName,
          message: messageContent,
          status: 'pending',
        },
        [
          Models.Permission.read(Models.Role.any()), // Developers can read
          Models.Permission.write(Models.Role.user(user.$id)),
        ]
      );
      setMessages(prev => [newMessage as DeveloperMessage, ...prev]); // Type assertion is now safer
      toast.success("Message sent to developers!");
    } catch (err: any) {
      toast.error("Failed to send message: " + err.message);
      console.error("Error sending message:", err);
    }
  };

  const updateMessageStatus = async (messageId: string, newStatus: DeveloperMessage['status']) => {
    if (!user) {
      toast.error("You must be logged in to update message status.");
      return;
    }
    try {
      await databases.updateDocument(
        DATABASE_ID,
        DEVELOPER_MESSAGES_COLLECTION_ID,
        messageId,
        { status: newStatus },
        [Models.Permission.write(Models.Role.user(user.$id))] // Only sender or specific role can update
      );
      setMessages(prev =>
        prev.map(msg =>
          msg.$id === messageId ? { ...msg, status: newStatus } : msg
        )
      );
      toast.success("Message status updated.");
    } catch (err: any) {
      toast.error("Failed to update message status: " + err.message);
      console.error("Error updating message status:", err);
    }
  };

  return { messages, isLoading, error, refetch: fetchMessages, sendMessage, updateMessageStatus };
};

export default useDeveloperMessages;