"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-card text-card-foreground p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary-neon">Campus Connect</Link>
        <div className="space-x-4">
          <Link to="/food-offerings" className="hover:text-secondary-neon">Food</Link>
          <Link to="/errands" className="hover:text-secondary-neon">Errands</Link>
          <Link to="/exchange" className="hover:text-secondary-neon">Exchange</Link>
          {user ? (
            <>
              <Link to="/profile" className="hover:text-secondary-neon">Profile</Link>
              <Button variant="ghost" onClick={logout} className="hover:text-secondary-neon">Logout</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-secondary-neon">Login</Link>
              <Link to="/register" className="hover:text-secondary-neon">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;