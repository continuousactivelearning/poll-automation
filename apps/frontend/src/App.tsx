import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HostDashboard from './pages/HostDashboard';
import ParticipantInterface from './pages/ParticipantInterface';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/fonts.css';
import './styles/animations.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="page-transition">
          <Routes>
            <Route path="/" element={<LandingPage />} />
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
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;