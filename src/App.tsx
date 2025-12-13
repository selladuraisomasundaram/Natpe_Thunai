"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TopNavbar from './components/TopNavbar';
import BottomNavbar from './components/BottomNavbar';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import ActivityPage from './pages/ActivityPage';
import TournamentPage from './pages/TournamentPage';
import AmbassadorProgramPage from './pages/AmbassadorProgramPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LostFoundPage from './pages/LostFoundPage';
import ServiceListingsPage from './pages/ServiceListingsPage';
import TrackingPage from './pages/TrackingPage';
import MarketPage from './pages/MarketPage';
import CashExchangePage from './pages/CashExchangePage';
import WalletPage from './pages/WalletPage'; // New import


function App() {
  return (
    <Router>
      <AuthProvider>
        <TopNavbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/tournaments" element={<TournamentPage />} />
              <Route path="/ambassador-program" element={<AmbassadorProgramPage />} />
              <Route path="/lost-found" element={<LostFoundPage />} />
              <Route path="/services/:serviceType" element={<ServiceListingsPage />} />
              <Route path="/tracking" element={<TrackingPage />} />
              <Route path="/market" element={<MarketPage />} />
              <Route path="/activity/cash-exchange" element={<CashExchangePage />} />
              <Route path="/wallet" element={<WalletPage />} /> {/* New Route */}
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <BottomNavbar />
      </AuthProvider>
    </Router>
  );
}

export default App;