"use client";

import { useState, useEffect } from 'react';
import { Databases, Query, Models, ID } from 'appwrite';
import { client } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AppwriteDocument } from '@/types/appwrite';

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const REPORTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID;

export type ReportType = 'marketplace' | 'service' | 'errand' | 'tournament' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

export interface Report extends AppwriteDocument {
  reporterId: string;
  reporterName: string;
  collegeName: string;
  listingId: string; // ID of the item/service/errand being reported
  listingType: ReportType;
  reason: string;
  description?: string;
  status: ReportStatus;
}

const useReports = () => {
  const { user, userPreferences } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (userPreferences?.collegeName && userPreferences.collegeName !== 'N/A') {
        queries.push(Query.equal('collegeName', userPreferences.collegeName));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        REPORTS_COLLECTION_ID,
        queries
      );
      setReports(response.documents as Report[]); // Type assertion is now safer
    } catch (err: any) {
      setError('Failed to fetch reports.');
      console.error('Error fetching reports:', err);
      toast.error('Failed to load reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [userPreferences?.collegeName]);

  const submitReport = async (reportData: Omit<Report, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId' | '$sequence' | 'reporterId' | 'reporterName' | 'collegeName' | 'status'>) => {
    if (!user || !userPreferences) {
      toast.error("You must be logged in to submit a report.");
      return;
    }

    try {
      const newReport = await databases.createDocument(
        DATABASE_ID,
        REPORTS_COLLECTION_ID,
        ID.unique(),
        {
          ...reportData,
          reporterId: user.$id,
          reporterName: user.name,
          collegeName: userPreferences.collegeName,
          status: 'pending',
        },
        [
          Models.Permission.read(Models.Role.user(user.$id)),
          Models.Permission.write(Models.Role.user(user.$id)),
          // Potentially add read/write for admin/moderator roles
        ]
      );
      setReports(prev => [newReport as Report, ...prev]); // Type assertion is now safer
      toast.success("Report submitted successfully!");
    } catch (err: any) {
      toast.error("Failed to submit report: " + err.message);
      console.error("Error submitting report:", err);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: ReportStatus) => {
    if (!user) {
      toast.error("You must be logged in to update report status.");
      return;
    }
    try {
      await databases.updateDocument(
        DATABASE_ID,
        REPORTS_COLLECTION_ID,
        reportId,
        { status: newStatus },
        [Models.Permission.write(Models.Role.user(user.$id))] // Only reporter or admin can update
      );
      setReports(prev =>
        prev.map(report =>
          report.$id === reportId ? { ...report, status: newStatus } : report
        )
      );
      toast.success("Report status updated.");
    } catch (err: any) {
      toast.error("Failed to update report status: " + err.message);
      console.error("Error updating report status:", err);
    }
  };

  return { reports, isLoading, error, refetch: fetchReports, submitReport, updateReportStatus };
};

export default useReports;