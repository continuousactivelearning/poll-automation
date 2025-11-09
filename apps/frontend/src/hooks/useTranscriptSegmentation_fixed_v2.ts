import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

interface SegmentationState {
  isCurrentlyPaused: boolean;
  pauseStartTime: number | null;
  currentPauseDuration: number;
  segmentCount: number;
  timelineProgress: number; // 0-100%
  remainingTime: number; // milliseconds remaining
  hasReceivedTranscripts: boolean; // New field to track if any transcripts have been received
  waitingForSpeech: boolean; // New field to indicate waiting state
}

// Enhanced text normalization for accurate duplicate detection
const normalizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()                           // Convert to lowercase
    .replace(/[^\w\s]/g, ' ')               // Replace punctuation with spaces
    .replace(/\s+/g, ' ')                   // Collapse multiple spaces
    .trim();                                // Remove leading/trailing spaces
};

// Strict duplicate detection - only exact matches after normalization
const isExactDuplicate = (text1: string, text2: string): boolean => {
  if (!text1 || !text2) return false;
  
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);
  
  // Only consider it a duplicate if the normalized texts are exactly identical
  return normalized1 === normalized2 && normalized1.length > 0;
};

// Calculate similarity percentage for logging purposes only
const calculateTextSimilarity = (text1: string, text2: string): number => {
  if (!text1 || !text2) return 0;
  
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);
  
  if (normalized1 === normalized2) return 100;
  if (normalized1.length === 0 || normalized2.length === 0) return 0;
  
  // Simple word-based similarity for better accuracy
  const words1 = normalized1.split(' ').filter(w => w.length > 0);
  const words2 = normalized2.split(' ').filter(w => w.length > 0);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Count matching words in the same positions
  const maxLength = Math.max(words1.length, words2.length);
  let matches = 0;
  
  for (let i = 0; i < Math.min(words1.length, words2.length); i++) {
    if (words1[i] === words2[i]) matches++;
  }
  
  return (matches / maxLength) * 100;
};

// Function to fetch last saved segment from database for comparison
const fetchLastSavedSegment = async (meetingId: string): Promise<string | null> => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const response = await fetch(`${baseUrl}/segments/last/${meetingId}`);
    if (!response.ok) {
      if (response.status === 404) {
        // No segments found - this is normal for first segment
        return null;
      }
      throw new Error('Failed to fetch last segment');
    }
    const data = await response.json();
    return data.transcriptText || null;
  } catch (error) {
    console.warn('⚠️ [SEGMENTATION] Could not fetch last segment for comparison:', error);
    return null;
  }
};

