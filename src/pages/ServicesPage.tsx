"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const ServicesPage = () => {
  const navigate = useNavigate();
  const { userPreferences } = useAuth();

  if (!userPreferences?.collegeName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-background-dark p-4">
        <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Services</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground p-4">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p>Please set your college name in your profile to access services.</p>
            <Button onClick={() => navigate('/profile/details')} className="mt-4">
              Go to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Campus Services</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-card text-foreground shadow-lg rounded-lg border-border hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Freelance Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Offer your skills or find help for various tasks.
            </p>
            <Button onClick={() => navigate('/services/freelance')} className="w-full">
              Explore Freelance
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card text-foreground shadow-lg rounded-lg border-border hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Errands & Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Need something done? Post an errand or help others.
            </p>
            <Button onClick={() => navigate('/services/errands')} className="w-full">
              Run Errands
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card text-foreground shadow-lg rounded-lg border-border hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Food & Wellness</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Find home-cooked meals, healthy options, or wellness services.
            </p>
            <Button onClick={() => navigate('/services/food-wellness')} className="w-full">
              Discover Food & Wellness
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card text-foreground shadow-lg rounded-lg border-border hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Lost & Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Post lost items or report found ones to help your community.
            </p>
            <Button onClick={() => navigate('/services/lost-found')} className="w-full">
              Browse Lost & Found
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card text-foreground shadow-lg rounded-lg border-border hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Cash Exchange</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Exchange cash with peers securely on campus.
            </p>
            <Button onClick={() => navigate('/services/cash-exchange')} className="w-full">
              Manage Cash Exchange
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card text-foreground shadow-lg rounded-lg border-border hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Short-Term Needs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Post or fulfill urgent, short-term requests.
            </p>
            <Button onClick={() => navigate('/services/short-term-needs')} className="w-full">
              View Short-Term Needs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServicesPage;