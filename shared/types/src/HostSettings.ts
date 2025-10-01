export interface HostSettings {
  questionSource: 'gemini' | 'ollama';
  questionFrequency: number;
  numberOfQuestions: number;
  questionType: 'mcq' | 'true_false' | 'opinion';
  contextualRange: 'last_5' | 'last_30' | 'entire' | 'custom';
  customRange?: number;
  breakIntervals: Array<{ start: string; end: string }>;
  manualReview: boolean;
  pollVisibility: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isGenerating: boolean;
}