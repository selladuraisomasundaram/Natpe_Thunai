"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Settings, MessageSquare, DollarSign, Briefcase, GraduationCap, HeartHandshake, MapPin, BookOpen, ShoppingBag, Utensils, ShieldCheck, Loader2 } from 'lucide-react'; // Imported Loader2
import ProfileWidget from '@/components/ProfileWidget';
import GraduationMeter from '@/components/GraduationMeter';
import { Separator } from '@/components/ui/separator';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout, user, userPreferences, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-background-dark p-4">
        <Loader2 className="h-16 w-16 animate-spin text-secondary-neon" />
      </div>
    );
  }

  if (!user || !userPreferences) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary to-background-dark text-primary-foreground p-4">
        <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">Please log in to view your profile.</p>
            <Button onClick={() => navigate('/auth')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Profile Summary Card */}
        <Card className="lg:col-span-2 bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary-neon">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userPreferences.name}`} alt={userPreferences.name} />
              <AvatarFallback><User className="h-12 w-12 text-muted-foreground" /></AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-3xl font-bold text-foreground">{userPreferences.name}</h2>
              <p className="text-lg text-muted-foreground">{user.email}</p>
              <p className="text-md text-muted-foreground mt-1">{userPreferences.collegeName || 'College Student'}</p>
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                {userPreferences.isDeveloper && (
                  <Button variant="secondary" size="sm" className="bg-purple-600 text-white hover:bg-purple-700">
                    <ShieldCheck className="h-4 w-4 mr-2" /> Developer
                  </Button>
                )}
                {userPreferences.isAmbassador && (
                  <Button variant="secondary" size="sm" className="bg-green-600 text-white hover:bg-green-700">
                    <HeartHandshake className="h-4 w-4 mr-2" /> Ambassador
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => navigate('/profile/details')}>
                  <Settings className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widgets Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <ProfileWidget />
          <GraduationMeter />
        </div>
      </div>

      <Separator className="my-8" />

      <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions & Navigation</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center text-center" onClick={() => navigate('/chat')}>
          <MessageSquare className="h-6 w-6 mb-2" />
          Chat
        </Button>
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center text-center" onClick={() => navigate('/wallet')}>
          <DollarSign className="h-6 w-6 mb-2" />
          Wallet
        </Button>
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center text-center" onClick={() => navigate('/services/freelance')}>
          <Briefcase className="h-6 w-6 mb-2" />
          Freelance
        </Button>
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center text-center" onClick={() => navigate('/services/errands')}>
          <MapPin className="h-6 w-6 mb-2" />
          Errands
        </Button>
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center text-center" onClick={() => navigate('/services/food-wellness')}>
          <Utensils className="h-6 w-6 mb-2" />
          Food & Wellness
        </Button>
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center text-center" onClick={() => navigate('/services/lost-found')}>
          <BookOpen className="h-6 w-6 mb-2" />
          Lost & Found
        </Button>
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center text-center" onClick={() => navigate('/marketplace')}>
          <ShoppingBag className="h-6 w-6 mb-2" />
          Marketplace
        </Button>
        <Button variant="destructive" className="h-24 flex flex-col items-center justify-center text-center" onClick={logout}>
          <LogOut className="h-6 w-6 mb-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;