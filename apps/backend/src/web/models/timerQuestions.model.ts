import mongoose, { Document, Schema } from 'mongoose';

export interface ITimerQuestion extends Document {
  id: string;
  type: 'MCQ' | 'TRUE_FALSE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  isTimerBased: boolean;
  sourceTranscriptId: mongoose.Types.ObjectId;
  sessionId: string;
  roomId: string;
  hostId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  getFormattedData(): any;
  getTypeLabel(): string;
}

// Interface for static methods
export interface ITimerQuestionModel extends mongoose.Model<ITimerQuestion> {
  findBySession(sessionId: string): Promise<ITimerQuestion[]>;
  findByRoom(roomId: string, limit?: number): Promise<ITimerQuestion[]>;
  findByTranscript(transcriptId: string): Promise<ITimerQuestion[]>;
}

const TimerQuestionSchema = new Schema<ITimerQuestion>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['MCQ', 'TRUE_FALSE'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['EASY', 'MEDIUM', 'HARD'],
    required: true
  },
  question: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500
  },
  options: [{
    type: String,
    maxlength: 200
  }],
  correctAnswer: {
    type: String,
    required: true,
    maxlength: 500
  },
  explanation: {
    type: String,
    required: true,
    maxlength: 1000
  },
  isTimerBased: {
    type: Boolean,
    default: true,
    required: true
  },
  sourceTranscriptId: {
    type: Schema.Types.ObjectId,
    ref: 'WholeTimerTranscript',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  roomId: {
    type: String,
    required: true,
    index: true
  },
  hostId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
TimerQuestionSchema.index({ sessionId: 1, isTimerBased: 1 });
TimerQuestionSchema.index({ roomId: 1, createdAt: -1 });
TimerQuestionSchema.index({ sourceTranscriptId: 1 });

// Virtual for question display
TimerQuestionSchema.virtual('displayType').get(function() {
  switch (this.type) {
    case 'MCQ': return 'Multiple Choice';
    case 'TRUE_FALSE': return 'True/False';
    default: return this.type;
  }
});

// Method to get formatted question data for frontend
TimerQuestionSchema.methods.getFormattedData = function() {
  let correctIndex = undefined;
  
  if (this.type === 'MCQ' && this.options) {
    // For MCQ, find the correct option index
    correctIndex = this.options.findIndex((opt: string) => opt === this.correctAnswer);
  } else if (this.type === 'TRUE_FALSE') {
    // For TRUE/FALSE, calculate index based on correctAnswer
    const normalizedAnswer = this.correctAnswer.toLowerCase();
    if (normalizedAnswer === 'true' || normalizedAnswer === '1') {
      correctIndex = 0; // True is index 0
    } else if (normalizedAnswer === 'false' || normalizedAnswer === '0') {
      correctIndex = 1; // False is index 1
    }
  }
  
  return {
    id: this.id,
    type: this.type,
    difficulty: this.difficulty.toLowerCase(),
    questionText: this.question,
    options: this.options,
    correctAnswer: this.correctAnswer,
    correctIndex: correctIndex,
    explanation: this.explanation,
    points: 1,
    source: 'timer-transcript',
    isTimerBased: this.isTimerBased,
    createdAt: this.createdAt
  };
};

// Static method to find questions by session
TimerQuestionSchema.statics.findBySession = function(sessionId: string) {
  return this.find({ sessionId, isTimerBased: true })
    .sort({ createdAt: -1 })
    .populate('sourceTranscriptId');
};

// Static method to find questions by room
TimerQuestionSchema.statics.findByRoom = function(roomId: string, limit: number = 50) {
  return this.find({ roomId, isTimerBased: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sourceTranscriptId');
};

// Static method to find questions by transcript
TimerQuestionSchema.statics.findByTranscript = function(transcriptId: string) {
  return this.find({ sourceTranscriptId: transcriptId, isTimerBased: true })
    .sort({ createdAt: 1 });
};

export const TimerQuestion = mongoose.model<ITimerQuestion, ITimerQuestionModel>('TimerQuestion', TimerQuestionSchema);
export default TimerQuestion;