import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Activity, 
  Pause, 
  Play, 
  Square,
  Wifi,
  WifiOff,
  AlertCircle,
  Download,
  Settings,
  Monitor,
  User
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import { useTranscriptCapture } from '../hooks/useTranscriptCapture';
import { useTranscriptSegmentation } from '../hooks/useTranscriptSegmentation';
import { useAutoQuestions } from '../hooks/useAutoQuestions';
import GuestLinkGenerator from '../components/host/GuestLinkGenerator';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { AudioStreamer, type TranscriptMessage, formatTimestamp, calculateWaveform } from '../utils/audioStreamer';

interface TranscriptLine {
  id: string;
  role: 'host' | 'participant' | 'guest';
  displayName?: string; // For guest role
  text: string;
  timestamp: number;
  isFinal: boolean;
  startTime: number;
  endTime: number;
}

type RecordingStatus = 'stopped' | 'connecting' | 'connected' | 'recording' | 'paused' | 'error' | 'disconnected';

const AudioCapture = () => {
  const { user, activeRoom } = useAuth();
  const [status, setStatus] = useState<RecordingStatus>('stopped');
  
  // Create unique storage key for this session
  const sessionStorageKey = `transcript-session-${activeRoom?._id || 'no-room'}`;
  
  // Initialize transcript lines with persistence
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>(() => {
    // Try to restore transcript lines from localStorage on component mount
    try {
      const savedTranscripts = localStorage.getItem(sessionStorageKey);
      if (savedTranscripts) {
        const parsed = JSON.parse(savedTranscripts);
        console.log(`📋 [AUDIOCAPTURE] Restored ${parsed.length} transcript lines from previous session`);
        return parsed;
      }
    } catch (error) {
      console.warn('⚠️ [AUDIOCAPTURE] Failed to restore transcript lines:', error);
    }
    return [];
  });
  
  // Initialize status with potential restoration from previous session
  const [restoredStatus, setRestoredStatus] = useState<RecordingStatus>(() => {
    try {
      const savedStatus = localStorage.getItem(`${sessionStorageKey}-status`);
      if (savedStatus && (savedStatus === 'recording' || savedStatus === 'connected')) {
        console.log(`🔄 [AUDIOCAPTURE] Found previous recording session with status: ${savedStatus}`);
        return savedStatus as RecordingStatus;
      }
    } catch (error) {
      console.warn('⚠️ [AUDIOCAPTURE] Failed to restore session status:', error);
    }
    return 'stopped';
  });
  
  const [includeSystemAudio, setIncludeSystemAudio] = useState(false);
  const [selectedMic, setSelectedMic] = useState('default');
  const [waveformData, setWaveformData] = useState<number[]>(Array(50).fill(0));
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(true); // Show debug info
  const [isHostMuted, setIsHostMuted] = useState(false); // Host mute state for guest speech
  const [dismissedSegments, setDismissedSegments] = useState<Set<number>>(new Set()); // Track dismissed notifications
  const [debugInfo, setDebugInfo] = useState({
    speechApiSupported: false,
    speechApiInitialized: false,
    speechApiListening: false,
    lastSpeechResult: '',
    lastError: '',
    browserInfo: '',
    audioContextState: '',
    websocketState: 'disconnected',
    transcriptCount: 0,
    fallbackActive: false
  });
  
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Mobile device detection functions
  const isMobileDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || 
           'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  const isChromeOnMobile = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent);
    return isChrome && isMobileDevice();
  };

  // Initialize transcript capture for REAL-TIME console capture and MongoDB storage
  // Only initialize if we have an active room
  const transcriptCapture = useTranscriptCapture(
    activeRoom?._id || 'no-room', 
    !!activeRoom // Only enable if room exists
  );
  
  // Initialize transcript segmentation for automatic 10-second pause detection
  const { segmentationState, saveTranscriptSegment } = useTranscriptSegmentation(
    activeRoom?._id || 'no-room',
    status === 'recording', // Only active when recording
    transcriptLines, // Pass current transcripts to the hook
    10000 // 10 seconds pause threshold
  );

  // Initialize auto questions for real-time question generation
  const { 
    questionSegments, 
    lastGeneratedSegment, 
    getTotalQuestionCount,
    clearQuestions 
  } = useAutoQuestions({
    meetingId: activeRoom?._id || 'no-room',
    enabled: !!activeRoom && status === 'recording'
  });
  
  // Debug log to see what transcripts are being passed
  useEffect(() => {
    if (status === 'recording') {
      console.log(`📤 [AUDIOCAPTURE] Passing to segmentation: ${transcriptLines.length} transcripts, final count: ${transcriptLines.filter(t => t.isFinal).length}`);
      if (transcriptLines.length > 0) {
        console.log(`📤 [AUDIOCAPTURE] Sample transcript:`, transcriptLines[0]);
      }
    }
  }, [transcriptLines, status]);
  
  // Persist transcript lines to localStorage whenever they change
  useEffect(() => {
    if (transcriptLines.length > 0) {
      try {
        localStorage.setItem(sessionStorageKey, JSON.stringify(transcriptLines));
        console.log(`💾 [AUDIOCAPTURE] Persisted ${transcriptLines.length} transcript lines to localStorage`);
      } catch (error) {
        console.warn('⚠️ [AUDIOCAPTURE] Failed to persist transcript lines:', error);
      }
    }
  }, [transcriptLines, sessionStorageKey]);
  
  // Restore recording session after AudioStreamer initialization
  useEffect(() => {
    const restoreSession = async () => {
      if (restoredStatus === 'recording' && audioStreamerRef.current && status === 'stopped') {
        console.log('🔄 [AUDIOCAPTURE] Attempting to restore previous recording session...');
        try {
          // Try to reinitialize and resume recording
          const audioInitialized = await audioStreamerRef.current.initializeSimpleMicrophoneAudio();
          if (audioInitialized) {
            const recordingStarted = await audioStreamerRef.current.startRecording();
            if (recordingStarted) {
              setStatus('recording');
              console.log('✅ [AUDIOCAPTURE] Successfully restored recording session');
              toast.success('Previous recording session restored');
              
              // Clear the restoration flag since we've successfully restored
              try {
                localStorage.removeItem(`${sessionStorageKey}-status`);
              } catch (error) {
                console.warn('⚠️ Failed to clear restoration flag:', error);
              }
            } else {
              console.warn('⚠️ [AUDIOCAPTURE] Failed to resume recording - will need manual restart');
              toast.error('Previous session found but needs manual restart');
            }
          }
        } catch (error) {
          console.error('❌ [AUDIOCAPTURE] Failed to restore recording session:', error);
          toast.error('Failed to restore previous session - please restart recording');
        }
      }
    };

    // Only attempt restoration if we have an initialized AudioStreamer
    if (audioStreamerRef.current && restoredStatus === 'recording') {
      restoreSession();
    }
  }, [audioStreamerRef.current, restoredStatus, status, sessionStorageKey]);

  // Notify when questions are generated for a new segment
  useEffect(() => {
    if (lastGeneratedSegment && !dismissedSegments.has(lastGeneratedSegment)) {
      console.log(`🎯 [AUDIOCAPTURE] New questions generated for segment ${lastGeneratedSegment}`);
      
      // Show toast notification
      toast.success(
        `🎯 Questions generated for Segment ${lastGeneratedSegment}!`,
        {
          duration: 4000,
          icon: '🎯',
          style: {
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#10b981',
          },
        }
      );
    }
  }, [lastGeneratedSegment, dismissedSegments]);
  
  // Suppress unused variable warning - transcriptCapture works via side effects
  void transcriptCapture;

  // Log component initialization once per meeting
  useEffect(() => {
    if (activeRoom?._id) {
      console.log('🔍 [COMPONENT] AudioCapture loaded with transcript capture for meeting:', activeRoom._id);
    }
  }, [activeRoom?._id]);

  // Mock microphone devices for now - could be enhanced with actual device enumeration
  const micDevices = [
    { id: 'default', name: 'Default Microphone' },
    { id: 'external', name: 'External USB Microphone' },
    { id: 'headset', name: 'Bluetooth Headset' },
  ];

  // WebSocket URL - adjust based on your backend configuration
  const getWebSocketUrl = () => {
    // Use environment variable for production, fall back to localhost for development
    const backendUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    
    // Convert HTTP(S) URL to WebSocket URL
    const wsUrl = backendUrl.replace(/^https?:/, backendUrl.startsWith('https:') ? 'wss:' : 'ws:');
    
    return `${wsUrl}/ws/asr`;
  };

  // Initialize audio streamer only if room exists
  useEffect(() => {
    console.log('🔄 AudioCapture useEffect triggered');
    console.log('🔄 User:', user);
    console.log('🔄 Active Room:', activeRoom);
    
    // Only initialize if we have both user and activeRoom
    if (!user || !activeRoom) {
      console.log('⏳ [AUDIOCAPTURE] Waiting for user and activeRoom...');
      return;
    }
    
    console.log('🔄 Using User:', user);
    console.log('🔄 Using Room:', activeRoom);

    const wsUrl = getWebSocketUrl();
    console.log('🔗 WebSocket URL:', wsUrl);
    
    const audioStreamer = new AudioStreamer(
      wsUrl,
      activeRoom._id,
      user.id, // Use 'id' instead of '_id' for User
      'host'
    );
    
    console.log('✅ AudioStreamer created:', audioStreamer);

    audioStreamer.setCallbacks({
      onTranscript: (message: TranscriptMessage) => {
        console.log('📝 [AUDIOCAPTURE] Received transcript:', message);
        console.log('🎭 [AUDIOCAPTURE] Message role:', message.role, 'displayName:', message.displayName);
        
        // CRITICAL FIX: Filter out ASR system messages before creating transcript lines
        const isASRSystemMessage = 
          !message.text || 
          message.text.includes('ASR system connected') ||
          message.text.includes('[Speech detected') ||
          message.text.includes('[Speech recognition') ||
          message.text.includes('[Speech Error:') ||
          message.text.includes('[Speech recognition is now active') ||
          message.text.includes('[Speech recognition stopped') ||
          message.text.includes('[Fallback]') ||
          message.text.match(/^\[.*\]$/) || // Any message entirely in square brackets
          message.text.includes('...') || // Incomplete processing messages
          message.text.trim().length < 3; // Very short messages
        
        if (isASRSystemMessage) {
          console.log('🚫 [AUDIOCAPTURE] Filtered out ASR system message:', message.text);
          return; // Don't create transcript line for system messages
        }
        
        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          lastSpeechResult: message.text || '',
          transcriptCount: prev.transcriptCount + 1,
          fallbackActive: (message.text || '').includes('[Fallback]') || (message.text || '').includes('[Speech')
        }));
        
        const newLine: TranscriptLine = {
          id: `${message.timestamp}-${Math.random()}`,
          role: message.role,
          displayName: message.displayName, // For guest transcripts
          text: message.text,
          timestamp: message.timestamp,
          isFinal: message.type === 'final',
          startTime: message.startTime,
          endTime: message.endTime
        };

        console.log('🔄 [AUDIOCAPTURE] Created transcript line with role:', newLine.role);
        
        setTranscriptLines(prev => {
          // Replace partial transcripts or add new final ones
          if (message.type === 'final') {
            return [...prev.filter(line => line.isFinal), newLine];
          } else {
            // Update or add partial transcript
            const filtered = prev.filter(line => line.isFinal || line.id !== newLine.id);
            return [...filtered, newLine];
          }
        });

        // Auto-scroll to bottom
        setTimeout(() => {
          if (transcriptContainerRef.current) {
            transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
          }
        }, 100);
      },
      
      onStatusChange: (newStatus) => {
        console.log('🔄 Status change:', newStatus);
        setStatus(newStatus as RecordingStatus);
        
        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          websocketState: newStatus === 'connected' ? 'connected' : 
                         newStatus === 'connecting' ? 'connecting' : 
                         newStatus === 'recording' ? 'connected' : // Recording implies connected
                         'disconnected'
        }));
        
        const logMessage = `${formatTimestamp(Date.now())}: Status changed to ${newStatus}`;
        setConnectionLogs(prev => [...prev.slice(-4), logMessage]);
      },
      
      onError: (error) => {
        console.error('❌ AudioCapture error:', error);
        toast.error(error);
        
        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          lastError: error
        }));
        
        const logMessage = `${formatTimestamp(Date.now())}: Error - ${error}`;
        setConnectionLogs(prev => [...prev.slice(-4), logMessage]);
      }
    });

    audioStreamerRef.current = audioStreamer;
    console.log('✅ AudioStreamer assigned to ref:', audioStreamerRef.current);

    // Initialize debug info
    setDebugInfo(prev => ({
      ...prev,
      speechApiSupported: !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
      browserInfo: navigator.userAgent,
      audioContextState: 'not-initialized',
      websocketState: 'disconnected'
    }));

    return () => {
      // When component unmounts (navigation away), preserve the recording session
      // but save current state to localStorage for restoration
      console.log('🚪 [AUDIOCAPTURE] Component unmounting - preserving session state');
      
      if (status === 'recording' && transcriptLines.length > 0) {
        console.log(`💾 [AUDIOCAPTURE] Preserving ${transcriptLines.length} transcripts for navigation resume`);
        try {
          localStorage.setItem(sessionStorageKey, JSON.stringify(transcriptLines));
          localStorage.setItem(`${sessionStorageKey}-status`, status);
          console.log('💾 [AUDIOCAPTURE] Session state preserved for navigation');
        } catch (error) {
          console.warn('⚠️ [AUDIOCAPTURE] Failed to preserve session state:', error);
        }
      }
      
      // Only cleanup audio resources, not the recording session data
      audioStreamer.cleanup();
    };
  }, [user, activeRoom]); // Re-add dependencies since we need room to exist

  // Waveform animation
  useEffect(() => {
    if (status === 'recording') {
      const animate = () => {
        // Generate realistic waveform based on recording activity
        const newWaveform = Array(50).fill(0).map(() => 
          Math.random() * (status === 'recording' ? 80 : 20) + 10
        );
        setWaveformData(newWaveform);
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setWaveformData(Array(50).fill(0));
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [status]);

  const handleStartRecording = async () => {
    console.log('🎤 Handle Start Recording called');
    console.log('🎤 User:', user);
    console.log('🎤 Active Room:', activeRoom);
    console.log('🎤 AudioStreamer Ref:', audioStreamerRef.current);
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      lastError: '',
      speechApiInitialized: false,
      speechApiListening: false
    }));
    
    if (!audioStreamerRef.current) {
      toast.error('Audio system not initialized');
      console.error('❌ AudioStreamer ref is null');
      setDebugInfo(prev => ({
        ...prev,
        lastError: 'AudioStreamer ref is null'
      }));
      return;
    }

    try {
      setStatus('connecting');
      
      // Initialize audio with system audio option
      console.log('🔧 Initializing audio with system audio:', includeSystemAudio);
      let audioInitialized = false;
      
      if (includeSystemAudio) {
        audioInitialized = await audioStreamerRef.current.initializeAudio(true);
      } else {
        // Use simple microphone-only mode for better reliability
        audioInitialized = await audioStreamerRef.current.initializeSimpleMicrophoneAudio();
      }
      
      if (!audioInitialized) {
        console.error('❌ Audio initialization failed');
        setStatus('error');
        setDebugInfo(prev => ({
          ...prev,
          lastError: 'Audio initialization failed',
          audioContextState: 'failed'
        }));
        return;
      }

      console.log('✅ Audio initialized, starting recording...');
      setDebugInfo(prev => ({
        ...prev,
        audioContextState: 'initialized'
      }));

      // Start recording
      const recordingStarted = await audioStreamerRef.current.startRecording();
      if (recordingStarted) {
        console.log('✅ Recording started successfully');
        
        // Check if we have persisted transcripts from previous session
        const hasPersistedTranscripts = transcriptLines.length > 0;
        
        if (hasPersistedTranscripts) {
          console.log(`📋 [AUDIOCAPTURE] Resuming recording session with ${transcriptLines.length} existing transcripts`);
          toast.success('Recording resumed with previous transcript');
        } else {
          console.log('🆕 [AUDIOCAPTURE] Starting fresh recording session');
          setTranscriptLines([]); // Only clear for completely new sessions
          toast.success('Recording started successfully');
        }
        setDebugInfo(prev => ({
          ...prev,
          speechApiInitialized: true,
          audioContextState: 'recording'
        }));
      } else {
        console.error('❌ Recording failed to start');
        setStatus('error');
        setDebugInfo(prev => ({
          ...prev,
          lastError: 'Recording failed to start',
          audioContextState: 'error'
        }));
      }
    } catch (error) {
      console.error('❌ Exception during recording start:', error);
      setStatus('error');
      toast.error('Failed to start recording');
      setDebugInfo(prev => ({
        ...prev,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        audioContextState: 'error'
      }));
    }
  };

  const handleStopRecording = async () => {
    if (!audioStreamerRef.current) return;

    try {
      await audioStreamerRef.current.stopRecording();
      setStatus('stopped');
      
      // ONLY clear transcripts when recording is actually stopped
      console.log('🛑 [AUDIOCAPTURE] Recording stopped - clearing transcript session');
      setTranscriptLines([]);
      
      // Clear from localStorage as well since session is ended
      try {
        localStorage.removeItem(sessionStorageKey);
        localStorage.removeItem(`${sessionStorageKey}-status`); // Also clear status flag
        console.log('🗑️ [AUDIOCAPTURE] Cleared transcript session and status from localStorage');
      } catch (error) {
        console.warn('⚠️ [AUDIOCAPTURE] Failed to clear localStorage:', error);
      }
      
      // Clear auto-generated questions when session ends
      clearQuestions();
      
      toast.success('Recording stopped. Transcript session cleared.');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      toast.error('Failed to stop recording properly');
    }
  };

  const exportTranscript = async () => {
    if (transcriptLines.length === 0) {
      toast.error('No transcript to export');
      return;
    }

    setIsExporting(true);
    
    try {
      // Generate transcript content with timestamps
      const transcriptContent = transcriptLines
        .filter(line => line.isFinal)
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(line => {
          const roleLabel = line.role === 'host' ? 'HOST' : 
                           line.role === 'guest' ? 'GUEST' : 'PARTICIPANT';
          return `[${formatTimestamp(line.timestamp)}] ${roleLabel}: ${line.text}`;
        })
        .join('\n\n');

      if (!transcriptContent.trim()) {
        toast.error('No final transcript available to export');
        return;
      }

      // Create and download file
      const blob = new Blob([transcriptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${activeRoom?.name || 'session'}-${new Date().toISOString().slice(0, 19)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Transcript exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export transcript');
    } finally {
      setIsExporting(false);
    }
  };

  const clearTranscript = () => {
    console.log('🧹 [AUDIOCAPTURE] Manual transcript clear - keeping recording session active');
    setTranscriptLines([]);
    
    // Clear from localStorage but keep recording session active
    try {
      localStorage.removeItem(sessionStorageKey);
      localStorage.removeItem(`${sessionStorageKey}-status`); // Also clear status flag
      console.log('🗑️ [AUDIOCAPTURE] Cleared persisted transcripts and status from localStorage');
    } catch (error) {
      console.warn('⚠️ [AUDIOCAPTURE] Failed to clear localStorage:', error);
    }
    
    toast.success('Transcript cleared (recording continues)');
  };

  const getStatusColor = (currentStatus: RecordingStatus) => {
    switch (currentStatus) {
      case 'recording': return 'bg-green-500/20 text-green-400';
      case 'connecting': return 'bg-yellow-500/20 text-yellow-400';
      case 'connected': return 'bg-blue-500/20 text-blue-400';
      case 'paused': return 'bg-orange-500/20 text-orange-400';
      case 'error': return 'bg-red-500/20 text-red-400';
      case 'disconnected': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (currentStatus: RecordingStatus) => {
    switch (currentStatus) {
      case 'recording': return <Activity className="w-4 h-4" />;
      case 'connecting': return <Wifi className="w-4 h-4 animate-pulse" />;
      case 'connected': return <Wifi className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'disconnected': return <WifiOff className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  const finalTranscriptCount = transcriptLines.filter(line => line.isFinal).length;

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      {/* Check if room is created */}
      {!activeRoom ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <GlassCard className="p-8 text-center max-w-md">
            <div className="mb-6">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Create Room First</h2>
              <p className="text-gray-400">
                Please create a session room from either the Create Poll page or AI Questions page before using audio capture.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/host/create-poll'}
                className="w-full btn-primary py-2"
              >
                Go to Create Poll Page
              </button>
              <button
                onClick={() => window.location.href = '/host/ai-questions'}
                className="w-full btn-secondary py-2"
              >
                Go to AI Questions Page
              </button>
            </div>
          </GlassCard>
        </div>
      ) : (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Audio Capture</h1>
            <p className="text-gray-400">Real-time audio recording and transcription with ASR</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(status)}`}>
              {getStatusIcon(status)}
              <span className="capitalize">{status}</span>
            </div>
          </div>
        </div>

        {/* Question Generation Global Notification */}
        <AnimatePresence>
          {lastGeneratedSegment && !dismissedSegments.has(lastGeneratedSegment) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/40 rounded-xl p-4 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-full">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-10 h-10 bg-green-500/30 rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-300 flex items-center gap-2">
                      🎯 Questions Generated!
                    </h3>
                    <p className="text-sm text-gray-300">
                      Segment {lastGeneratedSegment} processed • {getTotalQuestionCount()} total questions ready
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      You can continue speaking while questions are being prepared for launch
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/host/ai-questions'}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all shadow-lg"
                  >
                    Launch Questions
                  </motion.button>
                  <button
                    onClick={() => setDismissedSegments(prev => new Set([...prev, lastGeneratedSegment]))}
                    className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                    title="Dismiss notification"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Recording Controls</h3>
            <div className="space-y-4">
              {/* Main Recording Button - Hidden on Mobile */}
              <div className={`flex items-center justify-center ${isMobileDevice() ? 'hidden' : ''}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={status === 'recording' ? handleStopRecording : handleStartRecording}
                  disabled={status === 'connecting'}
                  className={`w-20 h-20 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                    status === 'recording'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-primary-500 hover:bg-primary-600'
                  } transition-colors duration-200`}
                >
                  {status === 'recording' ? (
                    <Square className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                </motion.button>
              </div>
              
              {/* Mobile Mic Button - Clean Design */}
              {isMobileDevice() && (
                <div className="flex flex-col items-center space-y-6 my-8">
                  {/* Beautiful Mobile Mic Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      if (audioStreamerRef.current) {
                        console.log('🎤 Mobile continuous recording button clicked');
                        try {
                          // Show connecting status
                          toast.loading('🔗 Connecting to backend...', { id: 'mobile-connect' });
                          
                          const success = await audioStreamerRef.current.startMobileSpeechCapture();
                          if (success) {
                            // Check if we're starting or stopping
                            const isStarting = !(audioStreamerRef.current as any).mobileContinuousMode;
                            toast.success(isStarting ? 
                              '🎤 Continuous recording started! Speak naturally!' : 
                              '🛑 Continuous recording stopped!', 
                              { id: 'mobile-connect' }
                            );
                          } else {
                            toast.error('❌ Failed to toggle mobile speech capture', { id: 'mobile-connect' });
                          }
                        } catch (error) {
                          console.error('❌ Mobile speech capture error:', error);
                          toast.error('❌ Failed to connect to backend', { id: 'mobile-connect' });
                        }
                      }
                    }}
                    className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 border-2 border-white/20 transition-all duration-300"
                  >
                    {/* Mic Icon */}
                    <Mic className="w-8 h-8 text-white drop-shadow-lg" />
                    
                    {/* Recording Pulse Animation */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-400"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 0, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.button>
                  
                  {/* Simple Status Text */}
                  <p className="text-sm text-gray-300 font-medium">
                    Tap to Start/Stop Recording
                  </p>
                </div>
              )}

              {/* Manual Save Segments Button for Mobile - Hidden but functional */}
              {isMobileDevice() && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    if (audioStreamerRef.current) {
                      console.log('💾 Manual mobile segment save requested');
                      toast.loading('💾 Saving segments manually...', { id: 'manual-save' });
                      
                      try {
                        // Call public save method
                        await (audioStreamerRef.current as any).saveTranscriptsToBackend();
                        toast.success('✅ Mobile segments saved successfully!', { id: 'manual-save' });
                        
                      } catch (error) {
                        console.error('Manual save failed:', error);
                        toast.error('❌ Failed to save segments', { id: 'manual-save' });
                      }
                    }
                  }}
                  className="hidden"
                >
                  <span className="text-lg">💾</span>
                  <span>Save Segments Now</span>
                </motion.button>
              )}

              <div className={`text-center ${isMobileDevice() ? 'hidden' : ''}`}>
                <p className="text-sm text-gray-400">
                  {status === 'recording' ? 'Click to Stop Recording' : 'Click to Start Recording'}
                </p>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearTranscript}
                  className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors duration-200"
                >
                  Clear Transcript
                </motion.button>

                {/* <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (audioStreamerRef.current) {
                      console.log('🧪 Testing speech recognition...');
                      audioStreamerRef.current.testSpeechRecognition();
                    }
                  }}
                  className="px-4 py-2 bg-blue-500/20 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors duration-200"
                >
                  Test Speech
                </motion.button> */}

                {/* <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (audioStreamerRef.current) {
                      console.log('🎤 Starting speech-only mode...');
                      await audioStreamerRef.current.startSpeechOnlyMode();
                    }
                  }}
                  className="px-4 py-2 bg-green-500/20 rounded-lg text-green-300 hover:bg-green-500/30 transition-colors duration-200"
                >
                  Speech Only
                </motion.button> */}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsHostMuted(!isHostMuted);
                    if (audioStreamerRef.current) {
                      if (!isHostMuted) {
                        console.log('� Host muted - Guest can now speak');
                        audioStreamerRef.current.pauseSpeechRecognition();
                        toast.success('Host muted - Guest can now speak');
                      } else {
                        console.log('🎤 Host unmuted - Host speech recognition resumed');
                        audioStreamerRef.current.resumeSpeechRecognition();
                        toast.success('Host unmuted - Speech recognition resumed');
                      }
                    }
                  }}
                  disabled={status !== 'recording'}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                    isHostMuted 
                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' 
                      : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isHostMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isHostMuted ? 'Unmute Host' : 'Mute Host'}
                </motion.button>

                {/* <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={exportTranscript}
                  disabled={isExporting || transcriptLines.length === 0}
                  className="px-4 py-2 bg-primary-500 rounded-lg text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  Export
                </motion.button> */}
              </div>
            </div>
          </GlassCard>

          {/* Audio Settings */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Audio Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Microphone Source
                </label>
                <select
                  value={selectedMic}
                  onChange={(e) => setSelectedMic(e.target.value)}
                  disabled={status === 'recording'}
                  className="w-full bg-white/10 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {micDevices.map(device => (
                    <option key={device.id} value={device.id} className="bg-gray-800">
                      {device.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-3 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={includeSystemAudio}
                    onChange={(e) => setIncludeSystemAudio(e.target.checked)}
                    disabled={status === 'recording'}
                    className="rounded focus:ring-primary-500 text-primary-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4" />
                    <span>Include System Audio</span>
                  </div>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Capture desktop/tab audio (requires screen share)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Connection Status
                </label>
                <div className="bg-black/20 rounded-lg p-3 text-xs">
                  {connectionLogs.length > 0 ? (
                    connectionLogs.map((log, idx) => (
                      <div key={idx} className="text-gray-400 mb-1 last:mb-0">
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">No connection activity</div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Waveform Visualizer */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Audio Waveform
            </h3>
            <div className="bg-black/20 rounded-lg p-4 h-32 flex items-end justify-center space-x-1">
              {waveformData.map((height, index) => (
                <motion.div
                  key={index}
                  animate={{ height: `${Math.max(height, 5)}%` }}
                  transition={{ duration: 0.1 }}
                  className={`w-2 rounded-t-sm min-h-[2px] ${
                    status === 'recording' 
                      ? 'bg-gradient-to-t from-green-500 to-green-300' 
                      : 'bg-gradient-to-t from-gray-500 to-gray-400'
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-400">
                Final Transcripts: {finalTranscriptCount}
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Real-time Transcription */}
        <GlassCard className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Live Transcription
            </h3>
            <div className="flex items-center space-x-2">
              {transcriptLines.length > 0 && restoredStatus === 'recording' && (
                <div className="flex items-center space-x-1 bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Session Restored</span>
                </div>
              )}
              {status === 'recording' && (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-400">Live</span>
                </>
              )}
            </div>
          </div>

          {/* Transcript Segmentation Timeline */}
          {status === 'recording' && (
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-300">Transcript Segmentation</span>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                    Segments: {segmentationState.segmentCount}
                  </span>
                  {lastGeneratedSegment && (
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      Questions: {getTotalQuestionCount()}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  Auto-saves on 10s pause • AI questions generated
                </div>
              </div>

              {segmentationState.waitingForSpeech ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-yellow-300">Waiting for transcript...</span>
                </div>
              ) : segmentationState.isCurrentlyPaused ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-300">⏸️ Pause Detected</span>
                    <span className="text-sm text-orange-300">
                      {Math.ceil(segmentationState.remainingTime / 1000)}s remaining
                    </span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${segmentationState.timelineProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 text-center">
                    Timeline: {segmentationState.timelineProgress.toFixed(1)}% complete
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-300">Monitoring speech activity...</span>
                  </div>
                  {lastGeneratedSegment && (
                    <span className="text-xs text-green-300">
                      Last questions: Segment {lastGeneratedSegment}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div 
            ref={transcriptContainerRef}
            className="bg-black/20 rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto space-y-3"
          >
            <AnimatePresence>
              {transcriptLines.length > 0 ? (
                transcriptLines.map((line) => (
                  <motion.div
                    key={line.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-3 rounded-lg border-l-4 ${
                      line.isFinal 
                        ? 'bg-white/5 border-l-green-500' 
                        : 'bg-yellow-500/5 border-l-yellow-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${
                        line.role === 'host' ? 'text-blue-400' : 
                        line.role === 'guest' ? 'text-purple-400' : 'text-green-400'
                      }`}>
                        {line.role === 'host' ? 'Host' : 
                         line.role === 'guest' ? 'Guest' : 'Participant'}
                        {!line.isFinal && ' (partial)'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(line.timestamp)}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      line.isFinal ? 'text-gray-300' : 'text-yellow-300'
                    }`}>
                      {line.role === 'guest' ? 'GUEST: ' : 
                       line.role === 'host' ? 'HOST: ' : 'PARTICIPANT: '}
                      {line.text}
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-500 text-lg mb-2">
                      {status === 'recording' 
                        ? 'Listening for speech...' 
                        : status === 'connecting'
                        ? 'Connecting to transcription service...'
                        : 'Click the microphone to start recording'
                      }
                    </p>
                    {status === 'recording' && (
                      <p className="text-xs text-gray-600">
                        Transcripts will appear here in real-time
                      </p>
                    )}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Question Generation Toggle Notification */}
          {lastGeneratedSegment && !dismissedSegments.has(lastGeneratedSegment) && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="mt-4 p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-30"></div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-green-300">
                      🎯 Questions generated for Segment {lastGeneratedSegment}
                    </span>
                    <p className="text-xs text-gray-300 mt-1">
                      You can continue speaking. Questions are ready for launch.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.location.href = '/host/ai-questions'}
                    className="px-3 py-1 bg-blue-500/30 hover:bg-blue-500/50 text-blue-300 text-xs rounded-lg transition-colors"
                  >
                    View Questions
                  </button>
                  <button
                    onClick={() => setDismissedSegments(prev => new Set([...prev, lastGeneratedSegment]))}
                    className="p-1 hover:bg-white/10 text-gray-400 hover:text-white rounded transition-colors"
                    title="Dismiss notification"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                <span>Total questions: {getTotalQuestionCount()}</span>
                <span>•</span>
                <span>Segment {lastGeneratedSegment} processed</span>
              </div>
            </motion.div>
          )}
        </GlassCard>

        {/* Debug Panel */}
        {showDebugPanel && (
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Debug Information</h3>
              <button
                onClick={() => setShowDebugPanel(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Speech API Support:</p>
                  <p className={debugInfo.speechApiSupported ? 'text-green-400' : 'text-red-400'}>
                    {debugInfo.speechApiSupported ? '✅ Supported' : '❌ Not Supported'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Speech API Initialized:</p>
                  <p className={debugInfo.speechApiInitialized ? 'text-green-400' : 'text-yellow-400'}>
                    {debugInfo.speechApiInitialized ? '✅ Yes' : '⏳ No'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">WebSocket State:</p>
                  <p className={
                    debugInfo.websocketState === 'connected' ? 'text-green-400' : 
                    debugInfo.websocketState === 'connecting' ? 'text-yellow-400' : 'text-red-400'
                  }>
                    {debugInfo.websocketState}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Audio Context:</p>
                  <p className={
                    debugInfo.audioContextState === 'recording' ? 'text-green-400' :
                    debugInfo.audioContextState === 'initialized' ? 'text-yellow-400' : 'text-red-400'
                  }>
                    {debugInfo.audioContextState}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-gray-400">Transcript Count:</p>
                <p className="text-white">{debugInfo.transcriptCount}</p>
              </div>
              
              <div>
                <p className="text-gray-400">Fallback Active:</p>
                <p className={debugInfo.fallbackActive ? 'text-yellow-400' : 'text-gray-400'}>
                  {debugInfo.fallbackActive ? '⚠️ Using Fallback' : '✅ Normal Operation'}
                </p>
              </div>
              
              {debugInfo.lastSpeechResult && (
                <div>
                  <p className="text-gray-400">Last Speech Result:</p>
                  <p className="text-white break-words">{debugInfo.lastSpeechResult}</p>
                </div>
              )}
              
              {debugInfo.lastError && (
                <div>
                  <p className="text-gray-400">Last Error:</p>
                  <p className="text-red-400 break-words">{debugInfo.lastError}</p>
                </div>
              )}
              
              <div>
                <p className="text-gray-400">Browser:</p>
                <p className="text-white break-words text-xs">{debugInfo.browserInfo}</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Debug Toggle Button */}
        {!showDebugPanel && (
          <button
            onClick={() => setShowDebugPanel(true)}
            className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
          >
            Show Debug Info
          </button>
        )}

        {/* Guest Link Generator */}
        <GuestLinkGenerator meetingId={activeRoom?._id || 'demo-room'} />
      </motion.div>
      )}
    </DashboardLayout>
  );
};

export default AudioCapture;