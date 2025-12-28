"use client";

import { useState, useEffect } from 'react';
import { Databases, Query, Models, ID } from 'appwrite';
import { client } from '@/lib/appwrite'; // Assuming client is exported from here
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AppwriteDocument } from '@/types/appwrite'; // Import AppwriteDocument

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const MARKET_LISTINGS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MARKET_LISTINGS_COLLECTION_ID;

export interface Product extends AppwriteDocument {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  imageUrl?: string;
  sellerId: string;
  sellerName: string;
  collegeName: string;
  contactInfo: string;
  type: 'sell' | 'rent' | 'gift' | 'sports';
  status: 'available' | 'sold' | 'rented';
}

const useMarketListings = () => {
  const { user, userPreferences } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (userPreferences?.collegeName && userPreferences.collegeName !== 'N/A') {
        queries.push(Query.equal('collegeName', userPreferences.collegeName));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        MARKET_LISTINGS_COLLECTION_ID,
        queries
      );
      setProducts(response.documents as Product[]); // Type assertion is now safer
    } catch (err: any) {
      setError('Failed to fetch market listings.');
      console.error('Error fetching market listings:', err);
      toast.error('Failed to load market listings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [userPreferences?.collegeName]);

  const postProduct = async (productData: Omit<Product, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId' | '$sequence' | 'sellerId' | 'sellerName' | 'collegeName' | 'status'>) => {
    if (!user || !userPreferences) {
      toast.error("You must be logged in to post a product.");
      return;
    }

    try {
      const newProduct = await databases.createDocument(
        DATABASE_ID,
        MARKET_LISTINGS_COLLECTION_ID,
        ID.unique(),
        {
          ...productData,
          sellerId: user.$id,
          sellerName: user.name,
          collegeName: userPreferences.collegeName,
          status: 'available',
        },
        [
          Models.Permission.read(Models.Role.any()),
          Models.Permission.write(Models.Role.user(user.$id)),
        ]
      );
      setProducts(prev => [newProduct as Product, ...prev]); // Type assertion is now safer
      toast.success("Product posted successfully!");
    } catch (err: any) {
      toast.error("Failed to post product: " + err.message);
      console.error("Error posting product:", err);
    }
  };

  const updateProductStatus = async (productId: string, newStatus: Product['status']) => {
    if (!user) {
      toast.error("You must be logged in to update product status.");
      return;
    }
    try {
      await databases.updateDocument(
        DATABASE_ID,
        MARKET_LISTINGS_COLLECTION_ID,
        productId,
        { status: newStatus },
        [Models.Permission.write(Models.Role.user(user.$id))]
      );
      setProducts(prev =>
        prev.map(product =>
          product.$id === productId ? { ...product, status: newStatus } : product
        )
      );
      toast.success("Product status updated.");
    } catch (err: any) {
      toast.error("Failed to update product status: " + err.message);
      console.error("Error updating product status:", err);
    }
  };

  return { products, isLoading, error, refetch: fetchProducts, postProduct, updateProductStatus };
};

export default useMarketListings;