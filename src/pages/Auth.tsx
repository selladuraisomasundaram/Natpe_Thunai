// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; // Ensure you have this context
import Layout from './components/Layout'; // Assuming you have a layout with a navbar

// Import your pages (Create simple placeholders if they don't exist yet)
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import MarketPage from './pages/MarketPage';
import ProfilePage from './pages/ProfilePage';
import ServicesPage from './pages/ServicesPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
};

const App = () => {
  return (
    <Routes>
      {/* Public Route: Login Page */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Protected Routes (Require Login) */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback: Redirect unknown paths to Home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;