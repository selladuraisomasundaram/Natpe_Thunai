"use client";

import React, { createContext, useState, useContext } from 'react';

interface AuthContextProps {
  children: React.ReactNode;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  graduationLogic: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: AuthContextProps) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string) => {
    // TO DO: implement login logic
    const newUser: User = { id: '1', name: 'John Doe', email };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const graduationLogic = () => {
    // TO DO: implement graduation logic
    console.log('Graduation logic executed');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, graduationLogic }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };