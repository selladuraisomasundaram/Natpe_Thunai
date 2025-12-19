"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_BLOCKED_WORDS_COLLECTION_ID } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';

export interface BlockedWord {
  $id: string;
  $createdAt: string;
  word: string;
  reason?: string;
  addedBy?: string; // User ID of who added it
  isActive: boolean;
}

export const useBlockedWords = () => {
  const [blockedWords, setBlockedWords] = useState<BlockedWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlockedWords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_BLOCKED_WORDS_COLLECTION_ID,
        [Query.orderAsc('word')]
      );
      setBlockedWords(response.documents as unknown as BlockedWord[]);
    } catch (e: any) {
      console.error("Error fetching blocked words:", e);
      setError(e.message || "Failed to load blocked words.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addBlockedWord = async (word: string, reason?: string, addedBy?: string) => {
    try {
      const newBlockedWord: Omit<BlockedWord, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'> = {
        word,
        reason,
        addedBy,
        isActive: true,
      };
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_BLOCKED_WORDS_COLLECTION_ID,
        ID.unique(),
        newBlockedWord
      );
      fetchBlockedWords(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error("Error adding blocked word:", e);
      setError(e.message || "Failed to add blocked word.");
      return false;
    }
  };

  const removeBlockedWord = async (wordId: string) => {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_BLOCKED_WORDS_COLLECTION_ID,
        wordId
      );
      fetchBlockedWords(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error("Error removing blocked word:", e);
      setError(e.message || "Failed to remove blocked word.");
      return false;
    }
  };

  useEffect(() => {
    fetchBlockedWords();
  }, [fetchBlockedWords]);

  return {
    blockedWords,
    isLoading,
    error,
    refetch: fetchBlockedWords,
    addBlockedWord,
    removeBlockedWord,
  };
};