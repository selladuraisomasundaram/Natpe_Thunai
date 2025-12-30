"use client";

import React, { useState, useEffect } from 'react';
import { Client, Databases, Functions, Query, ID } from 'appwrite'; // Import ID directly
import { AffiliateListing, AppwriteFunctionExecutionResult } from '../types/appwrite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);
const functions = new Functions(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const AFFILIATE_LISTINGS_COLLECTION_ID = 'affiliate_listings'; // Assuming this is the collection ID

const TheEditPage: React.FC = () => {
  const [listings, setListings] = useState<AffiliateListing[]>([]);
  const [newListing, setNewListing] = useState({ title: '', description: '', original_url: '' });
  const [editingListing, setEditingListing] = useState<AffiliateListing | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        AFFILIATE_LISTINGS_COLLECTION_ID,
        [Query.limit(100)]
      );
      setListings(response.documents as unknown as AffiliateListing[]); 
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to fetch listings.');
    }
  };

  const handleCreateListing = async () => {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        AFFILIATE_LISTINGS_COLLECTION_ID,
        ID.unique(), // Use ID.unique() directly
        newListing
      );
      setListings((prev) => [...prev, response as unknown as AffiliateListing]); // Explicit cast
      setNewListing({ title: '', description: '', original_url: '' });
      toast.success('Listing created successfully!');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Failed to create listing.');
    }
  };

  const handleUpdateListing = async () => {
    if (!editingListing) return;
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        AFFILIATE_LISTINGS_COLLECTION_ID,
        editingListing.$id,
        editingListing
      );
      setListings((prev) =>
        prev.map((item) => (item.$id === editingListing.$id ? (response as unknown as AffiliateListing) : item)) // Explicit cast
      );
      setEditingListing(null);
      toast.success('Listing updated successfully!');
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error('Failed to update listing.');
    }
  };

  const handleDeleteListing = async (id: string) => {
    try {
      await databases.deleteDocument(DATABASE_ID, AFFILIATE_LISTINGS_COLLECTION_ID, id);
      setListings((prev) => prev.filter((item) => item.$id !== id));
      toast.success('Listing deleted successfully!');
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing.');
    }
  };

  const handleExecuteFunction = async () => {
    try {
      // Replace 'yourFunctionId' with the actual ID of your Appwrite function
      const response = await functions.createExecution('yourFunctionId', JSON.stringify({ someData: 'value' }));
      
      // Appwrite function execution results are typically in response.response
      const result = JSON.parse((response as unknown as AppwriteFunctionExecutionResult).response); 
      console.log('Function execution result:', result);
      toast.success('Function executed successfully!');
    } catch (error) {
      console.error('Error executing function:', error);
      toast.error('Failed to execute function.');
    }
  };

  return (
    <div className="container mx-auto p-4 bg-background text-foreground min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Affiliate Listings Management</h1>

      <div className="mb-8 p-6 border rounded-lg shadow-lg bg-card">
        <h2 className="text-2xl font-semibold mb-4">
          {editingListing ? 'Edit Listing' : 'Create New Listing'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input
            placeholder="Title"
            value={editingListing ? editingListing.title : newListing.title}
            onChange={(e) =>
              editingListing
                ? setEditingListing({ ...editingListing, title: e.target.value })
                : setNewListing({ ...newListing, title: e.target.value })
            }
            className="bg-input text-foreground border-border"
          />
          <Input
            placeholder="Original URL"
            value={editingListing ? editingListing.original_url : newListing.original_url}
            onChange={(e) =>
              editingListing
                ? setEditingListing({ ...editingListing, original_url: e.target.value })
                : setNewListing({ ...newListing, original_url: e.target.value })
            }
            className="bg-input text-foreground border-border"
          />
          <Textarea
            placeholder="Description"
            value={editingListing ? editingListing.description : newListing.description}
            onChange={(e) =>
              editingListing
                ? setEditingListing({ ...editingListing, description: e.target.value })
                : setNewListing({ ...newListing, description: e.target.value })
            }
            className="bg-input text-foreground border-border"
          />
        </div>
        <div className="flex justify-end space-x-2">
          {editingListing ? (
            <>
              <Button onClick={handleUpdateListing} className="bg-primary text-primary-foreground hover:bg-primary-blue-light">
                Update Listing
              </Button>
              <Button onClick={() => setEditingListing(null)} variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary-neon-dark">
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={handleCreateListing} className="bg-primary text-primary-foreground hover:bg-primary-blue-light">
              Add Listing
            </Button>
          )}
        </div>
      </div>

      <div className="mb-8 p-6 border rounded-lg shadow-lg bg-card">
        <h2 className="text-2xl font-semibold mb-4">Execute Appwrite Function</h2>
        <Button onClick={handleExecuteFunction} className="bg-accent text-accent-foreground hover:bg-accent/80">
          Run Test Function
        </Button>
      </div>

      <div className="p-6 border rounded-lg shadow-lg bg-card">
        <h2 className="text-2xl font-semibold mb-4">Existing Listings</h2>
        {listings.length === 0 ? (
          <p className="text-muted-foreground">No listings found.</p>
        ) : (
          <ul className="space-y-4">
            {listings.map((listing) => (
              <li key={listing.$id} className="flex justify-between items-center p-4 border rounded-md bg-background">
                <div>
                  <h3 className="text-lg font-medium">{listing.title}</h3>
                  <p className="text-sm text-muted-foreground">{listing.description}</p>
                  <a href={listing.original_url} target="_blank" rel="noopener noreferrer" className="text-primary-blue hover:underline text-sm">
                    {listing.original_url}
                  </a>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => setEditingListing(listing)} variant="outline" className="border-primary-blue text-primary-blue hover:bg-primary-blue-light hover:text-primary-foreground">
                    Edit
                  </Button>
                  <Button onClick={() => handleDeleteListing(listing.$id)} variant="destructive" className="bg-destructive text-destructive-foreground hover:bg-destructive/80">
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TheEditPage;