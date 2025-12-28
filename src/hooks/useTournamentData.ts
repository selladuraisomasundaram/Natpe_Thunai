"use client";

import { useState, useEffect } from 'react';
import { Databases, Query, Models, ID } from 'appwrite';
import { client } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AppwriteDocument } from '@/types/appwrite';

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TOURNAMENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID;
const TOURNAMENT_REGISTRATIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TOURNAMENT_REGISTRATIONS_COLLECTION_ID;

export type TournamentStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface TeamStanding {
  teamName: string;
  score: number;
  rank: number;
}

export interface Winner {
  teamName: string;
  prize: string;
}

export interface Tournament extends AppwriteDocument {
  name: string;
  game: string;
  description: string;
  date: string; // ISO date string
  time: string; // e.g., "14:00"
  location: string;
  maxPlayers: number; // Max players per team or total players
  entryFee: number;
  prizePool: string;
  organizerId: string;
  organizerName: string;
  collegeName: string;
  status: TournamentStatus;
  registeredTeams: { teamName: string; players: string[]; contactEmail: string }[];
  teamStandings?: TeamStanding[];
  winners?: Winner[];
}

export interface TournamentRegistration extends AppwriteDocument {
  tournamentId: string;
  teamName: string;
  players: string[]; // Array of player names/IDs
  contactEmail: string;
  registeredById: string;
  registeredByName: string;
  collegeName: string;
}

const useTournamentData = () => {
  const { user, userPreferences } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.orderDesc('date'), Query.orderDesc('$createdAt')];
      if (userPreferences?.collegeName && userPreferences.collegeName !== 'N/A') {
        queries.push(Query.equal('collegeName', userPreferences.collegeName));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        queries
      );
      setTournaments(response.documents as Tournament[]);
    } catch (err: any) {
      setError('Failed to fetch tournaments.');
      console.error('Error fetching tournaments:', err);
      toast.error('Failed to load tournaments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [userPreferences?.collegeName]);

  const createTournament = async (tournamentData: Omit<Tournament, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId' | '$sequence' | 'organizerId' | 'organizerName' | 'collegeName' | 'status' | 'registeredTeams' | 'teamStandings' | 'winners'>) => {
    if (!user || !userPreferences) {
      toast.error("You must be logged in to create a tournament.");
      return;
    }

    try {
      const newTournament = await databases.createDocument(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        ID.unique(),
        {
          ...tournamentData,
          organizerId: user.$id,
          organizerName: user.name,
          collegeName: userPreferences.collegeName,
          status: 'upcoming',
          registeredTeams: [],
        },
        [
          Models.Permission.read(Models.Role.any()),
          Models.Permission.write(Models.Role.user(user.$id)),
        ]
      );
      setTournaments(prev => [newTournament as Tournament, ...prev]);
      toast.success("Tournament created successfully!");
    } catch (err: any) {
      toast.error("Failed to create tournament: " + err.message);
      console.error("Error creating tournament:", err);
    }
  };

  const registerForTournament = async (
    tournamentId: string,
    teamName: string,
    players: string[],
    contactEmail: string
  ) => {
    if (!user || !userPreferences) {
      toast.error("You must be logged in to register for a tournament.");
      return;
    }

    try {
      // Check if team already registered for this tournament
      const existingRegistration = await databases.listDocuments(
        DATABASE_ID,
        TOURNAMENT_REGISTRATIONS_COLLECTION_ID,
        [
          Query.equal('tournamentId', tournamentId),
          Query.equal('teamName', teamName),
          Query.equal('registeredById', user.$id),
        ]
      );

      if (existingRegistration.documents.length > 0) {
        toast.info("Your team is already registered for this tournament.");
        return;
      }

      const newRegistration = await databases.createDocument(
        DATABASE_ID,
        TOURNAMENT_REGISTRATIONS_COLLECTION_ID,
        ID.unique(),
        {
          tournamentId,
          teamName,
          players,
          contactEmail,
          registeredById: user.$id,
          registeredByName: user.name,
          collegeName: userPreferences.collegeName,
        },
        [
          Models.Permission.read(Models.Role.any()),
          Models.Permission.write(Models.Role.user(user.$id)),
        ]
      );

      // Update the tournament's registeredTeams array
      setTournaments(prev =>
        prev.map(tournament =>
          tournament.$id === tournamentId
            ? {
                ...tournament,
                registeredTeams: [
                  ...(tournament.registeredTeams || []),
                  { teamName, players, contactEmail },
                ],
              }
            : tournament
        )
      );

      toast.success("Successfully registered for the tournament!");
    } catch (err: any) {
      toast.error("Failed to register for tournament: " + err.message);
      console.error("Error registering for tournament:", err);
    }
  };

  const updateTournament = async (tournamentId: string, updatedData: Partial<Tournament>) => {
    if (!user) {
      toast.error("You must be logged in to update a tournament.");
      return;
    }
    try {
      await databases.updateDocument(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        tournamentId,
        updatedData,
        [Models.Permission.write(Models.Role.user(user.$id))]
      );
      setTournaments(prev =>
        prev.map(tournament =>
          tournament.$id === tournamentId ? { ...tournament, ...updatedData } : tournament
        )
      );
      toast.success("Tournament updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update tournament: " + err.message);
      console.error("Error updating tournament:", err);
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete a tournament.");
      return;
    }
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        tournamentId,
      );
      setTournaments(prev => prev.filter(tournament => tournament.$id !== tournamentId));
      // Optionally, delete associated registrations
      toast.success("Tournament deleted successfully!");
    } catch (err: any) {
      toast.error("Failed to delete tournament: " + err.message);
      console.error("Error deleting tournament:", err);
    }
  };

  return {
    tournaments,
    isLoading,
    error,
    refetch: fetchTournaments,
    createTournament,
    registerForTournament,
    updateTournament,
    deleteTournament,
  };
};

export default useTournamentData;