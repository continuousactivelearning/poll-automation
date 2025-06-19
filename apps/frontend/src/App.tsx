import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HostDashboard from './pages/HostDashboard';
import ParticipantInterface from './pages/ParticipantInterface';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import UploadWAV from "./components/UploadWAV";
import { HostSettingsComponent } from "./components/HostSettings";
import './styles/fonts.css';
import './styles/animations.css';

const AppContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="page-transition">
        <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              <Route
                path="/host/*"
                element={
                  <ProtectedRoute role="host">
                    <HostDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/participant/*"
                element={
                  <ProtectedRoute role="participant">
                    <ParticipantInterface />
                  </ProtectedRoute>
                }
              />
              {/* Development routes for testing new components */}
              <Route path="/test-upload" element={<UploadWAV />} />
              <Route path="/test-host-settings" element={<HostSettingsComponent />} />
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;