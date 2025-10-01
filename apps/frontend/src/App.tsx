// apps/frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoadingProvider } from './contexts/LoadingContext';
import AuthGuard from './components/AuthGuard';
import LoadingScreen from './components/LoadingScreen';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
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
import ResetPasswordPage from './pages/ResetPasswordPage';


// Student dashboard section imports
import JoinPollPage from './components/student/JoinPollPage';
import PollHistoryPage from './components/student/PollHistoryPage';
import PollQuestionsPage from './components/student/PollQuestionsPage';
import StudentProfilePage from './components/student/StudentProfilePage';
import AchievementPage from './components/student/AchievementPage';
import NotificationPage from './components/student/NotificationPage';
import SettingsStudent from './components/student/Settings';
import StudentLeaderboard from './components/student/StudentLeaderboard';
import DashboardHomePage from './components/student/DashboardHomePage';
import ActiveSessions from './components/student/ActiveSessions';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LoadingProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
              <LoadingScreen />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/contactUs" element={<ContactUs />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                {/* Host Dashboard Routes */}
                <Route path="/host" element={
                    <HostDashboard />
                } />
                <Route path="/host/audio" element={
                    <AudioCapture />
                } />
                <Route path="/host/ai-questions" element={
                    <AIQuestionFeed />
                } />
                <Route path="/host/create-manual-poll" element={
                    <CreateManualPoll />
                } />
                <Route path="/host/create-poll" element={
                    <CreatePollPage />
                } />
             <Route path="/host/participants" element={
                    <AuthGuard >
                        <Participants />
                    </AuthGuard>
                } />

           
                <Route path="/host/leaderboard" element={
                    <Leaderboard />
                } />
                <Route path="/host/reports" element={
                    <Reports />
                } />
                <Route path="/host/settings" element={
                    <Settings />
                } />
                <Route path="/guest" element={
                  <GuestPage />
                  } />

      {/* Student Dashboard Routes */}
      <Route path="/student/*" element={<StudentDashboard />}>
        <Route index element={<DashboardHomePage />} />
        <Route path="join-poll" element={<JoinPollPage />} />
        <Route path="history" element={<PollHistoryPage />} />
        <Route path="poll-questions" element={<PollQuestionsPage />} />
            

        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="achievements" element={<AchievementPage />} />
        <Route path="notifications" element={<NotificationPage />} />
        <Route path="settings" element={<SettingsStudent />} />
        <Route path="leaderboard" element={<StudentLeaderboard />} />
        {/* <Route path="change-password" element={<ChangePassword />} />
        <Route path="active-sessions" element={<ActiveSessions />} /> */}
      </Route>
    </Routes>
            </div>
          </Router>
        </LoadingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

// // App.tsx
// import React from 'react';
// // --- MODIFICATION: Removed 'BrowserRouter as Router' to avoid aliasing ---
// import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import { AuthProvider } from './contexts/AuthContext';
// import { ThemeProvider } from './contexts/ThemeContext';
// import { LoadingProvider } from './contexts/LoadingContext';
// import LoadingScreen from './components/LoadingScreen';

// // --- NEW IMPORT: The gatekeeper component ---
// import ProtectedRoute from './components/ProtectedRoute';
// import PublicRoute from './components/PublicRoute'; // <-- NEW

// // --- Pages (no change here) ---
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
// import ForgotPasswordPage from './pages/ForgotPasswordPage';
// import HostDashboard from './pages/HostDashboard';
// import StudentDashboard from './pages/StudentDashboard';
// import AudioCapture from './pages/AudioCapture';
// import AIQuestionFeed from './pages/AIQuestionFeed';
// import Participants from './pages/Participants';
// import Leaderboard from './pages/Leaderboard';
// import Reports from './pages/Reports';
// import Settings from './pages/Settings';
// import HomePage from './pages/HomePage';
// import CreateManualPoll from './pages/CreateManualPoll';
// import CreatePollPage from './pages/CreatePollPage';
// import ContactUs from './pages/ContactUs';
// import GuestPage from './pages/guest/GuestPage';
// import ResetPasswordPage from './pages/ResetPasswordPage';

