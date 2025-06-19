// User Types
export interface User {
  id: string;
  email: string;
  role: 'host' | 'participant';
  displayName?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Meeting Types
export interface Meeting {
  id: string;
  hostId: string;
  title: string;
  description?: string;
  code: string;
  isActive: boolean;
  participants: Participant[];
  polls: Poll[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: string;
  userId: string;
  meetingId: string;
  displayName: string;
  joinedAt: Date;
  isActive: boolean;
  score: number;
  responses: Response[];
}

// Poll Types
export interface Poll {
  id: string;
  meetingId: string;
  question: string;
  options: PollOption[];
  type: 'multiple-choice' | 'true-false' | 'open-ended';
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
  isActive: boolean;
  responses: Response[];
  createdAt: Date;
  endedAt?: Date;
}

export interface PollOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Response {
  id: string;
  pollId: string;
  participantId: string;
  selectedOptionId?: string;
  textResponse?: string;
  isCorrect: boolean;
  responseTime: number;
  submittedAt: Date;
}

// Audio Processing Types
export interface AudioProcessingRequest {
  audioFile: File | Buffer;
  meetingId: string;
  hostId: string;
}

export interface AudioProcessingResponse {
  transcription: string;
  generatedPolls: GeneratedPoll[];
  processingTime: number;
  confidence: number;
}

export interface GeneratedPoll {
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  topic: string;
}

// Socket Event Types
export interface SocketEvents {
  // Meeting Events
  'join-meeting': { meetingCode: string; participant: Participant };
  'leave-meeting': { meetingId: string; participantId: string };
  'meeting-updated': { meeting: Meeting };
  
  // Poll Events
  'poll-created': { poll: Poll };
  'poll-started': { pollId: string };
  'poll-ended': { pollId: string; results: PollResults };
  'poll-response': { response: Response };
  
  // Real-time Updates
  'participant-joined': { participant: Participant };
  'participant-left': { participantId: string };
  'leaderboard-updated': { leaderboard: LeaderboardEntry[] };
}

// Analytics Types
export interface PollResults {
  pollId: string;
  totalResponses: number;
  correctResponses: number;
  averageResponseTime: number;
  optionBreakdown: OptionResult[];
}

export interface OptionResult {
  optionId: string;
  text: string;
  count: number;
  percentage: number;
}

export interface LeaderboardEntry {
  participantId: string;
  displayName: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
  averageResponseTime: number;
  rank: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Configuration Types
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  openai: {
    model: string;
    maxTokens: number;
  };
  socket: {
    url: string;
    options: any;
  };
  features: {
    audioRecording: boolean;
    realTimePolls: boolean;
    analytics: boolean;
  };
}
