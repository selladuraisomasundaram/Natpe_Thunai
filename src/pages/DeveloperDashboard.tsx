"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { MadeWithDyad } from "@/components/made-with-dyad";

const DeveloperDashboard = () => {
  const { reports, isLoading, error } = useReports();

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Developer Dashboard</h1>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Reports Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading reports...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading reports: {error}</p>
            ) : reports.length > 0 ? (
              reports.map((report) => (
                <div key={report.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">Report ID: {report.$id}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Reason: {report.reason}</p>
                  <p className="text-xs text-muted-foreground">Item Type: {report.reportedItemType}</p>
                  <p className="text-xs text-muted-foreground">Item ID: {report.reportedItemId}</p>
                  <p className="text-xs text-muted-foreground">Status: <span className="font-medium text-foreground">{report.status}</span></p>
                  <p className="text-xs text-muted-foreground">Reported by: {report.reporterId} on {new Date(report.$createdAt).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No reports found.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default DeveloperDashboard;