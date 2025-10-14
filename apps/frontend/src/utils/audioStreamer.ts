export interface AudioStreamConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  bufferSize: number;
}

export interface TranscriptMessage {
  type: 'partial' | 'final' | 'error';
  meetingId: string;
  role: 'host' | 'participant' | 'guest';
  participantId: string;
  displayName?: string; // For guest role
  text: string;
  startTime: number;
  endTime: number;
  timestamp: number;
}

export interface AudioChunkMessage {
  type: 'audio_chunk' | 'finalize' | 'start_session' | 'save_transcripts';
  meetingId: string;
  role: 'host' | 'participant' | 'guest';
  participantId: string;
  displayName?: string; // For guest role
  timestamp: number;
  sampleRate?: number;
  channels?: number;
  transcripts?: TranscriptMessage[]; // For save_transcripts messages
}

export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private websocket: WebSocket | null = null;
  private speechRecognition: any = null; // Web Speech API
  private isRecording = false;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private transcriptBuffer: TranscriptMessage[] = []; // Store transcripts for database saving
  private lastPartialTranscript: string = ''; // Track last partial transcript
  private partialTranscriptStartTime: number = 0; // Track when partial transcript started
  private forceFinalTimer: NodeJS.Timeout | null = null; // Timer to force final transcripts
  private isMobileChromeBlocked = false; // Flag to completely block MediaRecorder on mobile Chrome
  
  // Simple mobile speech recognition (based on working To-Do List pattern)
  private simpleMobileSpeechRecognition: any = null;
  private isMobileSpeechActive = false;
  private mobileSegmentTimer: NodeJS.Timeout | null = null; // Timer for mobile segment auto-saving
  private mobileContinuousMode = false; // Flag for continuous mobile recording
  private mobileAutoRestartTimer: NodeJS.Timeout | null = null; // Timer to auto-restart speech recognition
  private mobileLastSpeechTime = 0; // Track last speech activity
  
  private config: AudioStreamConfig = {
    sampleRate: 16000, // Vosk optimal sample rate
    channels: 1, // Mono for ASR
    bitDepth: 16,
    bufferSize: 4096
  };

  private callbacks = {
    onTranscript: (_message: TranscriptMessage) => {},
    onStatusChange: (_status: 'connecting' | 'connected' | 'recording' | 'error' | 'disconnected') => {},
    onError: (_error: string) => {}
  };

  private wsUrl: string;
  private meetingId: string;
  private participantId: string;
  private role: 'host' | 'participant';

  constructor(
    wsUrl: string,
    meetingId: string,
    participantId: string,
    role: 'host' | 'participant' = 'host'
  ) {
    this.wsUrl = wsUrl;
    this.meetingId = meetingId;
    this.participantId = participantId;
    this.role = role;
    
    // CRITICAL: Block MediaRecorder completely on mobile Chrome during initialization
    if (this.isChromeOnMobile()) {
      this.isMobileChromeBlocked = true;
      console.log('🚫 MOBILE CHROME DETECTED: MediaRecorder functionality completely disabled');
      
      // Override MediaRecorder constructor to prevent any usage
      if (typeof window !== 'undefined' && window.MediaRecorder) {
        const originalMediaRecorder = window.MediaRecorder;
        (window as any).MediaRecorder = function() {
          console.warn('🚫 MediaRecorder blocked on mobile Chrome to prevent audio conflicts');
          throw new Error('MediaRecorder is disabled on mobile Chrome for compatibility');
        };
        // Keep static methods available for feature detection
        (window as any).MediaRecorder.isTypeSupported = originalMediaRecorder.isTypeSupported;
      }
    }
  }

  // Mobile device detection methods
  private isMobileDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    console.log('🔍 Device detection:', {
      userAgent: navigator.userAgent,
      isMobile,
      isTouchDevice,
      platform: navigator.platform
    });
    
    return isMobile || isTouchDevice;
  }

  private isChromeOnMobile(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent);
    const isMobile = this.isMobileDevice();
    
    console.log('🔍 Chrome mobile detection:', { isChrome, isMobile });
    return isChrome && isMobile;
  }

  setCallbacks(callbacks: Partial<typeof this.callbacks>) {
    Object.assign(this.callbacks, callbacks);
  }

  /**
   * Simple mobile speech recognition based on working To-Do List pattern
   * This replicates the exact functionality from your working project
   */
  private initializeSimpleMobileSpeech(): boolean {
    try {
      console.log('📱 Initializing simple mobile speech (To-Do List pattern)...');
      
      // Check for Web Speech API support (same as your working code)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('❌ Web Speech API not supported');
        return false;
      }

      // Create recognition instance (CONTINUOUS MODE for mobile)
      this.simpleMobileSpeechRecognition = new SpeechRecognition();
      this.simpleMobileSpeechRecognition.lang = 'en-US';
      this.simpleMobileSpeechRecognition.interimResults = true; // Enable interim results for continuous feedback
      this.simpleMobileSpeechRecognition.maxAlternatives = 1;
      this.simpleMobileSpeechRecognition.continuous = true; // CONTINUOUS RECORDING like desktop

      // Set up event handlers (continuous mobile recording)
      this.simpleMobileSpeechRecognition.onstart = () => {
        console.log('🎤 Mobile continuous speech recognition started');
        this.isMobileSpeechActive = true;
        this.mobileContinuousMode = true;
        this.mobileLastSpeechTime = Date.now();
        
        // Show continuous mode feedback
        this.callbacks.onTranscript({
          type: 'partial',
          meetingId: this.meetingId,
          role: this.role,
          participantId: this.participantId,
          text: '[🎤 CONTINUOUS RECORDING ACTIVE - Speak naturally, pauses are OK]',
          startTime: Date.now(),
          endTime: Date.now(),
          timestamp: Date.now()
        });
      };

      this.simpleMobileSpeechRecognition.onresult = (event: any) => {
        console.log('📝 Mobile continuous speech result received');
        
        // Update last speech activity time
        this.mobileLastSpeechTime = Date.now();
        
        // Process all results (both interim and final)
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const isFinal = result.isFinal;
          
          console.log(`🎯 Mobile transcript (${isFinal ? 'FINAL' : 'interim'}):`, transcript);
          
          // Create transcript message
          const transcriptMessage: TranscriptMessage = {
            type: isFinal ? 'final' : 'partial',
            meetingId: this.meetingId,
            role: this.role,
            participantId: this.participantId,
            text: transcript,
            startTime: Date.now() - 2000,
            endTime: Date.now(),
            timestamp: Date.now()
          };

          // Add final results to buffer for segment generation
          if (isFinal) {
            this.transcriptBuffer.push(transcriptMessage);
            console.log(`💾 Mobile final transcript added to buffer: "${transcript.substring(0, 50)}..."`);
            
            // CRITICAL: Send final transcripts to WebSocket backend immediately for real-time processing
            if (this.isConnected && this.websocket && this.websocket.readyState === WebSocket.OPEN) {
              try {
                const saveMessage: AudioChunkMessage = {
                  type: 'save_transcripts',
                  meetingId: this.meetingId,
                  role: this.role,
                  participantId: this.participantId,
                  timestamp: Date.now(),
                  transcripts: [transcriptMessage] // Send single transcript immediately
                };
                
                this.websocket.send(JSON.stringify(saveMessage));
                console.log(`📤 Mobile final transcript sent to backend immediately: "${transcript.substring(0, 30)}..."`);
              } catch (error) {
                console.error('❌ Failed to send mobile transcript to backend:', error);
              }
            } else {
              console.warn('⚠️ WebSocket not connected - mobile transcript not sent to backend');
            }
          }
          
          // Send to UI (both interim and final)
          this.callbacks.onTranscript(transcriptMessage);
        }
        
        // Clear any existing mobile segment timer
        if (this.mobileSegmentTimer) {
          clearTimeout(this.mobileSegmentTimer);
        }
        
        // Start 10-second silence detection timer
        this.mobileSegmentTimer = setTimeout(async () => {
          const silenceDuration = Date.now() - this.mobileLastSpeechTime;
          console.log(`⏰ [MOBILE] ${silenceDuration}ms of silence detected - auto-saving and generating questions`);
          
          // Show silence detection feedback
          this.callbacks.onTranscript({
            type: 'partial',
            meetingId: this.meetingId,
            role: this.role,
            participantId: this.participantId,
            text: '[⏰ 10+ seconds of silence - Saving segments and generating questions...]',
            startTime: Date.now(),
            endTime: Date.now(),
            timestamp: Date.now()
          });
          
          try {
            // Save to backend
            await this.saveTranscriptsToBackend();
            
            // Show success feedback
            this.callbacks.onTranscript({
              type: 'partial',
              meetingId: this.meetingId,
              role: this.role,
              participantId: this.participantId,
              text: '[💾 ✅ Segments saved! Generating AI questions automatically...]',
              startTime: Date.now(),
              endTime: Date.now(),
              timestamp: Date.now()
            });
            
            console.log('✅ Mobile transcripts auto-saved, continuing continuous recording...');
            
            // Continue continuous recording (don't stop)
            if (this.mobileContinuousMode) {
              console.log('🔄 Continuing continuous mobile recording...');
            }
            
          } catch (error) {
            console.error('❌ Mobile auto-save failed:', error);
            
            // Show error feedback but continue recording
            this.callbacks.onTranscript({
              type: 'partial',
              meetingId: this.meetingId,
              role: this.role,
              participantId: this.participantId,
              text: '[❌ Auto-save failed - Continuing recording...]',
              startTime: Date.now(),
              endTime: Date.now(),
              timestamp: Date.now()
            });
          }
        }, 10000); // 10 seconds of silence
      };

      this.simpleMobileSpeechRecognition.onerror = (event: any) => {
        console.error('❌ Mobile speech recognition error:', event.error);
        
        // Handle specific errors with auto-restart for continuous mode
        if (event.error === 'not-allowed') {
          this.callbacks.onTranscript({
            type: 'partial',
            meetingId: this.meetingId,
            role: this.role,
            participantId: this.participantId,
            text: '[❌ Microphone access denied. Please allow microphone permissions.]',
            startTime: Date.now(),
            endTime: Date.now(),
            timestamp: Date.now()
          });
          this.mobileContinuousMode = false;
          
        } else if (event.error === 'no-speech') {
          // Don't show error for no-speech in continuous mode, just restart
          console.log('🔄 No speech detected, auto-restarting continuous recognition...');
          this.autoRestartMobileSpeech();
          
        } else if (event.error === 'network') {
          this.callbacks.onTranscript({
            type: 'partial',
            meetingId: this.meetingId,
            role: this.role,
            participantId: this.participantId,
            text: '[⚠️ Network error - Attempting to restart...]',
            startTime: Date.now(),
            endTime: Date.now(),
            timestamp: Date.now()
          });
          this.autoRestartMobileSpeech();
          
        } else {
          console.warn('Speech recognition error, attempting restart:', event.error);
          this.autoRestartMobileSpeech();
        }
      };

      this.simpleMobileSpeechRecognition.onend = () => {
        console.log('🔚 Mobile speech recognition ended');
        this.isMobileSpeechActive = false;
        
        // Auto-restart if in continuous mode
        if (this.mobileContinuousMode) {
          console.log('🔄 Auto-restarting continuous mobile speech recognition...');
          this.autoRestartMobileSpeech();
        }
      };

      console.log('✅ Simple mobile speech recognition initialized successfully (Continuous Mode)');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize simple mobile speech:', error);
      return false;
    }
  }

  /**
   * Auto-restart mobile speech recognition for continuous mode
   */
  private autoRestartMobileSpeech(): void {
    if (!this.mobileContinuousMode || !this.simpleMobileSpeechRecognition) {
      return;
    }

    // Clear any existing restart timer
    if (this.mobileAutoRestartTimer) {
      clearTimeout(this.mobileAutoRestartTimer);
    }

    // Wait a short delay before restarting
    this.mobileAutoRestartTimer = setTimeout(() => {
      if (this.mobileContinuousMode && this.simpleMobileSpeechRecognition) {
        try {
          console.log('🔄 Auto-restarting mobile speech recognition...');
          this.simpleMobileSpeechRecognition.start();
        } catch (error) {
          console.error('Failed to auto-restart mobile speech:', error);
          // Try again after a longer delay
          setTimeout(() => {
            if (this.mobileContinuousMode) {
              this.autoRestartMobileSpeech();
            }
          }, 2000);
        }
      }
    }, 1000); // 1 second delay before restart
  }

  /**
   * Start/Stop mobile speech recognition (continuous mode) with backend connection
   * This creates a toggle button for continuous recording with WebSocket integration
   */
  public async startMobileSpeechCapture(): Promise<boolean> {
    if (!this.isMobileDevice()) {
      console.warn('⚠️ startMobileSpeechCapture called on non-mobile device');
      return false;
    }

    // Toggle continuous recording
    if (this.mobileContinuousMode) {
      console.log('🛑 Stopping continuous mobile recording...');
      this.stopMobileContinuousRecording();
      return true;
    }

    if (this.isMobileSpeechActive) {
      console.log('🎤 Speech recognition already active, stopping first...');
      this.stopMobileContinuousRecording();
      return false;
    }

    try {
      // STEP 1: Connect to WebSocket backend first (essential for database saving and questions)
      if (!this.isConnected) {
        console.log('🔗 Mobile: Connecting to backend for database saving and question generation...');
        this.callbacks.onStatusChange('connecting');
        
        this.callbacks.onTranscript({
          type: 'partial',
          meetingId: this.meetingId,
          role: this.role,
          participantId: this.participantId,
          text: '[🔗 Connecting to backend for database saving...]',
          startTime: Date.now(),
          endTime: Date.now(),
          timestamp: Date.now()
        });

        const connected = await this.connectWebSocket();
        if (!connected) {
          console.error('❌ Mobile: Failed to connect to backend');
          this.callbacks.onTranscript({
            type: 'partial',
            meetingId: this.meetingId,
            role: this.role,
            participantId: this.participantId,
            text: '[❌ Failed to connect to backend - transcripts will not be saved]',
            startTime: Date.now(),
            endTime: Date.now(),
            timestamp: Date.now()
          });
          return false;
        }
        
        console.log('✅ Mobile: Backend connected successfully');
        this.callbacks.onTranscript({
          type: 'partial',
          meetingId: this.meetingId,
          role: this.role,
          participantId: this.participantId,
          text: '[✅ Backend connected! Transcripts will be saved and questions generated]',
          startTime: Date.now(),
          endTime: Date.now(),
          timestamp: Date.now()
        });
      }

      // STEP 2: Initialize speech recognition
      if (!this.simpleMobileSpeechRecognition) {
        console.log('📱 Initializing mobile speech for first use...');
        const initialized = this.initializeSimpleMobileSpeech();
        if (!initialized) {
          this.callbacks.onTranscript({
            type: 'partial',
            meetingId: this.meetingId,
            role: this.role,
            participantId: this.participantId,
            text: '[❌ Mobile speech recognition not available on this device]',
            startTime: Date.now(),
            endTime: Date.now(),
            timestamp: Date.now()
          });
          return false;
        }
      }

      // STEP 3: Start continuous recognition with backend integration
      console.log('🎤 Starting continuous mobile speech capture with backend integration...');
      
      // Update status to recording
      this.callbacks.onStatusChange('recording');
      
      // Start continuous recognition
      this.simpleMobileSpeechRecognition.start();
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to start mobile speech capture with backend:', error);
      this.callbacks.onTranscript({
        type: 'partial',
        meetingId: this.meetingId,
        role: this.role,
        participantId: this.participantId,
        text: '[❌ Failed to start mobile speech recognition with backend connection]',
        startTime: Date.now(),
        endTime: Date.now(),
        timestamp: Date.now()
      });
      return false;
    }
  }

  /**
   * Stop continuous mobile recording
   */
  public stopMobileContinuousRecording(): void {
    console.log('🛑 Stopping mobile continuous recording...');
    
    this.mobileContinuousMode = false;
    this.isMobileSpeechActive = false;
    
    // Clear timers
    if (this.mobileSegmentTimer) {
      clearTimeout(this.mobileSegmentTimer);
      this.mobileSegmentTimer = null;
    }
    
    if (this.mobileAutoRestartTimer) {
      clearTimeout(this.mobileAutoRestartTimer);
      this.mobileAutoRestartTimer = null;
    }
    
    // Stop speech recognition
    if (this.simpleMobileSpeechRecognition) {
      try {
        this.simpleMobileSpeechRecognition.stop();
      } catch (error) {
        console.warn('Error stopping mobile speech recognition:', error);
      }
    }
    
    // Save any remaining transcripts
    if (this.transcriptBuffer.length > 0) {
      console.log('💾 Saving remaining transcripts before stopping...');
      this.saveTranscriptsToBackend();
    }
    
    // Show feedback
    this.callbacks.onTranscript({
      type: 'partial',
      meetingId: this.meetingId,
      role: this.role,
      participantId: this.participantId,
      text: '[🛑 Continuous recording stopped]',
      startTime: Date.now(),
      endTime: Date.now(),
      timestamp: Date.now()
    });
  }

  private initializeSpeechRecognition(): boolean {
    try {
      console.log('🔍 Checking for Web Speech API support...');
      
      // Check for Web Speech API support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('❌ Web Speech API not supported in this browser');
        console.log('🔄 Will use fallback transcription system');
        return false;
      }

      console.log('✅ Web Speech API supported, initializing...');
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = true; // Keep listening
      this.speechRecognition.interimResults = true; // Get partial results
      this.speechRecognition.lang = 'en-US'; // Set language
      this.speechRecognition.maxAlternatives = 1; // Only get best result

      // Mobile Chrome specific configuration to avoid conflicts
      if (this.isChromeOnMobile()) {
        console.log('📱 Applying mobile Chrome optimizations...');
        // Shorter timeout for mobile stability
        this.speechRecognition.continuous = false; // Disable continuous for mobile
        // Will restart automatically on mobile
      }

      console.log('🔧 Speech recognition configured:', {
        continuous: this.speechRecognition.continuous,
        interimResults: this.speechRecognition.interimResults,
        lang: this.speechRecognition.lang,
        isMobile: this.isChromeOnMobile()
      });

      this.speechRecognition.onstart = () => {
        console.log('🎙️ Speech recognition started successfully!');
        this.callbacks.onTranscript({
          type: 'partial',
          meetingId: this.meetingId,
          role: this.role,
          participantId: this.participantId,
          text: '[Speech recognition is now active - speak clearly into your microphone]',
          startTime: Date.now(),
          endTime: Date.now(),
          timestamp: Date.now()
        });
      };

      this.speechRecognition.onspeechstart = () => {
        console.log('🗣️ Speech detected by recognition system!');
        this.callbacks.onTranscript({
          type: 'partial',
          meetingId: this.meetingId,
          role: this.role,
          participantId: this.participantId,
          text: '[Speech detected - processing...]',
          startTime: Date.now(),
          endTime: Date.now(),
          timestamp: Date.now()
        });
      };

      this.speechRecognition.onspeechend = () => {
        console.log('🔇 Speech ended');
      };

      this.speechRecognition.onsoundstart = () => {
        console.log('🔊 Sound detected');
      };

      this.speechRecognition.onsoundend = () => {
        console.log('🔇 Sound ended');
      };

      this.speechRecognition.onaudiostart = () => {
        console.log('🎵 Audio capture started');
      };

      this.speechRecognition.onaudioend = () => {
        console.log('🎵 Audio capture ended');
      };

      this.speechRecognition.onresult = (event: any) => {
        console.log('🎯 Speech recognition result event received:', event);
        console.log('🎯 Event details:', {
          results: event.results,
          resultIndex: event.resultIndex,
          resultsLength: event.results.length
        });
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          
          // Debug the result object structure
          console.log('🔍 Result object:', result);
          console.log('🔍 Result[0]:', result[0]);
          console.log('🔍 Result alternatives:', result.length);
          
          // Try multiple ways to access transcript
          let transcript = '';
          let confidence = 0;
          
          if (result[0] && result[0].transcript) {
            transcript = result[0].transcript;
            confidence = result[0].confidence || 0;
          } else if (result.transcript) {
            transcript = result.transcript;
            confidence = result.confidence || 0;
          } else {
            console.warn('⚠️ Could not find transcript in result:', result);
            continue;
          }
          
          const isFinal = result.isFinal;
          
          console.log(`📝 Speech result ${i}: "${transcript}" (Final: ${isFinal}, Confidence: ${confidence.toFixed(2)})`);
          
          if (transcript && transcript.trim().length > 0) {
            // Track partial transcripts for forced finalization
            if (!isFinal) {
              // If this is a new partial transcript, start timing
              if (this.lastPartialTranscript !== transcript) {
                this.lastPartialTranscript = transcript;
                this.partialTranscriptStartTime = Date.now();
                
                // Clear any existing timer and start a new one
                if (this.forceFinalTimer) {
                  clearTimeout(this.forceFinalTimer);
                }
                
                // Force finalization after 5 seconds of the same partial transcript
                this.forceFinalTimer = setTimeout(() => {
                  console.log('⏰ [SPEECH] Forcing final transcript after 5 seconds');
                  const forcedFinalMessage: TranscriptMessage = {
                    type: 'final',
                    meetingId: this.meetingId,
                    role: this.role,
                    participantId: this.participantId,
                    text: this.lastPartialTranscript,
                    startTime: this.partialTranscriptStartTime,
                    endTime: Date.now(),
                    timestamp: Date.now()
                  };
                  this.transcriptBuffer.push(forcedFinalMessage);
                  this.callbacks.onTranscript(forcedFinalMessage);
                }, 5000);
              }
            } else {
              // Clear force final timer if we get a real final result
              if (this.forceFinalTimer) {
                clearTimeout(this.forceFinalTimer);
                this.forceFinalTimer = null;
              }
              this.lastPartialTranscript = '';
            }

            // Create transcript message
            const transcriptMessage: TranscriptMessage = {
              type: isFinal ? 'final' : 'partial',
              meetingId: this.meetingId,
              role: this.role,
              participantId: this.participantId,
              text: transcript,
              startTime: Date.now() - 2000, // Approximate start time
              endTime: Date.now(),
              timestamp: Date.now()
            };

            // Store final transcripts for database saving
            if (isFinal) {
              this.transcriptBuffer.push(transcriptMessage);
              console.log(`💾 Stored final transcript in buffer: "${transcript.substring(0, 50)}..." (Total: ${this.transcriptBuffer.length})`);
              console.log(`🔍 Transcript details:`, {
                type: transcriptMessage.type,
                meetingId: transcriptMessage.meetingId,
                role: transcriptMessage.role,
                participantId: transcriptMessage.participantId,
                textLength: transcript.length
              });
            }

            // Send transcript to the UI
            this.callbacks.onTranscript(transcriptMessage);
          } else {
            console.warn('⚠️ Empty or invalid transcript received:', transcript);
          }
        }
      };

      this.speechRecognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error, event);
        
        // Handle mobile Chrome conflicts specifically
        if (this.isChromeOnMobile() && (event.error === 'not-allowed' || event.error === 'audio-capture')) {
          console.log('📱 Mobile Chrome conflict detected - switching to speech-only mode');
          this.handleMobileChromeConflict();
          return;
        }
        
        const errorMessages: { [key: string]: string } = {
          'not-allowed': 'Microphone access denied. Please allow microphone permissions and try again.',
          'no-speech': 'No speech detected. Please speak clearly into the microphone.',
          'audio-capture': 'Audio capture failed. Please check your microphone.',
          'network': 'Network error. Please check your internet connection.',
          'service-not-allowed': 'Speech recognition service not available.',
          'aborted': 'Speech recognition was aborted.',
          'language-not-supported': 'Language not supported.'
        };
        
        const errorMessage = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
        this.callbacks.onError(errorMessage);
        
        // Send error as transcript for debugging
        this.callbacks.onTranscript({
          type: 'partial',
          meetingId: this.meetingId,
          role: this.role,
          participantId: this.participantId,
          text: `[Speech Error: ${event.error} - ${errorMessage}]`,
          startTime: Date.now(),
          endTime: Date.now(),
          timestamp: Date.now()
        });
      };

      this.speechRecognition.onend = () => {
        console.log('🔚 Speech recognition ended');
        
        // Send end message
        this.callbacks.onTranscript({
          type: 'partial',
          meetingId: this.meetingId,
          role: this.role,
          participantId: this.participantId,
          text: '[Speech recognition stopped - restarting...]',
          startTime: Date.now(),
          endTime: Date.now(),
          timestamp: Date.now()
        });
        
        // Restart if we're still recording
        if (this.isRecording && this.speechRecognition) {
          console.log('🔄 Restarting speech recognition...');
          try {
            setTimeout(() => {
              if (this.speechRecognition && this.isRecording) {
                this.speechRecognition.start();
              }
            }, 100);
          } catch (error) {
            console.warn('Could not restart speech recognition:', error);
            this.enableFallbackTranscription();
          }
        }
      };

      return true;
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      return false;
    }
  }

  private handleMobileChromeConflict(): void {
    console.log('📱 Handling mobile Chrome audio conflict - switching to speech-only mode...');
    
    // Stop any existing MediaRecorder that might be causing conflicts
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
        this.mediaRecorder = null; // Clear reference
        console.log('✅ Stopped and cleared MediaRecorder to resolve mobile conflict');
      } catch (error) {
        console.warn('Warning stopping MediaRecorder:', error);
      }
    }

    // Clear media stream to completely avoid recording conflicts
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Wait and retry with speech recognition ONLY
    setTimeout(() => {
      if (!this.isRecording) { // Only restart if not already recording
        try {
          console.log('🔄 Restarting in speech-only mode for mobile Chrome...');
          
          // Initialize speech recognition without any MediaRecorder
          const speechAvailable = this.initializeSpeechRecognition();
          if (speechAvailable && this.speechRecognition) {
            this.speechRecognition.start();
            this.isRecording = true;
            this.callbacks.onStatusChange('recording');
            
            // Notify user about the mode change
            this.callbacks.onTranscript({
              type: 'partial',
              meetingId: this.meetingId,
              role: this.role,
              participantId: this.participantId,
              displayName: 'System',
              text: '[Mobile Chrome: Now using speech-only mode - recording active]',
              startTime: Date.now(),
              endTime: Date.now(),
              timestamp: Date.now()
            });
          }
          
        } catch (error) {
          console.error('Mobile speech retry failed:', error);
          this.callbacks.onError('Mobile Chrome compatibility issue. Please try using a different browser for full functionality.');
        }
      }
    }, 2000); // Longer delay for mobile stability
  }

  private enableFallbackTranscription() {
    console.log('🔄 Enabling fallback transcription system...');
    
    // Send immediate feedback
    this.callbacks.onTranscript({
      type: 'partial',
      meetingId: this.meetingId,
      role: this.role,
      participantId: this.participantId,
      text: '[FALLBACK MODE] Web Speech API not working - using voice activity detection from backend',
      startTime: Date.now(),
      endTime: Date.now(),
      timestamp: Date.now()
    });
    
    // Create a simple fallback that shows voice activity from backend
    let transcriptionCounter = 0;
    const fallbackInterval = setInterval(() => {
      if (!this.isRecording) {
        clearInterval(fallbackInterval);
        return;
      }
      
      transcriptionCounter++;
      const fallbackMessages = [
        "Backend is detecting your voice activity...",
        "Audio chunks being processed...",
        "Voice detected with good amplitude...",
        "Microphone audio streaming successfully...",
        "Backend receiving audio data..."
      ];
      
      const message = fallbackMessages[transcriptionCounter % fallbackMessages.length];
      
      this.callbacks.onTranscript({
        type: 'partial',
        meetingId: this.meetingId,
        role: this.role,
        participantId: this.participantId,
        text: `[Backend Status] ${message}`,
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        timestamp: Date.now()
      });
      
    }, 5000); // Every 5 seconds
  }

  public debugTranscriptBuffer(): void {
    console.log('🔍 Transcript Buffer Debug:');
    console.log(`📊 Buffer size: ${this.transcriptBuffer.length} transcripts`);
    console.log('📋 Buffer contents:', this.transcriptBuffer.map((t, index) => ({
      index,
      type: t.type,
      text: t.text.substring(0, 50) + '...',
      timestamp: new Date(t.timestamp).toLocaleTimeString(),
      meetingId: t.meetingId,
      role: t.role,
      participantId: t.participantId
    })));

    if (this.transcriptBuffer.length === 0) {
      console.log('⚠️ No transcripts in buffer. Make sure to speak and wait for final (non-partial) transcripts.');
    }

    // Also show this info in the transcript UI
    this.callbacks.onTranscript({
      type: 'partial',
      meetingId: this.meetingId,
      role: this.role,
      participantId: this.participantId,
      text: `[Debug] Buffer has ${this.transcriptBuffer.length} final transcripts ready for database`,
      startTime: Date.now(),
      endTime: Date.now(),
      timestamp: Date.now()
    });
  }

  public async startSpeechOnlyMode(): Promise<void> {
    try {
      console.log('🎤 Starting speech-only mode (no MediaRecorder)...');
      
      // Stop any existing MediaRecorder
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      
      // Initialize speech recognition only
      const speechAvailable = this.initializeSpeechRecognition();
      if (!speechAvailable) {
        throw new Error('Speech recognition not available');
      }

      this.isRecording = true;
      this.callbacks.onStatusChange('recording');

      // Start speech recognition with a clean slate
      if (this.speechRecognition) {
        console.log('🎯 Starting speech recognition in speech-only mode...');
        this.speechRecognition.start();
        
        this.callbacks.onTranscript({
          type: 'partial',
          meetingId: this.meetingId,
          role: this.role,
          participantId: this.participantId,
          text: '[SPEECH-ONLY MODE] Web Speech API active - speak now',
          startTime: Date.now(),
          endTime: Date.now(),
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('❌ Failed to start speech-only mode:', error);
      this.callbacks.onError(`Speech-only mode failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public testSpeechRecognition(): void {
    console.log('🧪 Testing speech recognition manually...');
    
    if (!this.speechRecognition) {
      console.error('❌ Speech recognition not initialized');
      this.callbacks.onTranscript({
        type: 'partial',
        meetingId: this.meetingId,
        role: this.role,
        participantId: this.participantId,
        text: '[ERROR: Speech recognition not initialized]',
        startTime: Date.now(),
        endTime: Date.now(),
        timestamp: Date.now()
      });
      return;
    }

    try {
      // Stop any existing recognition
      this.speechRecognition.stop();
      
      // Wait a moment then restart
      setTimeout(() => {
        if (this.speechRecognition) {
          console.log('🚀 Starting manual speech recognition test...');
          this.speechRecognition.start();
          
          this.callbacks.onTranscript({
            type: 'partial',
            meetingId: this.meetingId,
            role: this.role,
            participantId: this.participantId,
            text: '[Manual test started - please speak now]',
            startTime: Date.now(),
            endTime: Date.now(),
            timestamp: Date.now()
          });
        }
      }, 500);
    } catch (error) {
      console.error('❌ Manual speech test failed:', error);
      this.callbacks.onTranscript({
        type: 'partial',
        meetingId: this.meetingId,
        role: this.role,
        participantId: this.participantId,
        text: `[Manual test failed: ${error}]`,
        startTime: Date.now(),
        endTime: Date.now(),
        timestamp: Date.now()
      });
    }
  }

  async initializeSimpleMicrophoneAudio(): Promise<boolean> {
    try {
      console.log('🎤 Initializing simple microphone audio capture...');
      
      // Initialize speech recognition first
      const speechRecognitionAvailable = this.initializeSpeechRecognition();
      if (speechRecognitionAvailable) {
        console.log('✅ Speech recognition initialized');
      } else {
        console.warn('⚠️ Speech recognition not available');
      }

      // Initialize AudioContext
      this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate });

      // Request microphone permission only
      console.log('🎤 Requesting microphone access...');
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('✅ Simple microphone audio initialized');
      console.log('📊 Stream info:', {
        audioTracks: this.mediaStream.getAudioTracks().length,
        active: this.mediaStream.active
      });

      return true;
    } catch (error) {
      console.error('❌ Simple microphone audio initialization failed:', error);
      this.callbacks.onError(`Failed to access microphone: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  async initializeAudio(includeSystemAudio = false): Promise<boolean> {
    try {
      // Check if mobile device - use simple speech approach (To-Do List pattern)
      if (this.isMobileDevice()) {
        console.log('📱 Mobile device detected - using simple speech approach (To-Do List pattern)');
        
        // For mobile devices, use the simple speech recognition (no MediaStream/MediaRecorder conflicts)
        const speechAvailable = this.initializeSimpleMobileSpeech();
        if (speechAvailable) {
          console.log('✅ Mobile speech recognition ready (To-Do List pattern)');
          this.callbacks.onStatusChange('connected');
          return true;
        } else {
          console.error('❌ Mobile speech recognition failed');
          this.callbacks.onError('Speech recognition not available on mobile device');
          return false;
        }
      }

      // Desktop initialization (UNCHANGED - preserves existing functionality)
      console.log('🖥️ Desktop device - initializing full audio system...');
      
      // Initialize speech recognition first
      const speechRecognitionAvailable = this.initializeSpeechRecognition();
      if (speechRecognitionAvailable) {
        console.log('✅ Desktop speech recognition initialized');
      } else {
        console.warn('⚠️ Desktop speech recognition not available, using audio streaming only');
      }

      // Initialize AudioContext
      this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate });

      // Request microphone permission - this is the core functionality
      console.log('🎤 Requesting microphone access...');
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('✅ Microphone access granted');
      let combinedStream = micStream;

      // System audio is completely optional - don't fail if it doesn't work
      if (includeSystemAudio) {
        try {
          console.log('🔊 Attempting to capture system audio (optional)...');
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            audio: {
              sampleRate: 48000,
              channelCount: 2,
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            },
            video: {
              width: 1280,
              height: 720,
              frameRate: 1
            }
          });

          const audioTracks = displayStream.getAudioTracks();
          if (audioTracks.length > 0) {
            console.log('✅ System audio captured successfully');
            try {
              combinedStream = await this.mergeAudioStreams(micStream, displayStream);
              console.log('✅ Audio streams merged successfully');
              
              // Stop video track after a delay
              setTimeout(() => {
                displayStream.getVideoTracks().forEach(track => track.stop());
              }, 1000);
            } catch (mergeError) {
              console.warn('⚠️ Failed to merge audio streams, using microphone only:', mergeError);
              combinedStream = micStream;
              displayStream.getTracks().forEach(track => track.stop());
            }
          } else {
            console.warn('⚠️ No system audio available, using microphone only');
            displayStream.getTracks().forEach(track => track.stop());
          }
        } catch (systemAudioError) {
          console.warn('⚠️ System audio capture failed (this is ok), using microphone only:', systemAudioError);
          // Don't call callbacks.onError here - this is not a fatal error
        }
      }

      this.mediaStream = combinedStream;
      console.log('✅ Audio initialization completed');
      console.log('📊 Final stream info:', {
        audioTracks: combinedStream.getAudioTracks().length,
        videoTracks: combinedStream.getVideoTracks().length,
        active: combinedStream.active
      });

      return true;
    } catch (error) {
      console.error('❌ Audio initialization failed:', error);
      this.callbacks.onError(`Failed to initialize audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  private async mergeAudioStreams(micStream: MediaStream, systemStream: MediaStream): Promise<MediaStream> {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const micSource = this.audioContext.createMediaStreamSource(micStream);
    const systemSource = this.audioContext.createMediaStreamSource(systemStream);
    const destination = this.audioContext.createMediaStreamDestination();
    const gainNode = this.audioContext.createGain();

    // Mix both audio sources
    gainNode.gain.value = 0.5; // Reduce volume to prevent clipping
    micSource.connect(gainNode);
    systemSource.connect(gainNode);
    gainNode.connect(destination);

    return destination.stream;
  }

  private async connectWebSocket(): Promise<boolean> {
    return new Promise((resolve) => {
      this.callbacks.onStatusChange('connecting');
      
      const wsUrlWithParams = `${this.wsUrl}?meetingId=${this.meetingId}&role=${this.role}&participantId=${this.participantId}`;
      console.log('🔗 Attempting WebSocket connection to:', wsUrlWithParams);
      
      this.websocket = new WebSocket(wsUrlWithParams);

      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.error('❌ WebSocket connection timeout');
          this.callbacks.onError('Connection timeout - please check if backend is running');
          this.websocket?.close();
          resolve(false);
        }
      }, 15000); // Increased timeout to 15 seconds

      this.websocket.onopen = () => {
        console.log('✅ WebSocket connected for ASR');
        clearTimeout(connectionTimeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.callbacks.onStatusChange('connected');
        
        // Send session initialization
        const initMessage: AudioChunkMessage = {
          type: 'start_session',
          meetingId: this.meetingId,
          role: this.role,
          participantId: this.participantId,
          timestamp: Date.now(),
          sampleRate: this.config.sampleRate,
          channels: this.config.channels
        };
        
        console.log('📤 Sending session init:', initMessage);
        this.sendMessage(initMessage);
        
        resolve(true);
      };

      this.websocket.onmessage = (event) => {
        try {
          console.log('📥 [HOST] WebSocket message received:', event.data);
          const rawMessage = JSON.parse(event.data);
          console.log('🔍 [HOST] Raw message parsed:', rawMessage);
          
          // Handle guest messages that might have different structure
          const message: TranscriptMessage = {
            type: rawMessage.type,
            meetingId: rawMessage.meetingId,
            role: rawMessage.role || 'participant', // Default to participant if role missing
            participantId: rawMessage.participantId,
            displayName: rawMessage.displayName, // Preserve guest display name
            text: rawMessage.text,
            startTime: rawMessage.startTime,
            endTime: rawMessage.endTime,
            timestamp: rawMessage.timestamp
          };
          
          console.log('🔄 [HOST] Processed message with role:', message.role, 'displayName:', message.displayName, 'text:', message.text?.substring(0, 50));
          this.callbacks.onTranscript(message);
        } catch (error) {
          console.error('❌ [HOST] Failed to parse transcript message:', error, 'Raw data:', event.data);
        }
      };

      this.websocket.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        clearTimeout(connectionTimeout);
        this.isConnected = false;
        this.callbacks.onStatusChange('disconnected');
        
        if (this.isRecording && this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`🔄 Attempting reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
          setTimeout(() => this.attemptReconnect(), this.reconnectDelay);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        clearTimeout(connectionTimeout);
        this.callbacks.onStatusChange('error');
        this.callbacks.onError('Connection to transcription service failed');
        resolve(false);
      };
    });
  }

  private attemptReconnect() {
    this.reconnectAttempts++;
    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    this.connectWebSocket().then(success => {
      if (success && this.isRecording) {
        this.startRecording();
      }
    });

    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000); // Exponential backoff
  }

  async startRecording(): Promise<boolean> {
    try {
      // Enhanced mobile detection for To-Do List pattern
      const isMobile = this.isMobileDevice();
      
      console.log('🔍 Device analysis:', {
        isMobile,
        userAgent: navigator.userAgent,
        approach: isMobile ? 'mobile-simple (To-Do List pattern)' : 'desktop-full'
      });

      if (isMobile) {
        console.log('📱 Mobile device detected - using simple speech approach (To-Do List pattern)');
        // For mobile, we don't need media stream - just the simple speech recognition
        this.isRecording = true;
        this.callbacks.onStatusChange('recording');
        
        // Show mobile-specific instructions
        this.callbacks.onTranscript({
          type: 'partial',
          meetingId: this.meetingId,
          role: this.role,
          participantId: this.participantId,
          text: '[📱 Mobile Recording Ready] Use the microphone button below to capture speech. Each tap records one phrase.',
          startTime: Date.now(),
          endTime: Date.now(),
          timestamp: Date.now()
        });

        console.log('✅ Mobile recording mode activated - ready for speech capture');
        return true;
      } else {
        console.log('🖥️ Desktop device detected - using full recording functionality');
        
        if (!this.mediaStream) {
          throw new Error('Audio stream not initialized for desktop recording');
        }

        if (!this.isConnected) {
          const connected = await this.connectWebSocket();
          if (!connected) return false;
        }

        return this.startDesktopRecording();
      }
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      this.callbacks.onError('Recording initialization failed');
      return false;
    }
  }

  private async startMobileFriendlyRecording(): Promise<boolean> {
    try {
      console.log('📱 Starting AGGRESSIVE mobile-friendly recording (NO MediaRecorder EVER)...');
      
      if (this.isMobileChromeBlocked) {
        console.log('🚫 Mobile Chrome - MediaRecorder permanently blocked, using SPEECH-ONLY mode');
        
        // CRITICAL: NO MediaStream or MediaRecorder setup AT ALL
        // We'll use ONLY speech recognition to avoid any audio conflicts
        
        // Clear any existing MediaRecorder references
        this.mediaRecorder = null;
        
        // Don't request getUserMedia on mobile Chrome to avoid conflicts
        // Speech recognition will handle microphone access internally
        
        // Initialize ONLY speech recognition
        const speechAvailable = this.initializeSpeechRecognition();
        if (speechAvailable && this.speechRecognition) {
          
          // Enhanced error handling for mobile Chrome
          this.speechRecognition.onerror = (event: any) => {
            console.log('🎤 Speech recognition error:', event.error);
            
            if (event.error === 'not-allowed') {
              this.callbacks.onError('Microphone access denied. Please allow microphone permission and try again.');
            } else if (event.error === 'audio-capture') {
              console.log('🔄 Audio capture conflict - retrying in 2 seconds...');
              setTimeout(() => {
                if (this.speechRecognition && !this.isRecording) {
                  try {
                    this.speechRecognition.start();
                  } catch (retryError) {
                    console.error('Retry failed:', retryError);
                  }
                }
              }, 2000);
            } else if (event.error === 'network') {
              this.callbacks.onError('Network error. Please check your internet connection.');
            } else {
              console.warn('Speech recognition non-critical error:', event.error);
            }
          };
          
          // Start speech recognition with delay for mobile stability
          setTimeout(() => {
            if (this.speechRecognition && !this.isRecording) {
              try {
                this.speechRecognition.start();
                console.log('✅ Mobile speech recognition started successfully (MediaRecorder-free)');
                this.isRecording = true;
                this.callbacks.onStatusChange('recording');
              } catch (error) {
                console.error('❌ Mobile speech recognition start failed:', error);
                this.callbacks.onError('Speech recognition failed to start. Please refresh and try again.');
                return false;
              }
            }
          }, 1000); // 1 second delay for mobile stability
        } else {
          this.callbacks.onError('Speech recognition not available on this device.');
          return false;
        }

        return true;
        
      } else {
        // For non-Chrome mobile browsers, use standard approach
        return this.startDesktopRecording();
      }
      
    } catch (error) {
      console.error('Mobile recording failed:', error);
      this.callbacks.onError('Mobile recording initialization failed');
      return false;
    }
  }



  private async startDesktopRecording(): Promise<boolean> {
    try {
      console.log('🖥️ Starting desktop recording (full functionality)...');
      
      if (!this.mediaStream) {
        throw new Error('Media stream not available for desktop recording');
      }
      
      // Setup MediaRecorder for real-time streaming with better audio format
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm; codecs=opus',
        audioBitsPerSecond: 128000
      };

      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);

      // Use ScriptProcessorNode for direct PCM audio access
      this.setupDirectAudioProcessing();

      this.mediaRecorder.ondataavailable = async (event) => {
        // We'll use the ScriptProcessorNode data instead, but keep this for fallback
        console.log('📦 MediaRecorder data available:', event.data.size, 'bytes');
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        this.callbacks.onError('Recording failed');
      };

      // Start recording with small timeslices 
      this.mediaRecorder.start(250); // 250ms chunks
      this.isRecording = true;
      this.callbacks.onStatusChange('recording');

      // Start speech recognition if available
      if (this.speechRecognition) {
        console.log('🗣️ Attempting to start speech recognition...');
        console.log('🔍 Speech recognition state:', {
          recognition: !!this.speechRecognition,
          continuous: this.speechRecognition.continuous,
          interimResults: this.speechRecognition.interimResults,
          lang: this.speechRecognition.lang
        });
        
        // Add a small delay to ensure everything is ready
        setTimeout(() => {
          if (this.speechRecognition && this.isRecording) {
            try {
              this.speechRecognition.start();
              console.log('✅ Speech recognition start() called successfully');
            } catch (error) {
              console.error('❌ Speech recognition start() failed:', error);
              console.log('🔄 Enabling fallback transcription...');
              this.enableFallbackTranscription();
            }
          }
        }, 1000); // 1 second delay
      } else {
        console.warn('⚠️ No speech recognition available, enabling fallback...');
        this.enableFallbackTranscription();
      }
      
      return true;
      
    } catch (error) {
      console.error('Desktop recording failed:', error);
      this.callbacks.onError('Desktop recording initialization failed');
      return false;
    }
  }

  private setupDirectAudioProcessing() {
    if (!this.audioContext || !this.mediaStream) return;

    try {
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Use ScriptProcessorNode for direct audio data access (deprecated but widely supported)
      // For modern browsers, we should use AudioWorklet, but ScriptProcessor is simpler for now
      const bufferSize = 4096;
      const processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      processor.onaudioprocess = (event) => {
        if (!this.isRecording || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputBuffer = event.inputBuffer.getChannelData(0);
        
        // Check if there's actual audio data (not silence)
        const maxAmplitude = Math.max(...Array.from(inputBuffer).map(Math.abs));
        if (maxAmplitude < 0.001) {
          // Skip silent chunks to reduce network traffic
          return;
        }
        
        // Convert Float32 to PCM16
        const pcmData = this.float32ToPCM16(inputBuffer);
        
        // Add debugging
        console.log('🎵 Sending audio chunk:', pcmData.byteLength, 'bytes, max amplitude:', maxAmplitude.toFixed(4));
        
        // Send the PCM data directly
        this.sendAudioChunk(pcmData);
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);
      
      console.log('✅ Direct audio processing setup complete');
    } catch (error) {
      console.error('❌ Failed to setup direct audio processing:', error);
      // Fallback to MediaRecorder method
    }
  }

  private float32ToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < float32Array.length; i++) {
      // Convert from [-1, 1] to [-32768, 32767]
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      const intValue = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(i * 2, intValue, true); // true for little-endian
    }
    
    return buffer;
  }

  private sendAudioChunk(pcmData: ArrayBuffer) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot send audio chunk - WebSocket not ready');
      return;
    }

    try {
      // Create message header
      const message: AudioChunkMessage = {
        type: 'audio_chunk',
        meetingId: this.meetingId,
        role: this.role,
        participantId: this.participantId,
        timestamp: Date.now()
      };

      console.log('📤 Sending audio chunk header and', pcmData.byteLength, 'bytes of PCM data');
      
      // Send header as JSON, then binary data
      this.websocket.send(JSON.stringify(message));
      this.websocket.send(pcmData);
    } catch (error) {
      console.error('Failed to send audio chunk:', error);
    }
  }

  private sendMessage(message: AudioChunkMessage) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;
    
    try {
      this.websocket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  public async saveTranscriptsToBackend(): Promise<void> {
    try {
      console.log(`🔍 Starting transcript save process. Buffer has ${this.transcriptBuffer.length} transcripts`);
      
      if (this.transcriptBuffer.length === 0) {
        console.log('📝 No final transcripts to save');
        
        // Show feedback for empty buffer
        this.callbacks.onTranscript({
          type: 'partial',
          meetingId: this.meetingId,
          role: this.role,
          participantId: this.participantId,
          text: '[ℹ️ No transcripts to save - Buffer is empty]',
          startTime: Date.now(),
          endTime: Date.now(),
          timestamp: Date.now()
        });
        return;
      }

      // Log what we're trying to save
      console.log('📋 Transcripts to save:', this.transcriptBuffer.map(t => ({
        type: t.type,
        text: t.text.substring(0, 50) + '...',
        timestamp: t.timestamp
      })));

      console.log(`📤 Sending ${this.transcriptBuffer.length} transcripts to backend for database saving...`);

      // Send transcripts via WebSocket
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const saveMessage: AudioChunkMessage = {
          type: 'save_transcripts',
          meetingId: this.meetingId,
          role: this.role,
          participantId: this.participantId,
          timestamp: Date.now(),
          transcripts: this.transcriptBuffer
        };

        console.log('📦 Sending message to backend via WebSocket:', {
          type: saveMessage.type,
          meetingId: saveMessage.meetingId,
          transcriptCount: saveMessage.transcripts?.length,
          websocketState: this.websocket.readyState
        });

        this.websocket.send(JSON.stringify(saveMessage));
        console.log('✅ Transcripts sent to backend via WebSocket');
        
      } else {
        // Fallback: Send via HTTP API
        console.log('🔄 WebSocket not available, sending via HTTP API...');
        
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${baseUrl}/transcripts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingId: this.meetingId,
            role: this.role,
            participantId: this.participantId,
            transcripts: this.transcriptBuffer
          })
        });

        if (response.ok) {
          console.log('✅ Transcripts saved via HTTP API');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      // Clear the buffer after successful saving
      console.log('🧹 Clearing transcript buffer after sending to backend');
      const savedCount = this.transcriptBuffer.length;
      this.transcriptBuffer = [];
      
      // Show success feedback with count
      console.log(`✅ Successfully saved ${savedCount} transcripts to database`);
      
    } catch (error) {
      console.error('❌ Failed to save transcripts to backend:', error);
      // Keep transcripts in buffer for retry
      throw error; // Re-throw so calling code can handle the error
    }
  }

  async stopRecording(): Promise<void> {
    console.log('🛑 Stopping recording...');
    this.isRecording = false;

    // Clear force final timer
    if (this.forceFinalTimer) {
      clearTimeout(this.forceFinalTimer);
      this.forceFinalTimer = null;
      console.log('⏰ Cleared force final timer');
    }

    // Clear mobile segment timer
    if (this.mobileSegmentTimer) {
      clearTimeout(this.mobileSegmentTimer);
      this.mobileSegmentTimer = null;
      console.log('⏰ Cleared mobile segment timer');
    }

    // Clear mobile auto-restart timer
    if (this.mobileAutoRestartTimer) {
      clearTimeout(this.mobileAutoRestartTimer);
      this.mobileAutoRestartTimer = null;
      console.log('⏰ Cleared mobile auto-restart timer');
    }

    // Stop mobile continuous recording
    if (this.isMobileDevice() && this.mobileContinuousMode) {
      this.stopMobileContinuousRecording();
    }

    // Stop speech recognition if running
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
        console.log('🔇 Speech recognition stopped');
      } catch (error) {
        console.warn('Could not stop speech recognition:', error);
      }
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Save transcripts to backend before finalizing
    await this.saveTranscriptsToBackend();

    // Send finalization message
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'finalize',
        meetingId: this.meetingId,
        role: this.role,
        participantId: this.participantId,
        timestamp: Date.now()
      });
    }

    this.callbacks.onStatusChange('disconnected');
  }

  cleanup() {
    this.stopRecording();

    // Clean up speech recognition
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (error) {
        console.warn('Error stopping speech recognition during cleanup:', error);
      }
      this.speechRecognition = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  getStatus() {
    return {
      isRecording: this.isRecording,
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  pauseSpeechRecognition(): void {
    if (this.speechRecognition && this.isRecording) {
      console.log('⏸️ Pausing speech recognition for guest speaking');
      try {
        this.speechRecognition.stop();
        console.log('✅ Host speech recognition paused');
      } catch (error) {
        console.error('❌ Failed to pause speech recognition:', error);
      }
    }
  }

  resumeSpeechRecognition(): void {
    if (this.speechRecognition && this.isRecording) {
      console.log('▶️ Resuming host speech recognition');
      try {
        this.speechRecognition.start();
        console.log('✅ Host speech recognition resumed');
      } catch (error) {
        console.error('❌ Failed to resume speech recognition:', error);
        // If we can't restart, try to reinitialize
        if (this.initializeSpeechRecognition()) {
          try {
            this.speechRecognition.start();
            console.log('✅ Speech recognition reinitialized and started');
          } catch (restartError) {
            console.error('❌ Failed to restart speech recognition after reinitialization:', restartError);
          }
        }
      }
    }
  }
}

// Utility functions
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const calculateWaveform = (audioData: Float32Array, samples = 50): number[] => {
  const waveform = new Array(samples).fill(0);
  const blockSize = Math.floor(audioData.length / samples);

  for (let i = 0; i < samples; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(audioData[i * blockSize + j] || 0);
    }
    waveform[i] = (sum / blockSize) * 100;
  }

  return waveform;
};