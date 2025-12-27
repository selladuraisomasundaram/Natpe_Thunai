"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "@/pages/Index";
import AuthPage from "@/pages/AuthPage";
import HomePage from "@/pages/HomePage";
import NotFound from "@/pages/NotFound";
import VerificationBanner from "@/components/VerificationBanner";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ProfilePage from "@/pages/ProfilePage";
import ProfileDetailsPage from "@/pages/ProfileDetailsPage";
import WalletPage from "@/pages/WalletPage";
import PoliciesPage from "@/pages/PoliciesPage";
import DeveloperDashboardPage from "@/pages/DeveloperDashboardPage";
import ActivityPage from "@/pages/ActivityPage";
import LostAndFoundPage from "@/pages/LostAndFoundPage";
import TrackingPage from "@/pages/TrackingPage";
import CashExchangePage from "@/pages/CashExchangePage";
import TournamentPage from "@/pages/TournamentPage";
import MarketPage from "@/pages/MarketPage";
import ProductDetailsPage from "@/pages/ProductDetailsPage";
import PaymentConfirmationPage from "@/pages/PaymentConfirmationPage";
import ServicesPage from "@/pages/ServicesPage";
import FreelancePage from "@/pages/FreelancePage";
import ErrandsPage from "@/pages/ErrandsPage";
import ShortTermNeedsPage from "@/pages/ShortTermNeedsPage";
import FoodWellnessPage from "@/pages/FoodWellnessPage";
import TicketBookingPage from "@/pages/TicketBookingPage";
import CollaboratorsPage from "@/pages/CollaboratorsPage";
import AmbassadorProgramPage from "@/pages/AmbassadorProgramPage";
import ImageToUrlHelpPage from "@/pages/ImageToUrlHelpPage";
import ServicePaymentConfirmationPage from "@/pages/ServicePaymentConfirmationPage";
import ChatPage from "@/pages/ChatPage";
import OfflinePage from "@/pages/OfflinePage";
import ComingSoonPage from "@/pages/ComingSoonPage";
import PostJobPage from "@/pages/PostJobPage";

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Determine if VerificationBanner should be shown
  const showVerificationBanner = isAuthenticated && !isLoading && !user?.emailVerification;

  return (
    <>
      {showVerificationBanner && <VerificationBanner />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/offline" element={<OfflinePage />} />
        <Route path="/coming-soon" element={<ComingSoonPage />} />
        <Route path="/image-to-url-help" element={<ImageToUrlHelpPage />} />
        <Route path="/market/product/:productId" element={<ProductDetailsPage />} />
        <Route path="/market/confirm-payment/:transactionId" element={<PaymentConfirmationPage />} />
        <Route path="/services/confirm-payment/:transactionId" element={<ServicePaymentConfirmationPage />} />
        <Route path="/chat/:chatRoomId" element={<ChatPage />} />


        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/details" element={<ProfileDetailsPage />} />
          <Route path="/profile/wallet" element={<WalletPage />} />
          <Route path="/profile/policies" element={<PoliciesPage />} />
          <Route path="/developer-dashboard" element={<DeveloperDashboardPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/activity/lost-found" element={<LostAndFoundPage />} />
          <Route path="/activity/tracking" element={<TrackingPage />} />
          <Route path="/activity/cash-exchange" element={<CashExchangePage />} />
          <Route path="/tournaments" element={<TournamentPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/freelance" element={<FreelancePage />} />
          <Route path="/services/errands" element={<ErrandsPage />} />
          <Route path="/services/short-term" element={<ShortTermNeedsPage />} />
          <Route path="/services/food-wellness" element={<FoodWellnessPage />} />
          <Route path="/services/ticket-booking" element={<TicketBookingPage />} />
          <Route path="/services/collaborators" element={<CollaboratorsPage />} />
          <Route path="/services/ambassador-program" element={<AmbassadorProgramPage />} />
          <Route path="/services/post-job" element={<PostJobPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;