export const useTranscriptSegmentation = (
  meetingId: string,
  isRecording: boolean,
  currentTranscripts: any[], // Accept transcripts directly from the component
  pauseThreshold: number = 10000 // 10 seconds
) => {
  const [segmentationState, setSegmentationState] = useState<SegmentationState>({
    isCurrentlyPaused: false,
    pauseStartTime: null,
    currentPauseDuration: 0,
    segmentCount: 0,
    timelineProgress: 0,
    remainingTime: pauseThreshold,
    hasReceivedTranscripts: false,
    waitingForSpeech: false
  });

  // Use ref to avoid stale closure issues in timer callbacks
  const segmentationStateRef = useRef<SegmentationState>(segmentationState);
  
  // Update ref whenever state changes
  useEffect(() => {
    segmentationStateRef.current = segmentationState;
  }, [segmentationState]);

  // Use useMemo to memoize transcript processing and prevent constant re-computation
  const processedTranscripts = useMemo(() => {
    if (!Array.isArray(currentTranscripts)) return [];
    
    // ENHANCED FILTERING: Remove all ASR system messages comprehensively
    return currentTranscripts.filter(t => {
      if (!t || !t.text || typeof t.text !== 'string') return false;
      
      const text = t.text.trim();
      
      // Filter out empty or very short content
      if (text.length < 3) return false;
      
      // Filter out ASR system messages - comprehensive list
      const isSystemMessage = 
        text.includes('ASR system connected') ||
        text.includes('ASR system ready') ||
        text.includes('[Speech detected') ||
        text.includes('[Speech recognition') ||
        text.includes('[Speech Error:') ||
        text.includes('[Speech recognition is now active') ||
        text.includes('[Speech recognition stopped') ||
        text.includes('[Fallback]') ||
        text.includes('processing...') ||
        text.match(/^\[.*\]$/) || // Any message entirely in square brackets
        text.includes('...') || // Incomplete processing messages
        text.match(/^(um|uh|ah|er|hmm|.)$/i); // Single filler words or characters
      
      return !isSystemMessage;
    });
  }, [currentTranscripts]);

  const lastTranscriptTimeRef = useRef(Date.now());
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptCountRef = useRef(0); // For database operations
  const lastSeenTranscriptTextRef = useRef(''); // Track last seen transcript text for activity detection
  const lastSavedFinalTranscriptCountRef = useRef(0); // Track final transcript count when last segment was saved
  const lastSavedSegmentTextRef = useRef(''); // Track actual saved segment content for strict duplicate prevention
  const isSavingSegmentRef = useRef(false); // Prevent concurrent saves

  // Save current transcript segment to database using the new segments API
  const saveTranscriptSegment = useCallback(async () => {
    // PREVENT CONCURRENT SAVES: Only one save operation at a time
    if (isSavingSegmentRef.current) {
      console.log('⏳ [SEGMENTATION] Save already in progress - skipping duplicate save request');
      return;
    }

    try {
      isSavingSegmentRef.current = true;
      console.log('🔧 [SEGMENTATION] Segment save triggered');
      
      // STEP 1: Validate we have transcripts
      if (processedTranscripts.length === 0) {
        console.log('📝 [SEGMENTATION] No transcript to store - recording session is empty');
        toast('📝 No transcript to store', { duration: 3000, icon: '⚠️' });
        return;
      }

      // STEP 2: Filter for meaningful content only
      const meaningfulTranscripts = processedTranscripts.filter(t => {
        if (!t || !t.text || typeof t.text !== 'string') return false;
        const text = t.text.trim();
        
        // Filter out ASR system messages
        const isSystemMessage = 
          text.includes('[Speech recognition') ||
          text.includes('[Speech Error:') ||
          text.includes('[Speech recognition is now active') ||
          text.includes('[Speech recognition stopped') ||
          text.includes('ASR system connected') ||
          text.includes('ASR system ready') ||
          text.match(/^\[.*\]$/) || // Any message entirely in square brackets
          text.includes('processing...');
        
        if (isSystemMessage) return false;
        
        // Require substantial content (minimum 15 characters)
        if (text.length < 15) return false;
        
        // Filter out simple filler words and incomplete content
        if (text.match(/^(um|uh|ah|er|hmm|okay|ok|yes|no|hello)$/i)) return false;
        
        return true;
      });

      // STEP 3: Ensure we have substantial meaningful content
      if (meaningfulTranscripts.length === 0) {
        console.log('📝 [SEGMENTATION] No meaningful transcript content to save');
        toast('📝 Waiting for substantial speech content', { duration: 3000, icon: 'ℹ️' });
        
        // Reset pause state but don't save segment
        setSegmentationState(prev => ({
          ...prev,
          isCurrentlyPaused: false,
          pauseStartTime: null,
          currentPauseDuration: 0,
          timelineProgress: 0,
          remainingTime: pauseThreshold
        }));
        
        return;
      }

      // STEP 4: Combine transcript text into segment content
      const combinedTranscriptText = meaningfulTranscripts
        .map(t => t.text.trim())
        .filter(text => text.length > 0)
        .join(' ')
        .replace(/\s+/g, ' ') // Clean up multiple spaces
        .trim();
      
      // STEP 5: Validate minimum content length
      if (!combinedTranscriptText || combinedTranscriptText.length < 25) {
        console.log(`📝 [SEGMENTATION] Combined transcript too short (${combinedTranscriptText.length} chars) - waiting for more content`);
        toast('📝 Insufficient content for segment creation', { duration: 3000, icon: '⚠️' });
        
        // Reset pause state
        setSegmentationState(prev => ({
          ...prev,
          isCurrentlyPaused: false,
          pauseStartTime: null,
          currentPauseDuration: 0,
          timelineProgress: 0,
          remainingTime: pauseThreshold
        }));
        
        return;
      }

      // STEP 6: STRICT DUPLICATE DETECTION - Check against last saved segment from database
      let lastSavedSegmentText = '';
      try {
        lastSavedSegmentText = await fetchLastSavedSegment(meetingId) || '';
      } catch (error) {
        console.warn('⚠️ [SEGMENTATION] Could not fetch last segment for comparison, proceeding with save');
      }

      // Compare with in-memory last saved text as fallback
      const lastKnownSavedText = lastSavedSegmentTextRef.current || lastSavedSegmentText;
      
      if (lastKnownSavedText) {
        // Calculate text similarity for logging purposes
        const similarity = calculateTextSimilarity(combinedTranscriptText, lastKnownSavedText);
        
        console.log(`🔍 [SEGMENTATION] Duplicate check against previous segment:`, {
          newTextLength: combinedTranscriptText.length,
          lastSavedLength: lastKnownSavedText.length,
          similarity: similarity.toFixed(1) + '%',
          newTextPreview: combinedTranscriptText.substring(0, 100) + '...',
          lastSavedPreview: lastKnownSavedText.substring(0, 100) + '...'
        });

        // STRICT DUPLICATE CHECK: Only exact matches after normalization are considered duplicates
        if (isExactDuplicate(combinedTranscriptText, lastKnownSavedText)) {
          console.log(`⚠️ [SEGMENTATION] Exact duplicate detected after normalization - skipping save`);
          console.log(`⚠️ Duplicate transcript detected — not saved.`);
          toast(`⚠️ Duplicate transcript detected — not saved.`, { duration: 4000, icon: '🔄' });
          
          // Reset pause state but don't save segment
          setSegmentationState(prev => ({
            ...prev,
            isCurrentlyPaused: false,
            pauseStartTime: null,
            currentPauseDuration: 0,
            timelineProgress: 0,
            remainingTime: pauseThreshold
          }));
          
          return;
        }

        console.log(`✅ [SEGMENTATION] Content is unique (${similarity.toFixed(1)}% similarity) - proceeding with save`);
      } else {
        console.log('🆕 [SEGMENTATION] No previous segment found - this will be the first segment');
      }

      // STEP 7: Count final transcripts for validation
      const finalTranscripts = meaningfulTranscripts.filter(t => t.isFinal);
      const currentFinalCount = finalTranscripts.length;

      console.log(`💾 [SEGMENTATION] Saving new segment:`, {
        contentLength: combinedTranscriptText.length,
        finalTranscriptCount: currentFinalCount,
        meaningfulTranscriptCount: meaningfulTranscripts.length,
        wordCount: combinedTranscriptText.split(/\s+/).length
      });

      console.log(`🎤 Host speaking detected...`);
      console.log(`⏸ Silence detected for 10 seconds – Segment ${segmentationStateRef.current.segmentCount + 1} ready to save`);

      // STEP 8: Save to database
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${baseUrl}/segments/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          hostmail: 'host@example.com', // TODO: Get this from auth context
          transcriptText: combinedTranscriptText
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save segment');
      }

      const result = await response.json();
      
      console.log(`✅ Segment ${result.segmentNumber} saved successfully`);
      console.log(`✅ [SEGMENTATION] Database confirmed segment ${result.segmentNumber} saved with ${combinedTranscriptText.length} characters`);

      // STEP 9: Update state and tracking variables
      setSegmentationState(prev => {
        console.log(`📈 [SEGMENTATION] Updating segment count to ${result.segmentNumber}`);
        return {
          ...prev,
          segmentCount: result.segmentNumber,
          isCurrentlyPaused: false,
          pauseStartTime: null,
          currentPauseDuration: 0,
          timelineProgress: 0,
          remainingTime: pauseThreshold
        };
      });

      // Update tracking to prevent future duplicates
      lastTranscriptCountRef.current = meaningfulTranscripts.length;
      lastSavedFinalTranscriptCountRef.current = currentFinalCount;
      lastSeenTranscriptTextRef.current = combinedTranscriptText;
      lastSavedSegmentTextRef.current = combinedTranscriptText; // Track what we actually saved
      
      console.log(`📊 [SEGMENTATION] Updated tracking after save:`, {
        segmentNumber: result.segmentNumber,
        finalCount: currentFinalCount,
        savedTextLength: combinedTranscriptText.length,
        savedTextPreview: combinedTranscriptText.substring(0, 50) + '...'
      });

      // Show success message
      const currentTime = new Date();
      const timeString = currentTime.toTimeString().slice(0, 8);
      console.log(`🎉 [SEGMENTATION] Segment ${result.segmentNumber} saved at ${timeString} (${combinedTranscriptText.split(/\s+/).length} words)`);
      console.log(`✅ New transcript saved successfully.`);
      toast.success(`✅ New transcript saved successfully - Segment ${result.segmentNumber}`, { duration: 5000 });

    } catch (error) {
      console.error('❌ [SEGMENTATION] Error saving segment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to save transcript segment: ${errorMessage}`, { duration: 5000 });
    } finally {
      // Always reset the saving flag
      isSavingSegmentRef.current = false;
    }
  }, [processedTranscripts, meetingId, pauseThreshold]);

  // Check for speech activity and detect pauses
  const checkSpeechActivity = useCallback(() => {
    if (!isRecording) return;

    console.log(`🔍 [SEGMENTATION] Speech activity check:`, {
      isRecording,
      processedTranscriptsLength: processedTranscripts.length,
      hasProcessedTranscripts: processedTranscripts.length > 0
    });

    // Use processed transcripts (already filtered for valid content)
    // Filter out system messages for speech activity detection
    const allRealTranscripts = processedTranscripts.filter(t => 
      !t.text.includes('[Speech recognition') && 
      !t.text.includes('[Speech Error:') &&
      !t.text.includes('[Speech recognition is now active') &&
      !t.text.includes('[Speech recognition stopped')
    );
    
    // Additional filtering for meaningful content
    const meaningfulTranscripts = allRealTranscripts.filter(t => 
      t.text.trim().length > 2 && // More than just a single character
      !t.text.trim().match(/^(um|uh|ah|er|hmm)$/i) // Filter out filler words
    );
    
    const totalTranscriptCount = meaningfulTranscripts.length;
    const now = Date.now();

    // Get the latest meaningful transcript text for activity detection
    const latestTranscript = meaningfulTranscripts[meaningfulTranscripts.length - 1];
    const currentTranscriptText = latestTranscript ? latestTranscript.text.trim() : '';

    console.log(`🔍 [SEGMENTATION] Activity check: meaningfulTranscripts=${totalTranscriptCount}, currentText="${currentTranscriptText.substring(0, 50)}..."`);

    // Check if this is the first time we receive meaningful transcripts
    if (totalTranscriptCount > 0 && !segmentationStateRef.current.hasReceivedTranscripts) {
      console.log('🎤 Host started speaking — segment recording started');
      console.log('🎯 [SEGMENTATION] First meaningful transcript received - enabling speech monitoring');
      setSegmentationState(prev => ({
        ...prev,
        hasReceivedTranscripts: true,
        waitingForSpeech: false
      }));
      lastTranscriptTimeRef.current = now;
      lastSeenTranscriptTextRef.current = currentTranscriptText;
      lastTranscriptCountRef.current = totalTranscriptCount;
      return;
    }

    // If we haven't received any meaningful transcripts yet, but recording is active,
    // stay in monitoring state (not waiting state)
    if (!segmentationStateRef.current.hasReceivedTranscripts) {
      // Make sure we're in monitoring state when recording, not waiting state
      if (segmentationStateRef.current.waitingForSpeech) {
        console.log('🎯 [SEGMENTATION] Recording started - switching to monitoring mode');
        setSegmentationState(prev => ({
          ...prev,
          waitingForSpeech: false
        }));
      }
      return; // Don't process pause detection until we have meaningful transcripts
    }

    // Check if we have new speech activity by comparing transcript text content
    // This handles both new transcripts and updated transcript content (partial → final)
    const hasNewSpeechActivity = currentTranscriptText !== lastSeenTranscriptTextRef.current && 
                                currentTranscriptText.length > 0 &&
                                currentTranscriptText.length > lastSeenTranscriptTextRef.current.length; // Ensure it's actually growing

    if (hasNewSpeechActivity) {
      // Speech detected - reset pause state
      console.log(`🗣️ [SEGMENTATION] New speech activity detected: text changed from "${lastSeenTranscriptTextRef.current.substring(0, 30)}..." to "${currentTranscriptText.substring(0, 30)}..."`);
      lastTranscriptTimeRef.current = now;
      lastSeenTranscriptTextRef.current = currentTranscriptText;

      if (segmentationStateRef.current.isCurrentlyPaused) {
        console.log('🔄 [SEGMENTATION] Cancelling pause timer - speech resumed');
        setSegmentationState(prev => ({
          ...prev,
          isCurrentlyPaused: false,
          pauseStartTime: null,
          currentPauseDuration: 0,
          timelineProgress: 0,
          remainingTime: pauseThreshold,
          waitingForSpeech: false
        }));

        // Clear pause timer
        if (pauseTimerRef.current) {
          clearTimeout(pauseTimerRef.current);
          pauseTimerRef.current = null;
        }

        console.log('🗣️ [SEGMENTATION] Speech resumed - pause timer reset');
      }
    } else {
      // No new transcripts - check if we should start pause detection
      const timeSinceLastTranscript = now - lastTranscriptTimeRef.current;

      // Only start pause detection if we have received transcripts and there's been sufficient silence
      // Increased threshold to 3 seconds to ensure host has actually stopped speaking
      if (timeSinceLastTranscript > 3000 && 
          !segmentationStateRef.current.isCurrentlyPaused && 
          segmentationStateRef.current.hasReceivedTranscripts &&
          totalTranscriptCount > 0) { // Ensure we have actual content to save
        
        // Start pause detection after 3 seconds of silence
        console.log(`🔇 [SEGMENTATION] Speech pause detected - starting 10s countdown (${timeSinceLastTranscript}ms since last transcript)`);
        console.log(`🔇 Host appears to have paused speaking — monitoring for 10 second silence`);
        
        setSegmentationState(prev => ({
          ...prev,
          isCurrentlyPaused: true,
          pauseStartTime: now,
          currentPauseDuration: 0,
          timelineProgress: 0,
          remainingTime: pauseThreshold,
          waitingForSpeech: false
        }));

        // Set timer for 10-second threshold - use a stable reference to avoid cancellation
        console.log('⏰ [SEGMENTATION] Setting 10-second timeout timer');
        const timerId = setTimeout(async () => {
          try {
            console.log('⏰ [SEGMENTATION] 10-second pause threshold reached - auto-saving segment');
            console.log('⏸ Host paused for 10 seconds – segment will be saved to database');
            
            // Use the saveTranscriptSegment function which now uses the segments API
            await saveTranscriptSegment();
            
          } catch (error) {
            console.error('❌ [SEGMENTATION] Auto-save failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Auto-save failed: ${errorMessage}`, { duration: 5000 });
            
            // Reset pause state even if save failed
            setSegmentationState(prev => ({
              ...prev,
              isCurrentlyPaused: false,
              pauseStartTime: null,
              currentPauseDuration: 0,
              timelineProgress: 0,
              remainingTime: pauseThreshold
            }));
          } finally {
            // Clear the timer reference
            if (pauseTimerRef.current === timerId) {
              pauseTimerRef.current = null;
            }
          }
        }, pauseThreshold);
        
        pauseTimerRef.current = timerId;
        console.log(`⏰ [SEGMENTATION] Timer set with ID: ${timerId}`);
      }

      // Update pause duration and timeline if currently paused
      if (segmentationStateRef.current.isCurrentlyPaused && segmentationStateRef.current.pauseStartTime) {
        const currentPauseDuration = now - segmentationStateRef.current.pauseStartTime;
        const progress = Math.min((currentPauseDuration / pauseThreshold) * 100, 100);
        const remaining = Math.max(pauseThreshold - currentPauseDuration, 0);

        setSegmentationState(prev => ({
          ...prev,
          currentPauseDuration,
          timelineProgress: progress,
          remainingTime: remaining
        }));
      }
    }
  }, [isRecording, meetingId, pauseThreshold, processedTranscripts, saveTranscriptSegment]);

  // Set up monitoring interval
  useEffect(() => {
    console.log(`⚙️ [SEGMENTATION] Dependencies changed - isRecording: ${isRecording}, processedTranscripts: ${processedTranscripts.length}, meetingId: ${meetingId}`);
    
    if (!isRecording) {
      // Clear all timers when not recording
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
        updateTimerRef.current = null;
      }
      
      setSegmentationState(prev => ({
        ...prev,
        isCurrentlyPaused: false,
        pauseStartTime: null,
        currentPauseDuration: 0,
        timelineProgress: 0,
        remainingTime: pauseThreshold,
        waitingForSpeech: false // Reset to monitoring state, not waiting
      }));
      
      return;
    }

    // When recording starts, ensure we're in monitoring state
    console.log('🎯 [SEGMENTATION] Recording started - ensuring monitoring state');
    setSegmentationState(prev => ({
      ...prev,
      waitingForSpeech: false, // Show "Monitoring speech activity" immediately
      isCurrentlyPaused: false,
      timelineProgress: 0,
      remainingTime: pauseThreshold
    }));

    // Check speech activity every 100ms for responsive UI updates
    updateTimerRef.current = setInterval(checkSpeechActivity, 100);

    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, [isRecording, processedTranscripts, checkSpeechActivity, pauseThreshold]);

  // Initialize transcript count based on current transcripts
  useEffect(() => {
    const realTranscripts = processedTranscripts.filter(t => 
      !t.text.includes('[Speech recognition') && 
      !t.text.includes('[Speech Error:') &&
      !t.text.includes('[Speech recognition is now active') &&
      !t.text.includes('[Speech recognition stopped')
    );
    
    // Filter for meaningful content consistently
    const meaningfulTranscripts = realTranscripts.filter(t => 
      t.text.trim().length > 2 && // More than just a single character
      !t.text.trim().match(/^(um|uh|ah|er|hmm)$/i) // Filter out filler words
    );
    
    lastTranscriptCountRef.current = meaningfulTranscripts.length;
    
    // Track final transcript count for segmentation validation
    const finalTranscripts = meaningfulTranscripts.filter(t => t.isFinal);
    if (lastSavedFinalTranscriptCountRef.current === 0 && finalTranscripts.length > 0) {
      // Only initialize if we haven't saved any segments yet
      console.log(`🔧 [SEGMENTATION] Initializing final transcript tracking: ${finalTranscripts.length} final meaningful transcripts found`);
    }
    
    // Update the last seen transcript text when transcripts change
    const latestTranscript = meaningfulTranscripts[meaningfulTranscripts.length - 1];
    if (latestTranscript && latestTranscript.text.trim() !== lastSeenTranscriptTextRef.current) {
      // Only update if the content is actually different and longer
      const newText = latestTranscript.text.trim();
      if (newText.length > lastSeenTranscriptTextRef.current.length) {
        lastSeenTranscriptTextRef.current = newText;
        console.log(`📝 [SEGMENTATION] Updated last seen transcript to: "${newText.substring(0, 50)}..."`);
      }
    }
  }, [processedTranscripts]);

  return {
    segmentationState,
    saveTranscriptSegment,
    resetSegmentation: () => {
      setSegmentationState({
        isCurrentlyPaused: false,
        pauseStartTime: null,
        currentPauseDuration: 0,
        segmentCount: 0,
        timelineProgress: 0,
        remainingTime: pauseThreshold,
        hasReceivedTranscripts: false,
        waitingForSpeech: false // Changed to false to show monitoring immediately
      });
      lastTranscriptCountRef.current = 0;
      lastSeenTranscriptTextRef.current = '';
      lastSavedFinalTranscriptCountRef.current = 0; // Reset final transcript tracking
      lastSavedSegmentTextRef.current = ''; // Reset saved segment tracking
    }
  };
};