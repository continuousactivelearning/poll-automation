// Main export file for @pollgen-ai/shared package

// Export all types
export * from './types';

// Export all utilities
export * from './utils';

// Export all constants
export * from './constants';

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
