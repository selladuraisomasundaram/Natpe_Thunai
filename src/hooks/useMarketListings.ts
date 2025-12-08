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
  const { userProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    const isDeveloper = userProfile?.role === 'developer';

    if (!isDeveloper && !userProfile?.collegeName) {
      setIsLoading(false);
      setProducts([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.equal('status', 'available'),
      ];
      if (!isDeveloper) {
        queries.push(Query.equal('collegeName', userProfile!.collegeName));
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
              [Query.equal('userId', product.sellerId), Query.limit(1)] // Consistently use sellerId
            );
            const sellerProfile = sellerProfileResponse.documents[0] as any;
            return {
              ...product,
              sellerLevel: sellerProfile?.level ?? 1,
            };
          } catch (sellerError) {
            console.warn(`Could not fetch profile for seller ${product.sellerId}:`, sellerError); // Consistently use sellerId
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
  }, [userProfile?.collegeName, userProfile?.role]);

  useEffect(() => {
    fetchProducts();

    const isDeveloper = userProfile?.role === 'developer';
    if (!isDeveloper && !userProfile?.collegeName) return;

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_PRODUCTS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as Product;

        if (!isDeveloper && payload.collegeName !== userProfile!.collegeName) {
            return;
        }

        setProducts(prev => {
          const existingIndex = prev.findIndex(p => p.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New listing posted: ${payload.title}`);
              fetchProducts();
              return prev;
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Listing updated: ${payload.title}`);
              fetchProducts();
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
          const isSellerOfExistingProduct = products.some(p => p.sellerId === payload.userId); // Consistently use sellerId
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
  }, [fetchProducts, userProfile?.collegeName, userProfile?.role, products]);

  return { products, isLoading, error, refetch: fetchProducts };
};