// // Student dashboard section imports (no change here)
// import JoinPollPage from './components/student/JoinPollPage';
// import PollHistoryPage from './components/student/PollHistoryPage';
// import PollQuestionsPage from './components/student/PollQuestionsPage';
// import StudentProfilePage from './components/student/StudentProfilePage';
// import AchievementPage from './components/student/AchievementPage';
// import NotificationPage from './components/student/NotificationPage';
// import SettingsStudent from './components/student/Settings';
// import StudentLeaderboard from './components/student/StudentLeaderboard';
// import DashboardHomePage from './components/student/DashboardHomePage';


// function App() {
//   return (
//     <ThemeProvider>
//       <AuthProvider>
//         <LoadingProvider>
//           {/* --- MODIFICATION: Using BrowserRouter directly --- */}
//           <BrowserRouter>
//             <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
//               <LoadingScreen />
//               <Routes>
//                 {/* =================================== */}
//                 {/*      1. PUBLIC ROUTES               */}
//                 {/* These can be accessed by anyone.    */}
//                 {/* =================================== */}
//                 <Route path="/login" element={
//                   <PublicRoute>
//                     <LoginPage />
//                   </PublicRoute>
//                 } />
//                 <Route path="/register" element={
//                   <PublicRoute>
//                     <RegisterPage />
//                   </PublicRoute>
//                 } />
//                 <Route path="/forgot-password" element={
//                   <PublicRoute>
//                     <ForgotPasswordPage />
//                   </PublicRoute>
//                 } />
//                 <Route path="/reset-password/:token" element={
//                   <PublicRoute>
//                     <ResetPasswordPage />
//                   </PublicRoute>
//                 } />
//     {/* General public pages that anyone can see */}
//                 <Route path="/contactUs" element={<ContactUs />} />
//                 <Route path="/guest" element={<GuestPage />} />

//                 {/* =================================== */}
//                 {/*      2. PROTECTED HOST ROUTES       */}
//                 {/* User must be logged in as a 'host'. */}
//                 {/* =================================== */}
//                 <Route path="/host" element={
//                   <ProtectedRoute allowedRoles={['host']}>
//                     <HostDashboard />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/host/audio" element={
//                   <ProtectedRoute allowedRoles={['host']}>
//                     <AudioCapture />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/host/ai-questions" element={
//                   <ProtectedRoute allowedRoles={['host']}>
//                     <AIQuestionFeed />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/host/create-manual-poll" element={
//                   <ProtectedRoute allowedRoles={['host']}>
//                     <CreateManualPoll />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/host/create-poll" element={
//                   <ProtectedRoute allowedRoles={['host']}>
//                     <CreatePollPage />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/host/participants" element={
//                   <ProtectedRoute allowedRoles={['host']}>
//                     <Participants />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/host/leaderboard" element={
//                   <ProtectedRoute allowedRoles={['host']}>
//                     <Leaderboard />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/host/reports" element={
//                   <ProtectedRoute allowedRoles={['host']}>
//                     <Reports />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/host/settings" element={
//                   <ProtectedRoute allowedRoles={['host']}>
//                     <Settings />
//                   </ProtectedRoute>
//                 } />


//                 {/* ===================================== */}
//                 {/*      3. PROTECTED STUDENT ROUTES      */}
//                 {/* User must be logged in as a 'student' */}
//                 {/* ===================================== */}
//                 <Route path="/student" element={
//                   <ProtectedRoute allowedRoles={['student']}>
//                     <StudentDashboard />
//                   </ProtectedRoute>
//                 }>
//                   {/* These are nested routes. The parent /student route is protected,
//                       so all these children are automatically protected as well. */}
//                   <Route index element={<DashboardHomePage />} />
//                   <Route path="join-poll" element={<JoinPollPage />} />
//                   <Route path="history" element={<PollHistoryPage />} />
//                   <Route path="poll-questions" element={<PollQuestionsPage />} />
//                   <Route path="profile" element={<StudentProfilePage />} />
//                   <Route path="achievements" element={<AchievementPage />} />
//                   <Route path="notifications" element={<NotificationPage />} />
//                   <Route path="settings" element={<SettingsStudent />} />
//                   <Route path="leaderboard" element={<StudentLeaderboard />} />
//                 </Route>
//                   {/*      3. The HOMEPAGE Route (Special Case)               */}
//                 {/* ======================================================= */}
//                 <Route path="/" element={<HomePage />} />
//               </Routes>
//             </div>
//           </BrowserRouter>
//         </LoadingProvider>
//       </AuthProvider>
//     </ThemeProvider>
//   );
// }

// export default App;