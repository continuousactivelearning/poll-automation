// Safe transcript capture hook - prevents infinite loops
import { useEffect, useRef } from 'react';
import { LocalTranscriptManager, type LocalTranscript } from '../utils/localTranscripts';
import { TranscriptSyncService } from '../utils/transcriptSync';

export const useTranscriptCapture = (meetingId: string, enabled: boolean = true) => {
  const transcriptManager = LocalTranscriptManager.getInstance();
  const syncService = TranscriptSyncService.getInstance();
  const isCapturingRef = useRef(false); // Prevent infinite loops

  // Auto-capture console logs that look like transcripts
  useEffect(() => {
    if (!enabled) return;

    // Store reference to current console.log
    const originalConsoleLog = console.log;
    
    // Create safe capture function
    const captureConsoleLog = (...args: any[]) => {
      // Always call original first
      originalConsoleLog.apply(console, args);
      
      // Prevent infinite loops
      if (isCapturingRef.current) return;
      
      try {
        isCapturingRef.current = true;
        
        // Simple detection: first arg contains AUDIOCAPTURE, second arg is transcript object
        const firstArg = String(args[0] || '');
        const secondArg = args[1];
        
        if (firstArg.includes('[AUDIOCAPTURE]') && 
            firstArg.includes('Received transcript:') &&
            secondArg && 
            typeof secondArg === 'object' &&
            secondArg.text && 
            secondArg.meetingId && 
            secondArg.type === 'final') {
          
          const actualMeetingId = secondArg.meetingId || 'test-room-id';
          const transcript: Omit<LocalTranscript, 'id'> = {
            text: String(secondArg.text).trim(),
            timestamp: secondArg.timestamp || Date.now(),
            speaker: secondArg.role === 'host' ? 'host' : 'guest',
            participantId: secondArg.participantId || `${secondArg.role}-${Date.now()}`,
            meetingId: actualMeetingId,
            confidence: secondArg.confidence || 0.9
          };

          // Save transcript
          transcriptManager.addTranscript(transcript);
          
          // Sync to backend
          const fullTranscript: LocalTranscript = {
            ...transcript,
            id: `transcript-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };

          syncService.syncTranscript(fullTranscript).catch(() => {
            // Silent fail
          });
        }
      } catch (error) {
        // Silent catch
      } finally {
        isCapturingRef.current = false;
      }
    };

    // Replace console.log
    console.log = captureConsoleLog;

    return () => {
      // Restore original console.log
      console.log = originalConsoleLog;
      isCapturingRef.current = false;
    };
  }, [enabled, meetingId, transcriptManager, syncService]);

  return {
    addTranscript: (transcript: Omit<LocalTranscript, 'id'>) => transcriptManager.addTranscript(transcript),
    getTranscripts: () => transcriptManager.getTranscripts(meetingId),
    clearTranscripts: () => transcriptManager.clearTranscripts(meetingId),
    getTranscriptSummary: () => transcriptManager.getTranscriptSummary(meetingId),
    getQuestionCapability: () => {
      const summary = transcriptManager.getTranscriptSummary(meetingId);
      return transcriptManager.getQuestionCapability(summary);
    },
    isReadyForAI: () => transcriptManager.isReadyForAI(meetingId),
    transcriptCount: transcriptManager.getTranscriptCount(meetingId)
  };
};