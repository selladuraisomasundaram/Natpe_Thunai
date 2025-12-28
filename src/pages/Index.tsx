"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext'; // Use AuthContext
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const IndexPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth(); // Use AuthContext
  const [localLoading, setLocalLoading] = useState(true); // Local loading for splash screen delay

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 1500); // Simulate a splash screen delay

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!localLoading && !loading) {
      if (!isAuthenticated) {
        navigate('/auth');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, loading, localLoading, navigate]);

  if (localLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary to-background-dark text-primary-foreground">
        <Loader2 className="h-16 w-16 animate-spin text-secondary-neon" />
        <h1 className="text-4xl font-bold mt-6 animate-pulse">Gradual</h1>
        <p className="mt-2 text-lg">Loading your academic journey...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary to-background-dark text-primary-foreground p-4">
      <h1 className="text-5xl font-extrabold mb-4 text-center leading-tight">
        Welcome to Gradual
      </h1>
      <p className="text-xl text-center max-w-2xl mb-8 opacity-90">
        Your personalized companion for academic success and campus life.
      </p>
      <Button
        onClick={() => navigate('/auth')}
        className="px-8 py-3 text-lg font-semibold bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-1"
      >
        Get Started
      </Button>
    </div>
  );
};

export default IndexPage;