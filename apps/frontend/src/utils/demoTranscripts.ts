// Demo transcript injector for testing local storage functionality
import { LocalTranscriptManager } from '../utils/localTranscripts';

export const injectDemoTranscripts = (meetingId: string) => {
  const transcriptManager = LocalTranscriptManager.getInstance();
  
  // Clear existing transcripts first
  transcriptManager.clearTranscripts(meetingId);
  
  // Sample transcripts that would typically come from voice recording
  const demoTranscripts = [
    "Hello everyone, welcome to today's meeting about artificial intelligence and machine learning",
    "Today we will discuss the latest developments in neural networks and deep learning algorithms",
    "Artificial intelligence motions are very important in modern technology applications",
    "Machine learning models require proper training data and validation techniques",
    "We need to explore how AI can improve our business processes and decision making",
    "Natural language processing is becoming more sophisticated with transformer models",
    "Computer vision applications are expanding rapidly in various industries",
    "The impact of AI on our daily lives is becoming more significant every day",
    "We should consider the ethical implications of artificial intelligence development",
    "Let's discuss the implementation challenges and potential solutions for our AI project"
  ];
  
  // Inject demo transcripts with realistic timing
  demoTranscripts.forEach((text, index) => {
    const baseTime = Date.now() - (demoTranscripts.length - index) * 30000; // 30 seconds apart
    
    transcriptManager.addTranscript({
      text,
      timestamp: baseTime,
      speaker: index % 3 === 0 ? 'host' : 'guest',
      participantId: index % 3 === 0 ? `host-${index}` : `guest-${index}`,
      meetingId,
      confidence: 0.85 + (Math.random() * 0.15) // Random confidence between 0.85-1.0
    });
  });
  
  console.log(`🎭 [DEMO] Injected ${demoTranscripts.length} demo transcripts for meeting: ${meetingId}`);
  
  // Trigger a custom event to notify components
  window.dispatchEvent(new CustomEvent('transcripts-updated', {
    detail: { meetingId, count: demoTranscripts.length }
  }));
  
  return demoTranscripts.length;
};

// Function to simulate real-time transcript capture
export const simulateTranscriptCapture = (meetingId: string, text: string, speaker: 'host' | 'guest' = 'host') => {
  const transcriptManager = LocalTranscriptManager.getInstance();
  
  transcriptManager.addTranscript({
    text,
    timestamp: Date.now(),
    speaker,
    participantId: `${speaker}-${Date.now()}`,
    meetingId,
    confidence: 0.9
  });
  
  console.log(`🎤 [SIMULATED] Captured transcript: "${text.substring(0, 50)}..."`);
  
  // Trigger update event
  window.dispatchEvent(new CustomEvent('transcript-captured', {
    detail: { text, speaker, timestamp: Date.now() }
  }));
};

// Global functions for console testing
if (typeof window !== 'undefined') {
  // Make functions available globally for console testing
  (window as any).injectDemoTranscripts = injectDemoTranscripts;
  (window as any).simulateTranscriptCapture = simulateTranscriptCapture;
  (window as any).clearTranscripts = (meetingId: string) => {
    const transcriptManager = LocalTranscriptManager.getInstance();
    transcriptManager.clearTranscripts(meetingId);
    console.log(`🗑️ [DEMO] Cleared transcripts for meeting: ${meetingId}`);
  };
}