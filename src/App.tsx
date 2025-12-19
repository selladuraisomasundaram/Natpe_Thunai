"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IndexPage from './pages/IndexPage';
import FoodOfferingsPage from './pages/FoodOfferingsPage';
import ErrandsPage from './pages/ErrandsPage';
import ShortTermNeedsPage from './pages/ShortTermNeedsPage';
import ExchangePage from './pages/ExchangePage';
import DeveloperDashboard from './pages/DeveloperDashboard';
import { AuthProvider } from './context/AuthContext'; // Corrected import
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TrackingPage from './pages/TrackingPage'; // Assuming this page exists
import CashExchangePage from './pages/CashExchangePage'; // Assuming this page exists
import CollaboratorsPage from './pages/CollaboratorsPage'; // Assuming this page exists
import DeveloperDashboardPage from './pages/DeveloperDashboardPage'; // Assuming this page exists
import FoodWellnessPage from './pages/FoodWellnessPage'; // Assuming this page exists
import FreelancePage from './pages/FreelancePage'; // Assuming this page exists
import PaymentConfirmationPage from './pages/PaymentConfirmationPage'; // Assuming this page exists
import PostJobPage from './pages/PostJobPage'; // Assuming this page exists
import ProductDetailsPage from './pages/ProductDetailsPage'; // Assuming this page exists
import AuthPage from './pages/AuthPage'; // Assuming this page exists


function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Toaster richColors position="top-center" />
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/food-offerings" element={<FoodOfferingsPage />} />
          <Route path="/errands" element={<ErrandsPage />} />
          <Route path="/short-term-needs" element={<ShortTermNeedsPage />} />
          <Route path="/exchange" element={<ExchangePage />} />
          <Route path="/developer-dashboard" element={<DeveloperDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/cash-exchange" element={<CashExchangePage />} />
          <Route path="/collaborators" element={<CollaboratorsPage />} />
          <Route path="/developer-dashboard-page" element={<DeveloperDashboardPage />} />
          <Route path="/food-wellness" element={<FoodWellnessPage />} />
          <Route path="/freelance" element={<FreelancePage />} />
          <Route path="/payment-confirmation" element={<PaymentConfirmationPage />} />
          <Route path="/post-job" element={<PostJobPage />} />
          <Route path="/product-details/:id" element={<ProductDetailsPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;