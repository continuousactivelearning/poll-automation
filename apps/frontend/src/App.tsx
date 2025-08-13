import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AuthGuard from './components/AuthGuard';
import LoadingScreen from './components/LoadingScreen';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HostDashboard from './pages/HostDashboard'
import StudentDashboard from './pages/StudentDashboard';
import AudioCapture from './pages/AudioCapture';
import AIQuestionFeed from './pages/AIQuestionFeed';
import Participants from './pages/Participants';
import Leaderboard from './pages/Leaderboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import HomePage from './pages/HomePage';
import CreateManualPoll from './pages/CreateManualPoll';
import CreatePollPage from './pages/CreatePollPage';
import ContactUs from './pages/ContactUs';
import ChangePassword from './components/student/ChangePassword';
import GuestPage from './pages/guest/GuestPage';
import NotFound from './pages/NotFound';

// Student dashboard section imports
import JoinPollPage from './components/student/JoinPollPage';
import PollHistoryPage from './components/student/PollHistoryPage';
import PollQuestionsPage from './pages/PollQuestionsPage'; // Correct import

import StudentProfilePage from './components/student/StudentProfilePage';
import AchievementPage from './components/student/AchievementPage';
import NotificationPage from './components/student/NotificationPage';
import SettingsStudent from './components/student/Settings';
import StudentLeaderboard from './components/student/StudentLeaderboard';
import DashboardHomePage from './components/student/DashboardHomePage';
import ActiveSessions from './components/student/ActiveSessions';
import { AccessibilityProvider } from './contexts/AccessibilityContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LoadingProvider>
          <NotificationProvider>
            <Router>
              <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
                <LoadingScreen />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/resetpassword/:token" element={<ResetPasswordPage />} />
                  <Route path="/contactUs" element={<ContactUs />} />

                  {/* Host Dashboard Routes - Protected */}
                  <Route path="/host" element={
                      <AuthGuard><HostDashboard /></AuthGuard>
                  } />
                  <Route path="/host/audio" element={
                      <AuthGuard><AudioCapture /></AuthGuard>
                  } />
                  <Route path="/host/ai-questions" element={
                      <AuthGuard><AIQuestionFeed /></AuthGuard>
                  } />
                  <Route path="/host/create-manual-poll" element={
                      <AuthGuard><CreateManualPoll /></AuthGuard>
                  } />
                  <Route path="/host/create-poll" element={
                      <AuthGuard><CreatePollPage /></AuthGuard>
                  } />
                  <Route path="/host/participants" element={
                      <AuthGuard><Participants /></AuthGuard>
                  } />
                  <Route path="/host/leaderboard" element={
                      <AuthGuard><Leaderboard /></AuthGuard>
                  } />
                  <Route path="/host/reports" element={
                      <AuthGuard><Reports /></AuthGuard>
                  } />
                  <Route path="/host/settings" element={
                    <AuthGuard><AccessibilityProvider><Settings /></AccessibilityProvider></AuthGuard>
                  } />
                  <Route path="/guest" element={
                    <GuestPage />
                    } />

                  {/* Student Dashboard Routes - Protected */}
                  <Route path="/student/*" element={<AuthGuard><StudentDashboard /></AuthGuard>}>
                    <Route index element={<DashboardHomePage />} />
                    <Route path="join-poll" element={<JoinPollPage />} />
                    <Route path="history" element={<PollHistoryPage />} />
                    {/* FIXED: Removed roomCode prop as PollQuestionsPage now reads it from URLSearchParams */}
                    <Route path="poll-questions" element={<PollQuestionsPage />} />
                    <Route path="profile" element={<StudentProfilePage />} />
                    <Route path="achievements" element={<AchievementPage />} />
                    <Route path="notifications" element={<NotificationPage />} />
                    <Route path="settings" element={<AccessibilityProvider><SettingsStudent /></AccessibilityProvider>} />
                    <Route path="leaderboard" element={<StudentLeaderboard />} />
                    <Route path="change-password" element={<ChangePassword />} />
                    <Route path="active-sessions" element={<ActiveSessions />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </Router>
          </NotificationProvider>
        </LoadingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
