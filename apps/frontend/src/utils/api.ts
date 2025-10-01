//frontend/src/utils/api.ts
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
//   baseURL: 'http://localhost:3000',
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// // API endpoints
// export const API_ENDPOINTS = {
//   // Auth endpoints
//   LOGIN: '/api/auth/login',
//   REGISTER: '/api/auth/register',
//   FORGOT_PASSWORD: '/api/auth/forgot-password',
//   RESET_PASSWORD: '/api/auth/reset-password',
  
//   // Poll endpoints
//   POLL_CONFIG: '/api/poll',
//   SAVE_QUESTIONS: '/questions',
  
//   // Settings endpoints
//   SETTINGS: '/settings',
  
//   // Transcript endpoints
//   TRANSCRIPTS: '/transcripts',
//   TRANSCRIPTS_REALTIME: '/transcripts/realtime',
  
//   // WebSocket endpoints
//   WEBSOCKET: 'ws://localhost:3000',
// };

// API service functions
// export const apiService = {
//   // Auth services
//   login: (credentials: { email: string; password: string }) =>
//     api.post(API_ENDPOINTS.LOGIN, credentials),
  
//   register: (userData: { email: string; password: string; name: string }) =>
//     api.post(API_ENDPOINTS.REGISTER, userData),
  
//   forgotPassword: (email: string) =>
//     api.post(API_ENDPOINTS.FORGOT_PASSWORD, { email }),
  
//   resetPassword: (token: string, password: string) =>
//     api.post(`${API_ENDPOINTS.RESET_PASSWORD}/${token}`, { password }),
  
//   // Poll services
//   getPollConfig: () => api.get(API_ENDPOINTS.POLL_CONFIG),
  
//   createPollConfig: (config: any) => api.post(API_ENDPOINTS.POLL_CONFIG, config),
  
//   updatePollConfig: (id: string, config: any) => 
//     api.put(`${API_ENDPOINTS.POLL_CONFIG}/${id}`, config),
  
//   deletePollConfig: (id: string) => 
//     api.delete(`${API_ENDPOINTS.POLL_CONFIG}/${id}`),
  
//   saveQuestions: (questions: any) => 
//     api.post(API_ENDPOINTS.SAVE_QUESTIONS, questions),
  
//   // Settings services
//   getSettings: () => api.get(API_ENDPOINTS.SETTINGS),
  
//   updateSettings: (settings: any) => 
//     api.post(API_ENDPOINTS.SETTINGS, settings),
  
//   // Transcript services
//   getTranscripts: () => api.get(API_ENDPOINTS.TRANSCRIPTS),
  
//   getRealtimeTranscripts: () => api.get(API_ENDPOINTS.TRANSCRIPTS_REALTIME),
  
//   updateRealtimeTranscripts: (transcripts: any) => 
//     api.post(API_ENDPOINTS.TRANSCRIPTS_REALTIME, transcripts),
  
//   // Room services
//   // createOrGetRoom: (name: string, hostId?: string, hostName?: string) =>
//   //   api.post('/api/room', { name, hostId, hostName }),
//   // destroyRoom: (hostId: string) =>
//   //   api.delete('/api/room', { params: { hostId } }),
//   // getCurrentRoom: (hostId: string) =>
//   //   api.get('/api/room', { params: { hostId } }),
//   // joinRoomByCode: (code: string) =>
//   //   api.get(`/api/room/${code}`),
//   // joinRoom: (code: string, participantId: string, participantName?: string) =>
//   //   api.post(`/api/room/${code}/join`, { participantId, participantName }),
//   // leaveRoom: (code: string, participantId: string) =>
//   //   api.post(`/api/room/${code}/leave`, { participantId }),
//   // getActiveRooms: () =>
//   //   api.get('/api/rooms'),
//    // Polls
//     createPoll: (data: any) => api.post('/polls', data),
//     getHostPolls: () => api.get('/polls'),
//     // Rooms
//         getActiveRoom: () => api.get('/rooms/current'), // You'll need to create this route on the backend

//     createRoom: (data: { name: string }) => api.post('/rooms', data),
//     sendInvites: (roomId: string, formData: FormData) => api.post(`/rooms/${roomId}/invite`, formData),
//     getRoomByCode: (code: string) => api.get(`/rooms/${code}`),
//       getRoomById: (roomId: string) => api.get(`/rooms/${roomId}`), // You need a new backend route for this
//     // Reports
//      getLiveParticipants: (roomId: string) => api.get(`/rooms/${roomId}/participants`),
//     getSessionReport: (reportId: string) => api.get(`/session-reports/${reportId}`),
//     getReportForSession: (sessionId: string) => api.get(`/session-reports/session/${sessionId}`), // To get final results
//     getLeaderboard: (roomId?: string) => api.get(`/reports/leaderboard/${roomId || ''}`),
// };

// export default api; 

export const apiService = {
  // --- NEW: Auth services now use the axios instance ---
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: { fullName: string; email: string; password: string; role: 'host' | 'student' }) =>
    api.post('/auth/register', userData),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  // User profile services
  updateProfile: (profileData: { fullName: string; bio: string }) =>
    api.put('/users/profile', profileData),

  uploadAvatar: (formData: FormData) =>
    api.post('/users/profile/avatar', formData),

  // Polls
  createPoll: (data: any) => api.post('/polls', data),
  getHostPolls: (sessionId: string) => api.get(`/polls?sessionId=${sessionId}`),

  // Rooms
  createRoom: (data: { name: string }) => api.post('/rooms', data),
  getActiveRoom: () => api.get('/rooms/current'),
  getRoomByCode: (code: string) => api.get(`/rooms/${code}`),
  getRoomById: (roomId: string) => api.get(`/rooms/${roomId}`), // For verifying stored room
  sendInvites: (roomId: string, formData: FormData) => api.post(`/rooms/${roomId}/invite`, formData),
  getLiveParticipants: (roomId: string) => api.get(`/rooms/${roomId}/participants`),
// getHostSessionReports: () => axios.get('/api/reports/host-sessions'),
  // Reports
  getReportForSession: (sessionId: string) => api.get(`/session-reports/session/${sessionId}`),
   // --- ADD THESE TWO LINES FOR THE HOST ---
  getHostSessionReports: () => api.get('/session-reports'), // Gets the list of reports
  getSessionReportById: (reportId: string) => api.get(`/session-reports/${reportId}`), // Gets a single detailed report

  // Transcripts (ASR)
  getTranscriptsByMeeting: (meetingId: string, params?: { type?: 'partial' | 'final', role?: 'host' | 'participant', participantId?: string }) => 
    api.get(`/transcripts/${meetingId}`, { params }),
  getFullTranscript: (meetingId: string) => api.get(`/transcripts/${meetingId}/full`),
  exportTranscript: (meetingId: string) => api.get(`/transcripts/${meetingId}/export`, { responseType: 'blob' }),
  getTranscriptStats: (meetingId: string) => api.get(`/transcripts/${meetingId}/stats`),
  deleteTranscripts: (meetingId: string) => api.delete(`/transcripts/${meetingId}`),
  
  // ... any other services you have ...
};

export default api;