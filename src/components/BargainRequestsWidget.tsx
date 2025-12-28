"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useBargainRequests } from '@/hooks/useBargainRequests';
import { Loader2, DollarSign, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility exists
import toast from 'react-hot-toast'; // Ensure toast is imported

const BargainRequestsWidget = () => {
  const { user } = useAuth();
  const { sellerRequests, isLoading, error, refetch, acceptBargainRequest, rejectBargainRequest } = useBargainRequests(); // Use specific functions
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAccept = async (requestId: string) => {
    setIsUpdating(true);
    try {
      await acceptBargainRequest(requestId);
      toast.success("Bargain request accepted!");
    } catch (err) {
      toast.error("Failed to accept bargain request.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (requestId: string) => {
    setIsUpdating(true);
    try {
      await rejectBargainRequest(requestId);
      toast.success("Bargain request rejected!");
    } catch (err) {
      toast.error("Failed to reject bargain request.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Bargain Requests</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary-neon" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Bargain Requests</CardTitle>
        </CardHeader>
        <CardContent className="text-destructive-foreground bg-destructive/10 p-4 rounded-lg">
          <p>Error loading requests: {error}</p>
          <Button onClick={refetch} className="mt-2">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Bargain Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {sellerRequests.length === 0 ? (
          <p className="text-muted-foreground text-center">No incoming bargain requests.</p>
        ) : (
          <ul className="space-y-4">
            {sellerRequests.map((request) => (
              <li key={request.$id} className="p-4 border rounded-md bg-muted/20">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-foreground">{request.productTitle}</h4>
                  <span className={cn(
                    "px-2 py-1 text-xs font-semibold rounded-full",
                    request.status === "initiated" && "bg-yellow-500 text-white", // Changed from "pending"
                    request.status === "accepted" && "bg-green-500 text-white",
                    request.status === "rejected" && "bg-destructive text-destructive-foreground", // Changed from "denied"
                    request.status === "cancelled" && "bg-gray-500 text-white"
                  )}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">From: {request.buyerName}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4" /> Requested Price: <span className="font-bold text-secondary-neon">₹{request.requestedPrice.toFixed(2)}</span>
                </p>
                {/* Removed originalPrice as it's not in BargainRequest interface */}
                <p className="text-xs text-muted-foreground">Posted: {new Date(request.createdAt).toLocaleDateString()}</p> {/* Used createdAt */}

                {request.status === "initiated" && ( // Changed from "pending"
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(request.$id)}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(request.$id)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                      Reject
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default BargainRequestsWidget;