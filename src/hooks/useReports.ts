"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_REPORTS_COLLECTION_ID } from '@/lib/appwrite';
import { Query, Models } from 'appwrite';

export interface Report extends Models.Document {
  reporterId: string;
  reportedItemId: string;
  reportedItemType: string; // e.g., 'food-offering', 'errand', 'exchange-listing'
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'; // Added 'dismissed'
  productTitle?: string; // Added for DeveloperDashboardPage
  reporterName?: string; // Added for DeveloperDashboardPage
  sellerId?: string; // Added for DeveloperDashboardPage
  collegeName?: string; // Added for DeveloperDashboardPage
  message?: string; // Added for DeveloperDashboardPage (detailed reason/message)
}

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_REPORTS_COLLECTION_ID,
        [Query.orderDesc('$createdAt')]
      );
      setReports(response.documents as unknown as Report[]);
    } catch (e: any) {
      console.error("Error fetching reports:", e);
      setError(e.message || "Failed to load reports.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateReportStatus = async (reportId: string, status: Report['status']) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_REPORTS_COLLECTION_ID,
        reportId,
        { status }
      );
      fetchReports(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error("Error updating report status:", e);
      setError(e.message || "Failed to update report status.");
      return false;
    }
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, isLoading, error, refetch: fetchReports, updateReportStatus };
};