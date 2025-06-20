// Main export file for @poll-automation/shared package

// Export all types
export * from './types';

// Export all utilities
export * from './utils';

// Export all constants
export * from './constants';

// Export new types from upstream
export type WhisperResult = { text: string; confidence: number };
export type AudioChunk = { data: Buffer; timestamp: number };
export type TranscriptionResult = { transcript: string; confidence: number };
export type SomeType = any; // Replace with your actual type
// export * from './websocket'; // Temporarily commented out until websocket module is created
export * from './HostSettings';

// Re-export commonly used items for convenience
export type {
  User,
  Meeting,
  Poll,
  Response,
  Participant,
  AudioProcessingRequest,
  AudioProcessingResponse,
  GeneratedPoll,
  SocketEvents,
  ApiResponse,
  PaginatedResponse,
  LeaderboardEntry,
  PollResults,
} from './types';

export {
  generateMeetingCode,
  calculateAccuracy,
  formatDuration,
  formatResponseTime,
  isValidEmail,
  isValidMeetingCode,
  generateId,
  debounce,
  throttle,
  sortLeaderboard,
  calculatePollStats,
} from './utils';

export {
  APP_CONFIG,
  SOCKET_EVENTS,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  USER_ROLES,
  POLL_TYPES,
  POLL_DIFFICULTIES,
} from './constants';
