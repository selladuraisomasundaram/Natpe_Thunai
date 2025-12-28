"use client";

import React from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormControl } from '@/components/ui/form'; // Importing FormControl

const ProfileDetailsPage = () => {
  const { profileId } = useParams();

  // This would typically come from an API call based on profileId
  const profile = {
    id: profileId,
    name: "John Doe",
    email: "john.doe@example.com",
    bio: "Passionate gamer and community organizer.",
    profilePictureUrl: "https://github.com/shadcn.png", // Example URL
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={profile.profilePictureUrl} alt={`${profile.name}'s profile picture`} />
            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold">{profile.name}</CardTitle>
          <CardDescription className="text-lg text-gray-600">{profile.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <p id="bio" className="text-gray-700">{profile.bio}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profileId">Profile ID</Label>
            <Input id="profileId" value={profile.id} readOnly className="bg-gray-50" />
          </div>
          {/* Example of using FormControl - typically within a Form component */}
          <div className="space-y-2">
            <Label htmlFor="username">Username (example with FormControl)</Label>
            {/* In a real scenario, FormControl would wrap an input within a Form component */}
            <FormControl asChild>
              <Input id="username" defaultValue={profile.name} />
            </FormControl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileDetailsPage;