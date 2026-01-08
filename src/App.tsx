"use client";

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import OfflinePage from './pages/OfflinePage'; // Import the new OfflinePage

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* If offline, redirect all routes to OfflinePage */}
        {!isOnline && <Route path="*" element={<OfflinePage />} />}
        
        {/* If online, render the main application routes */}
        {isOnline && (
          <>
            <Route path="/" element={<Index />} />
            {/* Add other routes here as needed */}
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;