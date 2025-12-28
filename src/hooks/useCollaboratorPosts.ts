"use client";

import { useState, useEffect } from 'react';
import { Databases, Query, Models, ID } from 'appwrite';
import { client } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AppwriteDocument } from '@/types/appwrite';

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLABORATOR_POSTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLABORATOR_POSTS_COLLECTION_ID;

export type ProjectCategory = 'academic' | 'tech' | 'creative' | 'startup' | 'event' | 'other';
export type ProjectStatus = 'open' | 'in_progress' | 'completed' | 'closed';

export interface CollaboratorPost extends AppwriteDocument {
  title: string;
  description: string;
  category: ProjectCategory;
  skillsNeeded: string[];
  commitment: string; // e.g., "part-time", "full-time", "flexible"
  posterId: string;
  posterName: string;
  collegeName: string;
  contactInfo: string;
  status: ProjectStatus;
  teamMembers?: { userId: string; userName: string; role: string }[];
}

const useCollaboratorPosts = () => {
  const { user, userPreferences } = useAuth();
  const [posts, setPosts] = useState<CollaboratorPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (userPreferences?.collegeName && userPreferences.collegeName !== 'N/A') {
        queries.push(Query.equal('collegeName', userPreferences.collegeName));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLABORATOR_POSTS_COLLECTION_ID,
        queries
      );
      setPosts(response.documents as CollaboratorPost[]); // Type assertion is now safer
    } catch (err: any) {
      setError('Failed to fetch collaborator posts.');
      console.error('Error fetching collaborator posts:', err);
      toast.error('Failed to load collaborator posts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [userPreferences?.collegeName]);

  const postProject = async (postData: Omit<CollaboratorPost, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId' | '$sequence' | 'posterId' | 'posterName' | 'collegeName' | 'status' | 'teamMembers'>) => {
    if (!user || !userPreferences) {
      toast.error("You must be logged in to post a project.");
      return;
    }

    try {
      const newPost = await databases.createDocument(
        DATABASE_ID,
        COLLABORATOR_POSTS_COLLECTION_ID,
        ID.unique(),
        {
          ...postData,
          posterId: user.$id,
          posterName: user.name,
          collegeName: userPreferences.collegeName,
          status: 'open',
          teamMembers: [{ userId: user.$id, userName: user.name, role: 'Creator' }],
        },
        [
          Models.Permission.read(Models.Role.any()),
          Models.Permission.write(Models.Role.user(user.$id)),
        ]
      );
      setPosts(prev => [newPost as CollaboratorPost, ...prev]); // Type assertion is now safer
      toast.success("Project posted successfully!");
    } catch (err: any) {
      toast.error("Failed to post project: " + err.message);
      console.error("Error posting project:", err);
    }
  };

  const updatePostStatus = async (postId: string, newStatus: ProjectStatus) => {
    if (!user) {
      toast.error("You must be logged in to update project status.");
      return;
    }
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLABORATOR_POSTS_COLLECTION_ID,
        postId,
        { status: newStatus },
        [Models.Permission.write(Models.Role.user(user.$id))]
      );
      setPosts(prev =>
        prev.map(post =>
          post.$id === postId ? { ...post, status: newStatus } : post
        )
      );
      toast.success("Project status updated.");
    } catch (err: any) {
      toast.error("Failed to update project status: " + err.message);
      console.error("Error updating project status:", err);
    }
  };

  return { posts, isLoading, error, refetch: fetchPosts, postProject, updatePostStatus };
};

export default useCollaboratorPosts;