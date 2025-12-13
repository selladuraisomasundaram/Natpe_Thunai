"use client";

import React, { useState } from 'react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Search, MapPin, Tag, CalendarDays, UserCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLostFoundListings, LostFoundPost } from '@/hooks/useLostFoundListings';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_LOST_FOUND_COLLECTION_ID } from '@/lib/appwrite';
import { ID } from 'appwrite';
import PostLostFoundForm, { LostFoundPostData } from '@/components/forms/PostLostFoundForm';

const LostFoundPage = () => {
  const { user, userProfile } = useAuth();
  const { listings, isLoading, error } = useLostFoundListings(userProfile?.collegeName);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');

  const handlePostLostFound = async (data: LostFoundPostData) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a lost or found item.");
      return;
    }

    try {
      const newPostData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
        status: "active",
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_LOST_FOUND_COLLECTION_ID,
        ID.unique(),
        newPostData
      );

      toast.success(`Your ${data.type} item "${data.title}" has been posted!`);
      setIsPostDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting lost/found item:", e);
      toast.error(e.message || "Failed to post item.");
    }
  };

  const filteredListings = listings.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Lost & Found</h1>

      <div className="max-w-md mx-auto space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card border-border text-foreground w-full"
            />
          </div>
          <Select value={filterType} onValueChange={(value: 'all' | 'lost' | 'found') => setFilterType(value)}>
            <SelectTrigger className="w-[120px] bg-card border-border text-foreground">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent className="bg-card text-foreground border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="found">Found</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Post Lost or Found Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Post Lost or Found Item</DialogTitle>
            </DialogHeader>
            <PostLostFoundForm
              onSubmit={handlePostLostFound}
              onCancel={() => setIsPostDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.type === 'lost' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {item.type === 'lost' ? 'Lost' : 'Found'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4 mr-2 text-primary" /> {item.location}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <UserCircle className="h-4 w-4 mr-2 text-primary" /> Posted by {item.posterName}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 mr-2 text-primary" /> {new Date(item.$createdAt).toLocaleDateString()}
                  </div>
                  {/* Add more details or actions here if needed */}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">No lost or found items found.</p>
        )}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default LostFoundPage;