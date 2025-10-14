export interface GuestTranscriptMessage {
  type: 'partial' | 'final' | 'error';
  meetingId: string;
  role: 'guest';
  displayName: string;
  text: string;
  startTime: number;
  endTime: number;
  timestamp: number;
}

export interface GuestAudioChunkMessage {
  type: 'audio_chunk' | 'finalize' | 'start_session' | 'save_transcripts';
  meetingId: string;
  role: 'guest';
  displayName: string;
  timestamp: number;
  sampleRate?: number;
  channels?: number;
  transcripts?: GuestTranscriptMessage[];
}

export class GuestAudioStreamer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private websocket: WebSocket | null = null;
  private speechRecognition: any = null;
  private isRecording = false;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private transcriptBuffer: GuestTranscriptMessage[] = [];
  
  private config = {
    sampleRate: 16000,
    channels: 1,
    bitDepth: 16,
    bufferSize: 4096
  };

  private callbacks = {
    onTranscript: (_message: GuestTranscriptMessage) => {},
    onStatusChange: (_status: 'connecting' | 'connected' | 'recording' | 'error' | 'disconnected') => {},
    onError: (_error: string) => {}
  };

  private wsUrl: string;
  private meetingId: string;
  private displayName: string;

  constructor(wsUrl: string, meetingId: string, displayName: string) {
    this.wsUrl = wsUrl;
    this.meetingId = meetingId;
    this.displayName = displayName;
  }

  setCallbacks(callbacks: Partial<typeof this.callbacks>) {
    Object.assign(this.callbacks, callbacks);
  }

  private initializeSpeechRecognition(): boolean {
    try {
      console.log('🔍 [GUEST] Checking for Web Speech API support...');
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('❌ [GUEST] Web Speech API not supported in this browser');
        return false;
      }

      console.log('✅ [GUEST] Web Speech API supported, initializing...');
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'en-US';
      this.speechRecognition.maxAlternatives = 1;

      this.speechRecognition.onstart = () => {
        console.log('🎙️ [GUEST] Speech recognition started!');
        this.callbacks.onTranscript({
          type: 'partial',
          meetingId: this.meetingId,
          role: 'guest',
          displayName: this.displayName,
          text: '[Guest speech recognition is now active]',
          startTime: Date.now(),
          endTime: Date.now(),
          timestamp: Date.now()
        });
      };

      this.speechRecognition.onresult = (event: any) => {
        console.log('🎯 [GUEST] Speech recognition result:', event);
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          
          let transcript = '';
          let confidence = 0;
          
          if (result[0] && result[0].transcript) {
            transcript = result[0].transcript;
            confidence = result[0].confidence || 0;
          } else if (result.transcript) {
            transcript = result.transcript;
            confidence = result.confidence || 0;
          }
          
          const isFinal = result.isFinal;
          
          console.log(`📝 [GUEST] Speech result: "${transcript}" (Final: ${isFinal}, Confidence: ${confidence.toFixed(2)})`);
          
          if (transcript && transcript.trim().length > 0) {
            const transcriptMessage: GuestTranscriptMessage = {
              type: isFinal ? 'final' : 'partial',
              meetingId: this.meetingId,
              role: 'guest',
              displayName: this.displayName,
              text: transcript,
              startTime: Date.now() - 2000,
              endTime: Date.now(),
              timestamp: Date.now()
            };

            if (isFinal) {
              this.transcriptBuffer.push(transcriptMessage);
              console.log(`📝 [GUEST] Final transcript buffered. Total: ${this.transcriptBuffer.length}`);
            }

            this.callbacks.onTranscript(transcriptMessage);
            
            // Send transcript to backend via WebSocket
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
              this.sendTranscriptToBackend(transcriptMessage);
            }
          }
        }
      };

      this.speechRecognition.onerror = (event: any) => {
        console.error('❌ [GUEST] Speech recognition error:', event.error);
        this.callbacks.onError(`Speech recognition error: ${event.error}`);
      };

      return true;
    } catch (error) {
      console.error('❌ [GUEST] Failed to initialize speech recognition:', error);
      return false;
    }
  }

  private async connectWebSocket(): Promise<boolean> {
    return new Promise((resolve) => {
      this.callbacks.onStatusChange('connecting');
      
      const wsUrlWithParams = `${this.wsUrl}?meetingId=${this.meetingId}&role=guest&participantId=${this.displayName}`;
      console.log('🔗 [GUEST] Attempting WebSocket connection to:', wsUrlWithParams);
      
      this.websocket = new WebSocket(wsUrlWithParams);

      const connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.error('❌ [GUEST] WebSocket connection timeout');
          this.callbacks.onError('Connection timeout - please check if backend is running');
          this.websocket?.close();
          resolve(false);
        }
      }, 15000);

      this.websocket.onopen = () => {
        console.log('✅ [GUEST] WebSocket connected for ASR');
        clearTimeout(connectionTimeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.callbacks.onStatusChange('connected');
        
        const initMessage: GuestAudioChunkMessage = {
          type: 'start_session',
          meetingId: this.meetingId,
          role: 'guest',
          displayName: this.displayName,
          timestamp: Date.now(),
          sampleRate: this.config.sampleRate,
          channels: this.config.channels
        };
        
        console.log('📤 [GUEST] Sending session init:', initMessage);
        this.sendMessage(initMessage);
        
        resolve(true);
      };

      this.websocket.onmessage = (event) => {
        try {
          console.log('📥 [GUEST] WebSocket message received:', event.data);
          const message: GuestTranscriptMessage = JSON.parse(event.data);
          this.callbacks.onTranscript(message);
        } catch (error) {
          console.error('❌ [GUEST] Failed to parse transcript message:', error);
        }
      };

      this.websocket.onclose = (event) => {
        console.log('🔌 [GUEST] WebSocket disconnected:', event.code, event.reason);
        clearTimeout(connectionTimeout);
        this.isConnected = false;
        this.callbacks.onStatusChange('disconnected');
        
        if (this.isRecording && this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`🔄 [GUEST] Attempting reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
          setTimeout(() => this.attemptReconnect(), this.reconnectDelay);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('❌ [GUEST] WebSocket error:', error);
        clearTimeout(connectionTimeout);
        this.callbacks.onStatusChange('error');
        this.callbacks.onError('Connection to transcription service failed');
        resolve(false);
      };
    });
  }

  private attemptReconnect() {
    this.reconnectAttempts++;
    console.log(`🔄 [GUEST] Reconnecting... attempt ${this.reconnectAttempts}`);
    this.connectWebSocket();
  }

  private sendMessage(message: GuestAudioChunkMessage) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  private sendTranscriptToBackend(transcript: GuestTranscriptMessage) {
    console.log('📤 [GUEST] Sending transcript to backend:', transcript);
    
    // Send transcript as JSON message to backend for real-time display
    const message = {
      ...transcript,
      type: 'transcript' as const
    };
    
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  async startRecording(): Promise<boolean> {
    try {
      console.log('🎙️ [GUEST] Starting recording...');
      
      // Initialize speech recognition
      if (!this.initializeSpeechRecognition()) {
        throw new Error('Speech recognition not available');
      }

      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      // Connect WebSocket
      const connected = await this.connectWebSocket();
      if (!connected) {
        throw new Error('Failed to connect to transcription service');
      }

      // Start speech recognition
      this.speechRecognition.start();
      
      this.isRecording = true;
      this.callbacks.onStatusChange('recording');
      console.log('🎙️ [GUEST] Recording started successfully');
      
      return true;
    } catch (error) {
      console.error('❌ [GUEST] Failed to start recording:', error);
      this.callbacks.onError(`Failed to start recording: ${error}`);
      return false;
    }
  }

  async stopRecording(): Promise<void> {
    console.log('⏹️ [GUEST] Stopping recording...');
    
    this.isRecording = false;

    // Stop speech recognition
    if (this.speechRecognition) {
      this.speechRecognition.stop();
      this.speechRecognition = null;
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Save buffered transcripts to database
    if (this.transcriptBuffer.length > 0) {
      console.log(`💾 [GUEST] Saving ${this.transcriptBuffer.length} transcripts to database...`);
      await this.saveTranscriptsToBackend();
    }

    // Close WebSocket
    if (this.websocket) {
      if (this.websocket.readyState === WebSocket.OPEN) {
        const finalizeMessage: GuestAudioChunkMessage = {
          type: 'finalize',
          meetingId: this.meetingId,
          role: 'guest',
          displayName: this.displayName,
          timestamp: Date.now()
        };
        this.sendMessage(finalizeMessage);
      }
      this.websocket.close();
      this.websocket = null;
    }

    this.callbacks.onStatusChange('disconnected');
    console.log('⏹️ [GUEST] Recording stopped');
  }

  private async saveTranscriptsToBackend(): Promise<void> {
    if (this.transcriptBuffer.length === 0) {
      console.log('📝 [GUEST] No transcripts to save');
      return;
    }

    console.log(`💾 [GUEST] Saving ${this.transcriptBuffer.length} transcripts...`);
    console.log('📋 [GUEST] WebSocket state:', this.websocket?.readyState);
    
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.error('❌ [GUEST] WebSocket not available for saving transcripts');
      return;
    }

    const saveMessage: GuestAudioChunkMessage = {
      type: 'save_transcripts',
      meetingId: this.meetingId,
      role: 'guest',
      displayName: this.displayName,
      timestamp: Date.now(),
      transcripts: [...this.transcriptBuffer]
    };

    console.log('💾 [GUEST] Sending transcripts to backend for saving:', saveMessage);
    
    try {
      this.websocket.send(JSON.stringify(saveMessage));
      console.log(`✅ [GUEST] Successfully sent ${this.transcriptBuffer.length} transcripts for database saving`);
      this.transcriptBuffer = [];
    } catch (error) {
      console.error('❌ [GUEST] Failed to send transcripts to backend:', error);
    }
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  pauseSpeechRecognition(): boolean {
    try {
      if (this.speechRecognition && this.isRecording) {
        console.log('⏸️ [GUEST] Pausing speech recognition for turn-taking coordination...');
        this.speechRecognition.stop();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [GUEST] Failed to pause speech recognition:', error);
      return false;
    }
  }

  resumeSpeechRecognition(): boolean {
    try {
      if (this.isRecording) {
        console.log('▶️ [GUEST] Resuming speech recognition after pause...');
        
        if (!this.speechRecognition) {
          // Reinitialize if needed
          const success = this.initializeSpeechRecognition();
          if (!success) {
            console.error('❌ [GUEST] Failed to reinitialize speech recognition');
            return false;
          }
        }

        // Start speech recognition
        this.speechRecognition.start();
        console.log('✅ [GUEST] Speech recognition resumed successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [GUEST] Failed to resume speech recognition:', error);
      
      // Try to reinitialize as fallback
      try {
        console.log('🔄 [GUEST] Attempting to reinitialize speech recognition as fallback...');
        const success = this.initializeSpeechRecognition();
        if (success && this.speechRecognition) {
          this.speechRecognition.start();
          console.log('✅ [GUEST] Speech recognition reinitialized and resumed');
          return true;
        }
      } catch (reinitError) {
        console.error('❌ [GUEST] Failed to reinitialize speech recognition:', reinitError);
      }
      
      return false;
    }
  }

  getConnectionState(): string {
    if (!this.websocket) return 'disconnected';
    
    switch (this.websocket.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'disconnecting';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }
}