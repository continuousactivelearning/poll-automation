import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import AuthGuard from "./components/AuthGuard";
import LoadingScreen from "./components/LoadingScreen";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HostDashboard from "./pages/HostDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import AudioCapture from "./pages/AudioCapture";
import AIQuestionFeed from "./pages/AIQuestionFeed";
import Participants from "./pages/Participants";
import Leaderboard from "./pages/Leaderboard";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import HomePage from "./pages/HomePage";
import CreateManualPoll from "./pages/CreateManualPoll";
import CreatePollPage from "./pages/CreatePollPage";
import ContactUs from "./pages/ContactUs";
import ChangePassword from "./components/student/ChangePassword";
import GuestPage from "./pages/guest/GuestPage";
import NotFound from "./pages/NotFound";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import IntegrationTest from "./pages/IntegrationTest";

// Student dashboard section imports
import JoinPollPage from "./components/student/JoinPollPage";
import PollHistoryPage from "./components/student/PollHistoryPage";
import PollQuestionsPage from "./components/student/PollQuestionsPage";
import StudentProfilePage from "./components/student/StudentProfilePage";
import AchievementPage from "./components/student/AchievementPage";
import NotificationPage from "./components/student/NotificationPage";
import SettingsStudent from "./components/student/Settings";
import StudentLeaderboard from "./components/student/StudentLeaderboard";
import DashboardHomePage from "./components/student/DashboardHomePage";
import ActiveSessions from "./components/student/ActiveSessions";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LoadingProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
              <LoadingScreen />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route
                  path="/reset-password/:token"
                  element={<ResetPasswordPage />}
                />
                <Route path="/contactUs" element={<ContactUs />} />

                {/* Host Dashboard Routes */}
                <Route path="/host" element={<HostDashboard />} />
                <Route path="/host/audio" element={<AudioCapture />} />
                <Route path="/host/ai-questions" element={<AIQuestionFeed />} />
                <Route
                  path="/host/create-manual-poll"
                  element={<CreateManualPoll />}
                />
                <Route path="/host/create-poll" element={<CreatePollPage />} />
                <Route path="/host/participants" element={<Participants />} />
                <Route path="/host/leaderboard" element={<Leaderboard />} />
                <Route path="/host/reports" element={<Reports />} />
                <Route path="/host/settings" element={<Settings />} />
                <Route path="/guest" element={<GuestPage />} />
                <Route path="/integration-test" element={<IntegrationTest />} />

                {/* Student Dashboard Routes */}
                <Route path="/student/*" element={<StudentDashboard />}>
                  <Route index element={<DashboardHomePage />} />
                  <Route path="join-poll" element={<JoinPollPage />} />
                  <Route path="history" element={<PollHistoryPage />} />
                  <Route
                    path="poll-questions"
                    element={<PollQuestionsPage roomCode="" />}
                  />
                  <Route path="profile" element={<StudentProfilePage />} />
                  <Route path="achievements" element={<AchievementPage />} />
                  <Route path="notifications" element={<NotificationPage />} />
                  <Route path="settings" element={<SettingsStudent />} />
                  <Route path="leaderboard" element={<StudentLeaderboard />} />
                  <Route path="change-password" element={<ChangePassword />} />
                  <Route path="active-sessions" element={<ActiveSessions />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </LoadingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
