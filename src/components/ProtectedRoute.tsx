"use client";

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const ProtectedRoute = () => {
  const { user } = useAuth();

  if (!user) {
    toast.error("You need to be logged in to access this page.");
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;