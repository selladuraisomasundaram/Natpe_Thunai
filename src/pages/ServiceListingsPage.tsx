"use client";

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, UserCircle, DollarSign, Briefcase, Lightbulb, Utensils } from 'lucide-react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from '@/lib/appwrite';
import { Query, Models } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface ServiceListing extends Models.Document {
  title: string;
  description: string;
  category: string;
  price: number;
  contact: string;
  posterId: string;
  posterName: string;
  collegeName: string;
  serviceType: "freelance" | "short-term" | "errands" | "food-wellness";
  status: "active" | "completed" | "cancelled";
}

const ServiceListingsPage = () => {
  const { serviceType } = useParams<{ serviceType: string }>();
  const { userProfile } = useAuth();
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const pageTitle = serviceType ? serviceType.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'All Services';

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      setError(null);

      if (!APPWRITE_SERVICES_COLLECTION_ID) {
        setError("Appwrite Services Collection ID is not configured. Please check your environment variables.");
        setIsLoading(false);
        return;
      }

      try {
        let queries = [Query.orderDesc("$createdAt")];
        if (userProfile?.collegeName) {
          queries.push(Query.equal("collegeName", userProfile.collegeName));
        }
        if (serviceType) {
          queries.push(Query.equal("serviceType", serviceType));
        }

        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_SERVICES_COLLECTION_ID,
          queries
        );
        setListings(response.documents as unknown as ServiceListing[]);
      } catch (err: any) {
        console.error("Error fetching service listings:", err);
        setError(err.message || "Failed to fetch service listings.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();

    // Real-time subscription
    let unsubscribe: () => void;
    if (APPWRITE_SERVICES_COLLECTION_ID) {
      unsubscribe = databases.client.subscribe(
        `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_SERVICES_COLLECTION_ID}.documents`,
        (response) => {
          const payload = response.payload as unknown as ServiceListing;
          if (payload.collegeName !== userProfile?.collegeName || (serviceType && payload.serviceType !== serviceType)) {
            return; // Ignore if not for current college or service type
          }

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            setListings((prev) => [payload, ...prev]);
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            setListings((prev) =>
              prev.map((l) => (l.$id === payload.$id ? payload : l))
            );
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            setListings((prev) => prev.filter((l) => l.$id !== payload.$id));
          }
        }
      );
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [serviceType, userProfile?.collegeName]);

  const filteredListings = listings.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getIconForServiceType = (type: string) => {
    switch (type) {
      case 'freelance': return <Briefcase className="h-4 w-4 mr-2 text-primary" />;
      case 'short-term': return <Lightbulb className="h-4 w-4 mr-2 text-primary" />;
      case 'errands': return <MapPin className="h-4 w-4 mr-2 text-primary" />;
      case 'food-wellness': return <Utensils className="h-4 w-4 mr-2 text-primary" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">{pageTitle} Listings</h1>

      <div className="max-w-md mx-auto space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Search ${pageTitle.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border text-foreground w-full"
          />
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-4">Loading listings...</p>
        ) : error ? (
          <p className="text-center text-destructive py-4">Error loading listings: {error}</p>
        ) : filteredListings.length > 0 ? (
          <div className="space-y-3">
            {filteredListings.map((item) => (
              <Card key={item.$id} className="bg-card border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    {getIconForServiceType(item.serviceType)} {item.serviceType.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4 mr-2 text-green-500" /> Price: ₹{item.price.toFixed(2)}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <UserCircle className="h-4 w-4 mr-2 text-primary" /> Posted by {item.posterName}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2 text-primary" /> {item.collegeName}
                  </div>
                  {/* Add more details or actions here if needed */}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">No {pageTitle.toLowerCase()} listings found.</p>
        )}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ServiceListingsPage;