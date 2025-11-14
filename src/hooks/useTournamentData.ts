"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TOURNAMENTS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';

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
}

interface TournamentDataState {
  tournaments: Tournament[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
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
  },
];


export const useTournamentData = (): TournamentDataState => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        [Query.orderDesc('date')] // Order by date descending
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
  }, []);

  useEffect(() => {
    fetchTournaments();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TOURNAMENTS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as Tournament;

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
  }, [fetchTournaments]);

  return { tournaments, isLoading, error, refetch: fetchTournaments };
};