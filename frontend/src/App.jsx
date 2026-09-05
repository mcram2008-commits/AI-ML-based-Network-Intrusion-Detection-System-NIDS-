import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import DashboardPage from './pages/DashboardPage';
import LiveMonitoringPage from './pages/LiveMonitoringPage';
import IntrusionDetectionPage from './pages/IntrusionDetectionPage';
import AlertsPage from './pages/AlertsPage';
import AttackAnalyticsPage from './pages/AttackAnalyticsPage';
import IPInvestigationPage from './pages/IPInvestigationPage';
import RouteOptimizationPage from './pages/RouteOptimizationPage';
import DatasetsPage from './pages/DatasetsPage';
import MLModelsPage from './pages/MLModelsPage';
import ReportsPage from './pages/ReportsPage';
import UserManagementPage from './pages/UserManagementPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import AiCopilotWidget from './components/AiCopilotWidget';

const ProtectedLayout = ({ children }) => (
  <div className="flex min-h-screen bg-[#070A12] text-slate-100 font-sans">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Navbar />
      <main className="flex-1 p-2 sm:p-4 overflow-y-auto">
        {children}
      </main>
      <AiCopilotWidget />
    </div>
  </div>
);

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication & Landing Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected NIDS Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Security Analyst', 'Viewer']}>
                <ProtectedLayout><DashboardPage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/monitoring"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Security Analyst']}>
                <ProtectedLayout><LiveMonitoringPage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/detection"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Security Analyst']}>
                <ProtectedLayout><IntrusionDetectionPage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Security Analyst']}>
                <ProtectedLayout><AlertsPage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Security Analyst', 'Viewer']}>
                <ProtectedLayout><AttackAnalyticsPage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ip-investigation"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Security Analyst']}>
                <ProtectedLayout><IPInvestigationPage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/route-optimization"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Security Analyst']}>
                <ProtectedLayout><RouteOptimizationPage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/datasets"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Security Analyst']}>
                <ProtectedLayout><DatasetsPage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/models"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Security Analyst']}>
                <ProtectedLayout><MLModelsPage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Security Analyst', 'Viewer']}>
                <ProtectedLayout><ReportsPage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Security Analyst', 'Viewer']}>
                <ProtectedLayout><ProfilePage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Only Routes */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <ProtectedLayout><UserManagementPage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <ProtectedLayout><SettingsPage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-All Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
