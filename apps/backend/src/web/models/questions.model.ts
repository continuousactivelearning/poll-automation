import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface IQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  options?: IQuestionOption[]; // For multiple choice and true/false
  correctIndex?: number; // For multiple choice questions
  correctAnswer?: string; // For short answer questions
  explanation: string;
  points?: number;
  category?: string;
  tags?: string[];
}

export interface IQuestionConfig {
  numQuestions: number;
  types: string[];
  difficulty: string[];
  contextLimit: number;
  includeExplanations: boolean;
  pointsPerQuestion?: number;
}

export interface IGeneratedQuestions extends Document {
  meetingId: string;
  hostId: string;
  generatedAt: Date;
  config: IQuestionConfig;
  questions: IQuestion[];
  summary: string; // AI-generated summary of the question set
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  transcriptSource: {
    totalWords: number;
    sourceLength: number;
    summarized: boolean;
    originalLength?: number;
  };
  geminiMetadata: {
    model: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    processingTime: number; // in milliseconds
  };
  publishedTo?: string[]; // Array of student/participant IDs who received the questions
  createdAt: Date;
  updatedAt: Date;
}

const QuestionOptionSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true,
    default: false
  }
}, { _id: false });

const QuestionSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'short_answer', 'essay'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  options: [QuestionOptionSchema],
  correctIndex: {
    type: Number,
    required: false,
    min: 0
  },
  correctAnswer: {
    type: String,
    required: false
  },
  explanation: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: false,
    default: 1,
    min: 0
  },
  category: {
    type: String,
    required: false
  },
  tags: [{
    type: String
  }]
}, { _id: false });

const QuestionConfigSchema = new Schema({
  numQuestions: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  types: [{
    type: String,
    enum: ['multiple_choice', 'true_false', 'short_answer', 'essay'],
    required: true
  }],
  difficulty: [{
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  }],
  contextLimit: {
    type: Number,
    required: true,
    default: 5000,
    min: 100
  },
  includeExplanations: {
    type: Boolean,
    required: true,
    default: true
  },
  pointsPerQuestion: {
    type: Number,
    required: false,
    default: 1,
    min: 1
  }
}, { _id: false });

const GeneratedQuestionsSchema: Schema = new Schema({
  meetingId: {
    type: String,
    required: true,
    index: true
  },
  hostId: {
    type: String,
    required: true,
    index: true
  },
  generatedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  config: {
    type: QuestionConfigSchema,
    required: true
  },
  questions: [QuestionSchema],
  summary: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    required: true,
    default: 'draft',
    index: true
  },
  publishedAt: {
    type: Date,
    required: false
  },
  transcriptSource: {
    totalWords: {
      type: Number,
      required: true,
      min: 0
    },
    sourceLength: {
      type: Number,
      required: true,
      min: 0
    },
    summarized: {
      type: Boolean,
      required: true,
      default: false
    },
    originalLength: {
      type: Number,
      required: false
    }
  },
  geminiMetadata: {
    model: {
      type: String,
      required: true,
      default: 'gemini-pro'
    },
    promptTokens: {
      type: Number,
      required: false
    },
    completionTokens: {
      type: Number,
      required: false
    },
    totalTokens: {
      type: Number,
      required: false
    },
    processingTime: {
      type: Number,
      required: true,
      min: 0
    }
  },
  publishedTo: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
GeneratedQuestionsSchema.index({ meetingId: 1, status: 1 });
GeneratedQuestionsSchema.index({ hostId: 1, generatedAt: -1 });
GeneratedQuestionsSchema.index({ status: 1, generatedAt: -1 });
GeneratedQuestionsSchema.index({ publishedAt: -1 });

export const GeneratedQuestions = mongoose.model<IGeneratedQuestions>('GeneratedQuestions', GeneratedQuestionsSchema);