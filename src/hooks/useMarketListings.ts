"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';
import { Product } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';

interface MarketListingsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMarketListings = (): MarketListingsState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    // If AuthContext is still loading, or if userProfile isn't ready,
    // we can't determine the college filter or developer role.
    // In this state, the AnalyticsCard should be showing the global auth loading.
    // So, this specific hook should not be "loading" its own data yet.
    if (isAuthLoading || userProfile === null) {
      setIsLoading(true); // Keep loading true while auth is resolving
      return;
    }

    const isDeveloper = userProfile?.role === 'developer';
    const collegeToFilterBy = userProfile?.collegeName;

    // If not a developer AND no college is set in profile, then there's nothing to fetch for this user.
    // Set loading to false and potentially an error.
    if (!isDeveloper && !collegeToFilterBy) {
      setIsLoading(false);
      setProducts([]);
      setError("User profile is missing college information. Please update your profile.");
      return;
    }

    setIsLoading(true); // Start loading for data fetch
    setError(null);
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.equal('status', 'available'),
      ];
      if (!isDeveloper) {
        queries.push(Query.equal('collegeName', collegeToFilterBy!));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID,
        queries
      );
      
      const productsWithSellerInfo = await Promise.all(
        (response.documents as unknown as Product[]).map(async (product) => {
          try {
            const sellerProfileResponse = await databases.listDocuments(
              APPWRITE_DATABASE_ID,
              APPWRITE_USER_PROFILES_COLLECTION_ID,
              [Query.equal('userId', product.sellerId), Query.limit(1)]
            );
            const sellerProfile = sellerProfileResponse.documents[0] as any;
            return {
              ...product,
              sellerLevel: sellerProfile?.level ?? 1,
            };
          } catch (sellerError) {
            console.warn(`Could not fetch profile for seller ${product.sellerId}:`, sellerError);
            return { ...product, sellerLevel: 1 };
          }
        })
      );

      setProducts(productsWithSellerInfo);
    } catch (err: any) {
      console.error("Error fetching market listings:", err);
      setError(err.message || "Failed to load market listings.");
      toast.error("Failed to load market listings.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLoading, userProfile]);

  useEffect(() => {
    // Only call fetchProducts when isAuthLoading is false and userProfile is resolved
    if (!isAuthLoading && userProfile !== null) {
      fetchProducts();
    }
    // If auth is loading, or userProfile is null, ensure this hook's loading state is true
    if (isAuthLoading || userProfile === null) {
        setIsLoading(true);
    }


    // Subscription logic
    // Only set up subscriptions if auth is not loading and userProfile is available
    if (isAuthLoading || !userProfile) return;

    const isDeveloper = userProfile.role === 'developer';
    const collegeToFilterBy = userProfile.collegeName;

    // If not a developer and no college is set, no need for subscription either
    if (!isDeveloper && !collegeToFilterBy) return;

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_PRODUCTS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as Product;

        if (!isDeveloper && payload.collegeName !== collegeToFilterBy) {
            return;
        }

        setProducts(prev => {
          const existingIndex = prev.findIndex(p => p.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New listing posted: ${payload.title}`);
              fetchProducts(); // Refetch to get sellerLevel and proper sorting
              return prev;
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Listing updated: ${payload.title}`);
              fetchProducts(); // Refetch to get sellerLevel and proper sorting
              return prev;
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`Listing removed: ${payload.title}`);
              return prev.filter(p => p.$id !== payload.$id);
            }
          }
          return prev;
        });
      }
    );

    const unsubscribeUserProfiles = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_USER_PROFILES_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as any;
        if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          const isSellerOfExistingProduct = products.some(p => p.sellerId === payload.userId);
          if (isSellerOfExistingProduct) {
            fetchProducts();
          }
        }
      }
    );

    return () => {
      unsubscribe();
      unsubscribeUserProfiles();
    };
  }, [fetchProducts, isAuthLoading, userProfile, products]);

  return { products, isLoading, error, refetch: fetchProducts };
};