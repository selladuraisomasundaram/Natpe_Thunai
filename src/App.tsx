"use client";

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import LoginStreakCard from './components/LoginStreakCard';
import { Toaster } from 'sonner'; // Import Toaster from sonner

function App() {
  return (
    <AuthProvider>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">My Application</h1>
        <LoginStreakCard />
        {/* Render other components of your application here */}
      </div>
      <Toaster /> {/* Render the sonner Toaster component here */}
    </AuthProvider>
  );
}

export default App;