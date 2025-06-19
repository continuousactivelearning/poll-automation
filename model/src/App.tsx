import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import LoginPage from './pages/LoginPage';
import HostDashboard from './pages/HostDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-space-blue via-charcoal to-gradient-start">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/host/*" element={
                <ProtectedRoute requiredRole="host">
                  <HostDashboard />
                </ProtectedRoute>
              } />
              <Route path="/student/*" element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: 'rgba(27, 38, 59, 0.9)',
                  color: '#00FFFF',
                  border: '1px solid rgba(0, 255, 255, 0.3)',
                  backdropFilter: 'blur(10px)',
                },
              }}
            />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;