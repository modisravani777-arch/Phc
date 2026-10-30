import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardOverview } from './pages/DashboardOverview';
import { StaffPage } from './pages/StaffPage';
import { ReportsPage } from './pages/ReportsPage';
import { AffiliationsPage } from './pages/AffiliationsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { RegistersPage } from './pages/RegistersPage';
import { InventoryPage } from './pages/InventoryPage';
import { VillagesPage } from './pages/VillagesPage';
import { ScheduleCalendarPage } from './pages/ScheduleCalendarPage';
import ConfigurableFractalDotGridDemo from './components/ConfigurableFractalDotGridDemo';
import { PageMetadata } from './components/PageMetadata';
import { CookieConsent } from './components/CookieConsent';
import { NotFoundPage, PrivacyPage, TermsPage } from './pages/PublicPages';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f7faff] text-navy-900 gap-3">
        <img
          src="/app_icon.svg"
          alt="ArogyaSathi logo"
          className="h-10 w-10 rounded-xl animate-pulse"
        />
        <div className="text-xs font-semibold text-slate-500">Loading ArogyaSathi workspace...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <PageMetadata />
          <CookieConsent />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/demo" element={<ConfigurableFractalDotGridDemo />} />
            <Route path="/fractal" element={<ConfigurableFractalDotGridDemo />} />

            {/* Authenticated Application Workspace */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardOverview />} />
              <Route path="registers" element={<RegistersPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="villages" element={<VillagesPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="calendar" element={<ScheduleCalendarPage />} />
              <Route path="affiliations" element={<AffiliationsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
