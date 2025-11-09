// Local transcript storage utility
export interface LocalTranscript {
  id: string;
  text: string;
  timestamp: number;
  speaker: 'host' | 'guest';
  participantId: string;
  meetingId: string;
  confidence?: number;
}

export interface LocalTranscriptSummary {
  totalRecords: number;
  totalWords: number;
  totalDuration: number;
  uniqueParticipants: number;
  averageWordsPerMinute: number;
  fullTextLength: number;
  readyForAI: boolean;
  fullText: string;
}

export interface QuestionCapability {
  minQuestions: number;
  maxQuestions: number;
  recommendedQuestions: number;
  confidence: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
}

const TRANSCRIPT_STORAGE_KEY = 'ai-questions-transcripts';

export class LocalTranscriptManager {
  private static instance: LocalTranscriptManager;
  
  static getInstance(): LocalTranscriptManager {
    if (!this.instance) {
      this.instance = new LocalTranscriptManager();
    }
    return this.instance;
  }

  // Save transcript to local storage
  addTranscript(transcript: Omit<LocalTranscript, 'id'>): void {
    try {
      const transcripts = this.getTranscripts();
      const newTranscript: LocalTranscript = {
        ...transcript,
        id: `transcript-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      transcripts.push(newTranscript);
      localStorage.setItem(TRANSCRIPT_STORAGE_KEY, JSON.stringify(transcripts));
      
      console.log(`💾 [LOCAL STORAGE] Saved transcript: "${transcript.text.substring(0, 50)}..."`);
    } catch (error) {
      console.error('❌ Error saving transcript to local storage:', error);
    }
  }

  // Get all transcripts from local storage
  getTranscripts(meetingId?: string): LocalTranscript[] {
    try {
      const stored = localStorage.getItem(TRANSCRIPT_STORAGE_KEY);
      const transcripts: LocalTranscript[] = stored ? JSON.parse(stored) : [];
      
      if (meetingId) {
        return transcripts.filter(t => t.meetingId === meetingId);
      }
      
      return transcripts;
    } catch (error) {
      console.error('❌ Error reading transcripts from local storage:', error);
      return [];
    }
  }

  // Clear all transcripts
  clearTranscripts(meetingId?: string): void {
    try {
      if (meetingId) {
        const transcripts = this.getTranscripts();
        const filtered = transcripts.filter(t => t.meetingId !== meetingId);
        localStorage.setItem(TRANSCRIPT_STORAGE_KEY, JSON.stringify(filtered));
        console.log(`🗑️ [LOCAL STORAGE] Cleared transcripts for meeting: ${meetingId}`);
      } else {
        localStorage.removeItem(TRANSCRIPT_STORAGE_KEY);
        console.log('🗑️ [LOCAL STORAGE] Cleared all transcripts');
      }
    } catch (error) {
      console.error('❌ Error clearing transcripts from local storage:', error);
    }
  }

  // Generate transcript summary
  getTranscriptSummary(meetingId: string): LocalTranscriptSummary {
    const transcripts = this.getTranscripts(meetingId);
    
    if (transcripts.length === 0) {
      return {
        totalRecords: 0,
        totalWords: 0,
        totalDuration: 0,
        uniqueParticipants: 0,
        averageWordsPerMinute: 0,
        fullTextLength: 0,
        readyForAI: false,
        fullText: ''
      };
    }

    // Sort by timestamp
    const sortedTranscripts = transcripts.sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate metrics
    const fullText = sortedTranscripts.map(t => t.text).join(' ');
    const totalWords = fullText.split(/\s+/).filter(word => word.length > 0).length;
    const uniqueParticipants = new Set(sortedTranscripts.map(t => t.participantId)).size;
    
    // Calculate duration (from first to last transcript)
    const firstTimestamp = sortedTranscripts[0].timestamp;
    const lastTimestamp = sortedTranscripts[sortedTranscripts.length - 1].timestamp;
    const totalDuration = lastTimestamp - firstTimestamp;
    
    // Calculate words per minute
    const durationMinutes = totalDuration / (1000 * 60);
    const averageWordsPerMinute = durationMinutes > 0 ? Math.round(totalWords / durationMinutes) : 0;

    return {
      totalRecords: transcripts.length,
      totalWords,
      totalDuration,
      uniqueParticipants,
      averageWordsPerMinute,
      fullTextLength: fullText.length,
      readyForAI: totalWords >= 10, // Need at least 10 words for AI processing
      fullText
    };
  }

  // Calculate question generation capability
  getQuestionCapability(summary: LocalTranscriptSummary): QuestionCapability {
    const { totalWords } = summary;

    if (totalWords < 20) {
      return {
        minQuestions: 1,
        maxQuestions: 2,
        recommendedQuestions: 1,
        confidence: 'very-low'
      };
    } else if (totalWords < 50) {
      return {
        minQuestions: 1,
        maxQuestions: 3,
        recommendedQuestions: 2,
        confidence: 'low'
      };
    } else if (totalWords < 100) {
      return {
        minQuestions: 2,
        maxQuestions: 5,
        recommendedQuestions: 3,
        confidence: 'medium'
      };
    } else if (totalWords < 200) {
      return {
        minQuestions: 3,
        maxQuestions: 8,
        recommendedQuestions: 5,
        confidence: 'high'
      };
    } else {
      return {
        minQuestions: 5,
        maxQuestions: 12,
        recommendedQuestions: 8,
        confidence: 'very-high'
      };
    }
  }

  // Get transcript count for UI display
  getTranscriptCount(meetingId: string): number {
    return this.getTranscripts(meetingId).length;
  }

  // Check if transcripts are ready for AI processing
  isReadyForAI(meetingId: string): boolean {
    const summary = this.getTranscriptSummary(meetingId);
    return summary.readyForAI;
  }
}