"use client";

import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, ID, Models } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; // Ensure toast is imported

export interface Tournament extends Models.Document { // Extend Models.Document
  title: string;
  game: string;
  platform: string;
  date: string; // ISO string
  time: string; // HH:mm
  prizePool: string;
  entryFee: string;
  maxParticipants: number;
  currentParticipants: number;
  posterId: string;
  posterName: string;
  collegeName: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  participants: string[]; // Array of user IDs
  // createdAt: string; // Already in Models.Document
  // updatedAt: string; // Already in Models.Document
}

interface UseTournamentDataState {
  tournaments: Tournament[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  postTournament: (data: Omit<Tournament, '$id' | 'posterId' | 'posterName' | 'collegeName' | 'status' | 'participants' | 'createdAt' | 'updatedAt' | 'currentParticipants'>) => Promise<void>;
  joinTournament: (tournamentId: string) => Promise<void>;
  leaveTournament: (tournamentId: string) => Promise<void>;
  updateTournament: (tournamentId: string, data: Partial<Tournament>) => Promise<void>;
  deleteTournament: (tournamentId: string) => Promise<void>;
}

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default_database_id';
const TOURNAMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TOURNAMENTS_COLLECTION_ID || 'tournaments';

export const useTournamentData = (): UseTournamentDataState => { // Added return type
  const { user, userPreferences, loading: isAuthLoading } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const collegeName = userPreferences?.collegeName;

  const fetchTournaments = useCallback(async () => {
    if (isAuthLoading) return; // Wait for auth to load

    setIsLoading(true);
    setError(null);
    try {
      let queries = [
        Query.orderAsc('date'),
        Query.orderAsc('time'),
      ];

      if (collegeName) {
        queries.push(Query.equal('collegeName', collegeName));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        queries
      );
      setTournaments(response.documents as Tournament[]); // Corrected type assertion
    } catch (err: any) {
      console.error("Failed to fetch tournaments:", err);
      setError(err.message || "Failed to fetch tournaments.");
      toast.error(err.message || "Failed to fetch tournaments.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeName, isAuthLoading]);

  useEffect(() => {
    fetchTournaments();

    const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.${TOURNAMENTS_COLLECTION_ID}.documents`, response => {
      const payload = response.payload as Tournament;
      if (!collegeName || payload.collegeName === collegeName) {
        fetchTournaments(); // Simple refetch for any change
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchTournaments, collegeName]);

  const postTournament = async (data: Omit<Tournament, '$id' | 'posterId' | 'posterName' | 'collegeName' | 'status' | 'participants' | 'createdAt' | 'updatedAt' | 'currentParticipants'>) => {
    if (!user?.$id || !userPreferences?.name || !collegeName) {
      toast.error("Please log in and set your college name to post a tournament.");
      return;
    }
    try {
      await databases.createDocument(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        ID.unique(),
        {
          ...data,
          posterId: user.$id,
          posterName: userPreferences.name,
          collegeName: collegeName,
          status: 'upcoming',
          participants: [],
          currentParticipants: 0,
        }
      );
      toast.success("Tournament posted successfully!");
      fetchTournaments();
    } catch (err: any) {
      console.error("Failed to post tournament:", err);
      toast.error(err.message || "Failed to post tournament.");
      throw err;
    }
  };

  const joinTournament = async (tournamentId: string) => {
    if (!user?.$id) {
      toast.error("Please log in to join a tournament.");
      return;
    }
    try {
      const tournament = tournaments.find(t => t.$id === tournamentId);
      if (!tournament) {
        toast.error("Tournament not found.");
        return;
      }
      if (tournament.participants.includes(user.$id)) {
        toast.info("You have already joined this tournament.");
        return;
      }
      if (tournament.currentParticipants >= tournament.maxParticipants) {
        toast.error("Tournament is full.");
        return;
      }

      const updatedParticipants = [...tournament.participants, user.$id];
      await databases.updateDocument(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        tournamentId,
        {
          participants: updatedParticipants,
          currentParticipants: updatedParticipants.length,
        }
      );
      toast.success("Joined tournament successfully!");
      fetchTournaments();
    } catch (err: any) {
      console.error("Failed to join tournament:", err);
      toast.error(err.message || "Failed to join tournament.");
      throw err;
    }
  };

  const leaveTournament = async (tournamentId: string) => {
    if (!user?.$id) {
      toast.error("Please log in to leave a tournament.");
      return;
    }
    try {
      const tournament = tournaments.find(t => t.$id === tournamentId);
      if (!tournament) {
        toast.error("Tournament not found.");
        return;
      }
      if (!tournament.participants.includes(user.$id)) {
        toast.info("You are not a participant in this tournament.");
        return;
      }

      const updatedParticipants = tournament.participants.filter(id => id !== user.$id);
      await databases.updateDocument(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        tournamentId,
        {
          participants: updatedParticipants,
          currentParticipants: updatedParticipants.length,
        }
      );
      toast.success("Left tournament successfully!");
      fetchTournaments();
    } catch (err: any) {
      console.error("Failed to leave tournament:", err);
      toast.error(err.message || "Failed to leave tournament.");
      throw err;
    }
  };

  const updateTournament = async (tournamentId: string, data: Partial<Tournament>) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        tournamentId,
        data
      );
      toast.success("Tournament updated successfully!");
      fetchTournaments();
    } catch (err: any) {
      console.error("Failed to update tournament:", err);
      toast.error(err.message || "Failed to update tournament.");
      throw err;
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        tournamentId
      );
      toast.success("Tournament deleted successfully!");
      fetchTournaments();
    } catch (err: any) {
      console.error("Failed to delete tournament:", err);
      toast.error(err.message || "Failed to delete tournament.");
      throw err;
    }
  };

  return {
    tournaments,
    isLoading,
    error,
    refetch: fetchTournaments,
    postTournament,
    joinTournament,
    leaveTournament,
    updateTournament,
    deleteTournament,
  };
};