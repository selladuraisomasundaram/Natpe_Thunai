"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TOURNAMENTS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query, ID } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; // NEW: Import useAuth

export interface TeamStanding {
  rank: number;
  teamName: string;
  status: "1st" | "2nd" | "Eliminated" | "Participating";
  points: number;
}

export interface Winner {
  tournament: string;
  winner: string;
  prize: string;
}

export interface Tournament extends Models.Document {
  name: string;
  game: string;
  date: string;
  fee: number;
  prizePool: string;
  status: "Open" | "Closed";
  standings: TeamStanding[];
  winners: Winner[];
  posterId: string;
  posterName: string; // NEW: Add posterName
  collegeName: string; // NEW: Add collegeName
  minPlayers: number; // NEW: Add minPlayers
  maxPlayers: number; // NEW: Add maxPlayers
}

interface TournamentDataState {
  tournaments: Tournament[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updateTournament: (tournamentId: string, updates: Partial<Tournament>) => Promise<void>;
  createTournament: (data: Omit<Tournament, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "$sequence">) => Promise<void>; // NEW: Add createTournament
}

// Mock initial data structure for Appwrite if the collection is empty
const MOCK_INITIAL_TOURNAMENT: Tournament[] = [
  { 
    $id: 'mock-t1', 
    $collectionId: APPWRITE_TOURNAMENTS_COLLECTION_ID,
    $databaseId: APPWRITE_DATABASE_ID,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    $permissions: [],
    $sequence: 0,
    name: "Campus Clash Season 1", 
    game: "Free Fire", 
    date: "2024-11-15", 
    fee: 50, 
    prizePool: "₹5000", 
    status: "Open",
    standings: [
      { rank: 1, teamName: "Team Alpha", status: "1st", points: 1500 },
      { rank: 2, teamName: "Team Beta", status: "2nd", points: 1200 },
    ],
    winners: [],
    posterId: 'mock-user-id', // Placeholder
    posterName: 'Mock Host', // Placeholder
    collegeName: 'Indian Institute of Technology Madras', // Placeholder
    minPlayers: 2,
    maxPlayers: 4,
  },
];


export const useTournamentData = (): TournamentDataState => {
  const { userProfile } = useAuth(); // NEW: Use useAuth hook to get current user's college
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    if (!userProfile?.collegeName) { // NEW: Only fetch if collegeName is available
      setIsLoading(false);
      setTournaments([]); // Clear tournaments if no college is set
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        [
          Query.orderDesc('date'), // Order by date descending
          Query.equal('collegeName', userProfile.collegeName) // NEW: Filter by collegeName
        ]
      );
      
      let fetchedTournaments = response.documents as unknown as Tournament[];

      // If no data is fetched, use mock data to populate the UI initially (for demonstration)
      if (fetchedTournaments.length === 0) {
        // NOTE: In a real app, you would typically handle this by showing an empty state,
        // but since the original page relied on mock data, we provide a mock structure
        // to ensure the UI renders correctly until a developer adds real data.
        fetchedTournaments = MOCK_INITIAL_TOURNAMENT;
      }

      setTournaments(fetchedTournaments);
    } catch (err: any) {
      console.error("Error fetching tournament data:", err);
      setError(err.message || "Failed to load tournament data.");
      toast.error("Failed to load tournament data.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]); // NEW: Depend on userProfile.collegeName

  const updateTournament = useCallback(async (tournamentId: string, updates: Partial<Tournament>) => {
    try {
      // Ensure complex objects like standings and winners are serialized if they are being updated
      const payload: any = { ...updates };
      if (payload.standings) {
        payload.standings = JSON.stringify(payload.standings);
      }
      if (payload.winners) {
        payload.winners = JSON.stringify(payload.winners);
      }

      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        tournamentId,
        payload
      );
      toast.success("Tournament updated successfully!");
      fetchTournaments(); // Refetch to update local state
    } catch (err: any) {
      console.error("Error updating tournament:", err);
      toast.error(err.message || "Failed to update tournament.");
      throw err;
    }
  }, [fetchTournaments]);

  const createTournament = useCallback(async (data: Omit<Tournament, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "$sequence">) => {
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        ID.unique(),
        {
          ...data,
          standings: JSON.stringify(data.standings || []), // Ensure standings are stringified
          winners: JSON.stringify(data.winners || []), // Ensure winners are stringified
        }
      );
      toast.success(`Tournament "${data.name}" created successfully!`);
      fetchTournaments(); // Refetch to update local state
    } catch (err: any) {
      console.error("Error creating tournament:", err);
      toast.error(err.message || "Failed to create tournament.");
      throw err;
    }
  }, [fetchTournaments]);

  useEffect(() => {
    fetchTournaments();

    if (!userProfile?.collegeName) return; // NEW: Only subscribe if collegeName is available

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TOURNAMENTS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as Tournament;

        // NEW: Filter real-time updates by collegeName
        if (payload.collegeName !== userProfile.collegeName) {
            return;
        }

        setTournaments(prev => {
          const existingIndex = prev.findIndex(t => t.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New tournament announced: ${payload.name}`);
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Tournament updated: ${payload.name}`);
              return prev.map(t => t.$id === payload.$id ? payload : t);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`Tournament removed: ${payload.name}`);
              return prev.filter(t => t.$id !== payload.$id);
            }
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchTournaments, userProfile?.collegeName]); // NEW: Depend on userProfile.collegeName

  return { tournaments, isLoading, error, refetch: fetchTournaments, updateTournament, createTournament };
};