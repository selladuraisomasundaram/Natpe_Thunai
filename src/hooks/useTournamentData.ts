"use client";

import { useState, useEffect, useCallback } from "react";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TOURNAMENTS_COLLECTION_ID } from "@/lib/appwrite";
import { Models, Query } from "appwrite";

export interface Tournament extends Models.Document {
  title: string;
  description: string;
  game: string;
  date: string; // ISO string
  time: string;
  maxParticipants: number;
  entryFee?: number;
  contact: string;
  organizerId: string;
  organizerName: string;
  collegeName: string;
  participants: string[]; // Array of user IDs
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
}

export const useTournamentData = (collegeName?: string) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    if (!collegeName) {
      setIsLoading(false);
      setError("College name is required to fetch tournaments.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        [
          Query.equal('collegeName', collegeName),
          Query.orderAsc('date'),
        ]
      );
      setTournaments(response.documents as unknown as Tournament[]);
    } catch (e: any) {
      console.error("Error fetching tournaments:", e);
      setError(e.message || "Failed to load tournaments.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeName]);

  const registerForTournament = async (tournamentId: string, userId: string) => {
    try {
      const tournament = tournaments.find(t => t.$id === tournamentId);
      if (!tournament) throw new Error("Tournament not found.");
      if (tournament.participants.includes(userId)) throw new Error("Already registered.");
      if (tournament.participants.length >= tournament.maxParticipants) throw new Error("Tournament is full.");

      const updatedParticipants = [...tournament.participants, userId];

      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        tournamentId,
        { participants: updatedParticipants }
      );
      fetchTournaments(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error("Error registering for tournament:", e);
      setError(e.message || "Failed to register for tournament.");
      return false;
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  return {
    tournaments,
    isLoading,
    error,
    refetch: fetchTournaments,
    registerForTournament,
  };
};