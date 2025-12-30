"use client";

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// Assuming AuthContext provides a way to check if a user is authenticated
// import { useAuth } from '../context/AuthContext'; 

const PrivateRoute: React.FC = () => {
  // const { isAuthenticated } = useAuth(); // Uncomment and implement useAuth if available
  const isAuthenticated = true; // Placeholder for now

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;