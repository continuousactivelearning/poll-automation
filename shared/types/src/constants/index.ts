// Application Constants

export const APP_CONFIG = {
  NAME: 'PollGen AI',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-powered educational platform for intelligent poll generation',
  
  // API Configuration
  API: {
    BASE_URL: process.env.NODE_ENV === 'production' 
      ? 'https://api.pollgen-ai.com' 
      : 'http://localhost:5000',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
  },
  
  // Socket Configuration
  SOCKET: {
    URL: process.env.NODE_ENV === 'production' 
      ? 'wss://api.pollgen-ai.com' 
      : 'ws://localhost:5000',
    RECONNECTION_ATTEMPTS: 5,
    RECONNECTION_DELAY: 1000,
  },
  
  // OpenAI Configuration
  OPENAI: {
    MODEL: 'gpt-3.5-turbo',
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7,
    WHISPER_MODEL: 'whisper-1',
  },
  
  // Audio Configuration
  AUDIO: {
    MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
    SUPPORTED_FORMATS: ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/webm'],
    MAX_DURATION: 300, // 5 minutes in seconds
    SAMPLE_RATE: 16000,
  },
  
  // Poll Configuration
  POLL: {
    MAX_OPTIONS: 6,
    MIN_OPTIONS: 2,
    MAX_QUESTION_LENGTH: 500,
    MAX_OPTION_LENGTH: 200,
    DEFAULT_TIME_LIMIT: 30, // seconds
    MAX_TIME_LIMIT: 300, // 5 minutes
  },
  
  // Meeting Configuration
  MEETING: {
    CODE_LENGTH: 6,
    MAX_PARTICIPANTS: 100,
    MAX_DURATION: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
    INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  },
  
  // UI Configuration
  UI: {
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 5000,
    PAGINATION_SIZE: 20,
  },
  
  // Scoring Configuration
  SCORING: {
    CORRECT_ANSWER_BASE: 100,
    SPEED_BONUS_MAX: 50,
    DIFFICULTY_MULTIPLIER: {
      easy: 1,
      medium: 1.5,
      hard: 2,
    },
    STREAK_BONUS: 10,
  },
};

// Socket Event Names
export const SOCKET_EVENTS = {
  // Connection Events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  
  // Meeting Events
  JOIN_MEETING: 'join-meeting',
  LEAVE_MEETING: 'leave-meeting',
  MEETING_UPDATED: 'meeting-updated',
  PARTICIPANT_JOINED: 'participant-joined',
  PARTICIPANT_LEFT: 'participant-left',
  
  // Poll Events
  POLL_CREATED: 'poll-created',
  POLL_STARTED: 'poll-started',
  POLL_ENDED: 'poll-ended',
  POLL_RESPONSE: 'poll-response',
  POLL_RESULTS: 'poll-results',
  
  // Real-time Updates
  LEADERBOARD_UPDATED: 'leaderboard-updated',
  STATS_UPDATED: 'stats-updated',
  NOTIFICATION: 'notification',
  
  // Audio Events
  AUDIO_PROCESSING_START: 'audio-processing-start',
  AUDIO_PROCESSING_COMPLETE: 'audio-processing-complete',
  AUDIO_PROCESSING_ERROR: 'audio-processing-error',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
  },
  
  // Meetings
  MEETINGS: {
    BASE: '/api/meetings',
    CREATE: '/api/meetings',
    JOIN: '/api/meetings/join',
    LEAVE: '/api/meetings/leave',
    BY_CODE: (code: string) => `/api/meetings/code/${code}`,
    BY_ID: (id: string) => `/api/meetings/${id}`,
    PARTICIPANTS: (id: string) => `/api/meetings/${id}/participants`,
  },
  
  // Polls
  POLLS: {
    BASE: '/api/polls',
    CREATE: '/api/polls',
    BY_ID: (id: string) => `/api/polls/${id}`,
    RESPOND: (id: string) => `/api/polls/${id}/respond`,
    RESULTS: (id: string) => `/api/polls/${id}/results`,
    BY_MEETING: (meetingId: string) => `/api/meetings/${meetingId}/polls`,
  },
  
  // Audio Processing
  AUDIO: {
    UPLOAD: '/api/audio/upload',
    PROCESS: '/api/audio/process',
    TRANSCRIBE: '/api/audio/transcribe',
    GENERATE_POLLS: '/api/audio/generate-polls',
  },
  
  // Analytics
  ANALYTICS: {
    MEETING_STATS: (id: string) => `/api/analytics/meetings/${id}`,
    PARTICIPANT_STATS: (id: string) => `/api/analytics/participants/${id}`,
    LEADERBOARD: (meetingId: string) => `/api/analytics/leaderboard/${meetingId}`,
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
  AUDIO_TOO_LARGE: 'Audio file is too large. Maximum size is 25MB.',
  AUDIO_INVALID_FORMAT: 'Invalid audio format. Supported formats: WAV, MP3, M4A, WebM.',
  MEETING_NOT_FOUND: 'Meeting not found. Please check the meeting code.',
  MEETING_FULL: 'Meeting is full. Maximum participants reached.',
  POLL_EXPIRED: 'This poll has expired.',
  INVALID_RESPONSE: 'Invalid poll response.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  MEETING_CREATED: 'Meeting created successfully!',
  MEETING_JOINED: 'Successfully joined the meeting!',
  POLL_CREATED: 'Poll created successfully!',
  RESPONSE_SUBMITTED: 'Your response has been submitted!',
  AUDIO_PROCESSED: 'Audio processed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const;

// User Roles
export const USER_ROLES = {
  HOST: 'host',
  PARTICIPANT: 'participant',
} as const;

// Poll Types
export const POLL_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
  OPEN_ENDED: 'open-ended',
} as const;

// Poll Difficulties
export const POLL_DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  SUCCESS: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  WARNING: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  ERROR: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
} as const;
