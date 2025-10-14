import { useEffect, useCallback } from 'react';
import { LocalTranscriptManager } from '../utils/localTranscripts';
import { TranscriptSyncService } from '../utils/transcriptSync';
import type { LocalTranscript } from '../utils/localTranscripts';

export interface TranscriptEvent {
  text: string;
  speaker: 'host' | 'guest';
  participantId?: string;
  timestamp?: number;
  confidence?: number;
}

export const useTranscriptCapture = (meetingId: string, enabled: boolean = true) => {
  const transcriptManager = LocalTranscriptManager.getInstance();
  const syncService = TranscriptSyncService.getInstance();

  // Function to manually add transcript (for console-based transcripts)
  const addTranscript = useCallback(async (event: TranscriptEvent) => {
    if (!enabled) return;

    const transcript: Omit<LocalTranscript, 'id'> = {
      text: event.text.trim(),
      timestamp: event.timestamp || Date.now(),
      speaker: event.speaker,
      participantId: event.participantId || `${event.speaker}-${Date.now()}`,
      meetingId,
      confidence: event.confidence || 0.9
    };

    // Add to local storage
    transcriptManager.addTranscript(transcript);
    console.log(`💾 [LOCAL] Saved transcript locally:`, {
      meetingId: transcript.meetingId,
      textPreview: transcript.text.substring(0, 50) + '...'
    });

    // Create a full LocalTranscript object for syncing
    const fullTranscript: LocalTranscript = {
      ...transcript,
      id: `transcript-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Sync to backend automatically
    try {
      const syncSuccess = await syncService.syncTranscript(fullTranscript);
      if (syncSuccess) {
        console.log(`🌍 [BACKEND] Transcript synced to backend database`);
      } else {
        console.log(`📴 [BACKEND] Transcript queued for later sync (offline or error)`);
      }
    } catch (error) {
      console.warn(`⚠️ [BACKEND] Failed to sync transcript:`, error);
    }
  }, [meetingId, enabled, transcriptManager, syncService]);

  // Listen for custom transcript events
  useEffect(() => {
    if (!enabled) return;

    const handleTranscriptEvent = (event: CustomEvent<TranscriptEvent>) => {
      addTranscript(event.detail);
    };

    // Listen for custom transcript events
    window.addEventListener('transcript-captured', handleTranscriptEvent as EventListener);

    return () => {
      window.removeEventListener('transcript-captured', handleTranscriptEvent as EventListener);
    };
  }, [enabled, addTranscript]);

  // Auto-capture console logs that look like transcripts
  useEffect(() => {
    if (!enabled) return;

    console.log(`🎤 [CAPTURE-INIT] Initializing console capture for meeting: ${meetingId}`);
    
    // Store reference to current console.log - it might already be overridden
    const currentConsoleLog = console.log;
    
    // Create a more robust capture function
    const captureConsoleLog = (...args: any[]) => {
      // Always call the current console.log first
      currentConsoleLog.apply(console, args);
      
      try {
        // Check for AUDIOCAPTURE transcript messages - Updated to match actual format  
        const message = args.join(' ');
        
        // Debug ALL console messages that contain AUDIOCAPTURE
        if (message.includes('AUDIOCAPTURE')) {
          console.log(`🟡 [CAPTURE-DEBUG] AUDIOCAPTURE message detected: "${message}"`);
          console.log(`🟡 [CAPTURE-DEBUG] Args:`, args);
        }
        
        if ((message.includes('[AUDIOCAPTURE]') && message.includes('Received transcript:')) ||
            (message.includes('AUDIOCAPTURE') && message.includes('Received transcript:'))) {
          console.log(`🔍 [CAPTURE-DEBUG] *** AUDIOCAPTURE DETECTED ***`);
          console.log(`🔍 [CAPTURE-DEBUG] Message: "${message}"`);
          console.log(`🔍 [CAPTURE-DEBUG] Args count: ${args.length}`);
          
          // Find the transcript object in the arguments
          let transcriptObject = null;
          
          // Check all arguments for the transcript object
          for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            console.log(`🔍 [CAPTURE-DEBUG] Arg[${i}] type: ${typeof arg}`, arg);
            
            if (arg && 
                typeof arg === 'object' && 
                arg !== null &&
                !Array.isArray(arg) &&
                arg.text && // TranscriptMessage uses 'text' property
                arg.meetingId && 
                arg.role &&
                arg.participantId &&
                (arg.type === 'final' || arg.type === 'partial' || arg.type === 'error') &&
                typeof arg.timestamp === 'number') {
              transcriptObject = arg;
              console.log(`🔍 [CAPTURE-DEBUG] Found transcript object at arg[${i}]!`, transcriptObject);
              break;
            }
          }
          
          if (transcriptObject) {
            // Handle both partial and final transcripts, but only save final ones
            const isFinal = transcriptObject.type === 'final';
            const textContent = transcriptObject.text || '';
            
            console.log(`🔍 [CAPTURE-DEBUG] Transcript type: ${transcriptObject.type}, length: ${textContent.length}`);
            
            if ((isFinal || !transcriptObject.type) && textContent.trim().length > 5) {
              console.log(`🎤 [AUTO-CAPTURE] Processing AUDIOCAPTURE transcript`);
              console.log(`📝 [AUTO-CAPTURE] Meeting: ${transcriptObject.meetingId || 'test-room-id'}`);
              console.log(`📝 [AUTO-CAPTURE] Text: "${textContent.substring(0, 50)}..."`);
              
              // Use the actual meetingId from the transcript - THIS IS KEY!
              const actualMeetingId = transcriptObject.meetingId || 'test-room-id';
              const transcript: Omit<LocalTranscript, 'id'> = {
                text: textContent.trim(),
                timestamp: transcriptObject.timestamp || transcriptObject.startTime || Date.now(),
                speaker: transcriptObject.role === 'host' ? 'host' : 'guest',
                participantId: transcriptObject.participantId || `${transcriptObject.role || 'host'}-${Date.now()}`,
                meetingId: actualMeetingId, // Store with the ACTUAL meeting ID
                confidence: transcriptObject.confidence || 0.9
              };

              // Save to the transcript manager with the ACTUAL meeting ID
              transcriptManager.addTranscript(transcript);
              console.log(`💾 [AUTO-CAPTURE] Saved transcript for meeting: ${actualMeetingId}`);
              
              // Create full transcript object for backend sync
              const fullTranscript: LocalTranscript = {
                ...transcript,
                id: `transcript-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
              };

              // Sync to backend automatically (non-blocking)
              syncService.syncTranscript(fullTranscript).then((syncSuccess) => {
                if (syncSuccess) {
                  console.log(`🌍 [AUTO-CAPTURE] Transcript synced to backend database`);
                } else {
                  console.log(`📴 [AUTO-CAPTURE] Transcript queued for later sync`);
                }
              }).catch((error) => {
                console.warn(`⚠️ [AUTO-CAPTURE] Failed to sync transcript to backend:`, error);
              });
              
              // Trigger update event
              window.dispatchEvent(new CustomEvent('transcript-captured', {
                detail: { 
                  text: transcript.text, 
                  speaker: transcript.speaker, 
                  timestamp: transcript.timestamp,
                  meetingId: actualMeetingId 
                }
              }));
              
              console.log(`📡 [AUTO-CAPTURE] Dispatched transcript-captured event`);
              
              // Log storage verification after a short delay
              setTimeout(() => {
                const storedTranscripts = transcriptManager.getTranscripts(actualMeetingId);
                console.log(`✅ [AUTO-CAPTURE] Verification: ${storedTranscripts.length} transcripts stored for meeting: ${actualMeetingId}`);
              }, 100);
              
            } else {
              console.log(`⚠️ [AUTO-CAPTURE] Skipping transcript:`, {
                hasObject: !!transcriptObject,
                type: transcriptObject?.type,
                textLength: textContent.trim().length,
                meetingId: transcriptObject?.meetingId || 'none'
              });
            }
          } else {
            console.log(`⚠️ [AUTO-CAPTURE] No valid transcript object found in console message`);
          }
        }
      } catch (error) {
        console.warn('❌ [AUTO-CAPTURE] Console capture error:', error);
      }
    };

    // Replace console.log with our capture function
    console.log = captureConsoleLog;
    console.log(`✅ [CAPTURE-INIT] Console capture active for meeting: ${meetingId}`);
    
    // Test the capture system immediately
    setTimeout(() => {
      console.log(`🧪 [CAPTURE-TEST] Testing AUDIOCAPTURE detection...`);
      const testTranscriptObject = {
        type: 'final',
        meetingId: 'test-room-id', 
        role: 'host',
        participantId: 'test-host-123',
        text: 'This is a test transcript to verify console capture is working',
        timestamp: Date.now(),
        startTime: Date.now() - 1000,
        endTime: Date.now()
      };
      console.log('📝 [AUDIOCAPTURE] Received transcript:', testTranscriptObject);
    }, 1000);

    return () => {
      // Restore the console.log that was active when we started
      console.log = currentConsoleLog;
      console.log(`🔄 [CAPTURE-CLEANUP] Console capture restored for meeting: ${meetingId}`);
    };
  }, [enabled, meetingId, transcriptManager, syncService]);

  return {
    addTranscript,
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