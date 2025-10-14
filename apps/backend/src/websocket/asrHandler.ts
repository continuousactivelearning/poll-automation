import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import Audio from '../web/models/audio.model';
import { Content } from '../web/models/content.model';

interface AudioMessage {
  type: 'audio_chunk' | 'start_session' | 'finalize' | 'save_transcripts' | 'transcript';
  meetingId: string;
  role: 'host' | 'participant' | 'guest';
  participantId: string;
  displayName?: string; // For guest role
  timestamp: number;
  sampleRate?: number;
  channels?: number;
  transcripts?: any[]; // For save_transcripts messages
  text?: string; // For transcript messages
  startTime?: number;
  endTime?: number;
}

interface TranscriptResponse {
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

interface AudioSession {
  sessionId: string;
  meetingId: string;
  participantId: string;
  role: 'host' | 'participant' | 'guest';
  displayName?: string; // For guest role
  audioBuffer: Buffer[];
  isActive: boolean;
  startTime: number;
  sampleRate: number;
  channels: number;
  audioFilePath?: string;
  websocket?: WebSocket; // Store WebSocket reference for broadcasting
  voskProcess?: any; // Vosk subprocess if using local Vosk
}

class ASRWebSocketServer {
  private wss: WebSocketServer;
  private sessions = new Map<string, AudioSession>();
  private audioStoragePath = './audio_storage';

  constructor(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/asr'
    });

    // Ensure audio storage directory exists
    if (!existsSync(this.audioStoragePath)) {
      mkdirSync(this.audioStoragePath, { recursive: true });
    }

    this.setupEventHandlers();
    console.log('🎙️ ASR WebSocket Server initialized');
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('🔗 New ASR WebSocket connection');
      
      const url = parse(request.url || '', true);
      const { meetingId, role, participantId, displayName } = url.query;

      if (!meetingId || !role || !participantId) {
        console.error('❌ Missing required query parameters');
        ws.close(1008, 'Missing required parameters');
        return;
      }

      // Use a predictable session ID based on connection parameters
      const sessionId = `${meetingId}-${role}-${participantId}-${Date.now()}`;
      console.log(`✅ ASR Session created: ${sessionId} for ${role}:${participantId} ${displayName ? `(${displayName})` : ''} in meeting:${meetingId}`);

      // Store the session ID in the WebSocket for later use
      (ws as any).sessionId = sessionId;

      // Auto-initialize session immediately upon connection
      this.autoInitializeSession(ws, sessionId, {
        meetingId: meetingId as string,
        participantId: participantId as string,
        role: role as 'host' | 'participant' | 'guest',
        displayName: displayName as string | undefined,
        timestamp: Date.now()
      });

      ws.on('message', async (data: Buffer | string) => {
        try {
          if (typeof data === 'string') {
            // JSON message
            console.log('📨 [BACKEND] Received JSON message:', data.substring(0, 200) + '...');
            const message: AudioMessage = JSON.parse(data);
            console.log('📋 [BACKEND] Parsed message details:', {
              type: message.type,
              meetingId: message.meetingId,
              role: message.role,
              participantId: message.participantId,
              transcriptCount: message.transcripts?.length || 'N/A',
              sessionId: sessionId
            });
            
            if (message.type === 'save_transcripts') {
              console.log('💾 [BACKEND] Processing save_transcripts request...');
              console.log('📝 [BACKEND] Transcript data preview:');
              message.transcripts?.forEach((t, i) => {
                console.log(`   ${i + 1}. "${t.text.substring(0, 50)}..." (confidence: ${t.confidence}, timestamp: ${new Date(t.timestamp).toISOString()})`);
              });
            }
            
            await this.handleJsonMessage(ws, sessionId, message);
          } else {
            // Binary audio data - use the stored session ID
            await this.handleAudioChunk(ws, sessionId, data);
          }
        } catch (error) {
          console.error('❌ Error processing ASR message:', error);
          console.error('❌ Raw message:', typeof data === 'string' ? data.substring(0, 500) : 'Binary data');
          this.sendError(ws, 'Failed to process audio data');
        }
      });

      ws.on('close', () => {
        console.log(`🔚 ASR Session ended: ${sessionId}`);
        this.cleanupSession(sessionId);
      });

      ws.on('error', (error) => {
        console.error('❌ ASR WebSocket error:', error);
        this.cleanupSession(sessionId);
      });
    });
  }

  private async handleJsonMessage(ws: WebSocket, sessionId: string, message: AudioMessage) {
    switch (message.type) {
      case 'start_session':
        await this.initializeSession(ws, sessionId, message);
        break;
      
      case 'finalize':
        await this.finalizeSession(ws, sessionId, message);
        break;
      
      case 'save_transcripts':
        await this.saveTranscripts(ws, sessionId, message);
        break;
      
      case 'transcript':
        await this.handleTranscriptMessage(ws, sessionId, message);
        break;
      
      default:
        console.warn(`⚠️ Unknown message type: ${message.type}`);
    }
  }

  private async autoInitializeSession(ws: WebSocket, sessionId: string, connectionData: {
    meetingId: string,
    participantId: string,
    role: 'host' | 'participant' | 'guest',
    displayName?: string,
    timestamp: number
  }) {
    const session: AudioSession = {
      sessionId,
      meetingId: connectionData.meetingId,
      participantId: connectionData.participantId,
      role: connectionData.role,
      displayName: connectionData.displayName,
      audioBuffer: [],
      isActive: true,
      startTime: connectionData.timestamp,
      sampleRate: 16000, // Default sample rate
      channels: 1, // Default channels
      websocket: ws // Store WebSocket reference for broadcasting
    };

    // Create audio file for this session
    const audioFileName = `${connectionData.meetingId}_${connectionData.role}_${connectionData.participantId}_${connectionData.timestamp}.wav`;
    session.audioFilePath = join(this.audioStoragePath, audioFileName);

    this.sessions.set(sessionId, session);
    
    console.log(`🎯 Auto-initialized ASR session: ${sessionId}`);
    console.log(`📁 Audio will be saved to: ${session.audioFilePath}`);
    console.log(`👤 Session details: ${connectionData.role}:${connectionData.participantId} ${connectionData.displayName ? `(${connectionData.displayName})` : ''} in meeting:${connectionData.meetingId}`);

    // Start mock ASR processing (replace with actual Vosk integration)
    this.startMockASR(ws, sessionId);
  }

  private async initializeSession(ws: WebSocket, sessionId: string, message: AudioMessage) {
    const session: AudioSession = {
      sessionId,
      meetingId: message.meetingId,
      participantId: message.participantId,
      role: message.role,
      audioBuffer: [],
      isActive: true,
      startTime: Date.now(),
      sampleRate: message.sampleRate || 16000,
      channels: message.channels || 1
    };

    // Create audio file for this session
    const audioFileName = `${message.meetingId}_${message.role}_${message.participantId}_${Date.now()}.wav`;
    session.audioFilePath = join(this.audioStoragePath, audioFileName);

    this.sessions.set(sessionId, session);
    
    console.log(`🎯 Initialized ASR session: ${sessionId}`);
    console.log(`📁 Audio will be saved to: ${session.audioFilePath}`);

    // Start mock ASR processing (replace with actual Vosk integration)
    this.startMockASR(ws, sessionId);
  }

  private async handleAudioChunk(ws: WebSocket, sessionId: string, audioData: Buffer) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      console.warn(`⚠️ No active session found for: ${sessionId}`);
      return;
    }

    // Add audio chunk to buffer
    session.audioBuffer.push(audioData);
    console.log(`🎵 Received audio chunk: ${audioData.length} bytes (total chunks: ${session.audioBuffer.length})`);

    // Process with voice activity detection and simple transcription
    await this.processVoiceActivity(ws, session, audioData);
  }

  private async processWithASR(ws: WebSocket, session: AudioSession, audioChunk: Buffer) {
    // Mock ASR processing - replace with actual Vosk integration
    
    // Simulate partial transcript every few chunks
    if (session.audioBuffer.length % 3 === 0) {
      const mockPartialTexts = [
        "Hello, we are discussing the implementation of",
        "Today's meeting is about audio transcription and",
        "The real-time audio processing system is working",
        "We need to integrate Vosk for accurate speech recognition",
        "Testing the WebSocket connection for streaming audio"
      ];
      
      const partialText = mockPartialTexts[Math.floor(Math.random() * mockPartialTexts.length)];
      
      this.sendTranscript(ws, {
        type: 'partial',
        meetingId: session.meetingId,
        role: session.role,
        participantId: session.participantId,
        text: partialText,
        startTime: session.startTime,
        endTime: Date.now(),
        timestamp: Date.now()
      });
    }

    // Simulate final transcript every 10 chunks
    if (session.audioBuffer.length % 10 === 0) {
      const mockFinalTexts = [
        "Hello, we are discussing the implementation of real-time audio transcription.",
        "Today's meeting is about audio transcription and WebSocket streaming.",
        "The real-time audio processing system is working as expected.",
        "We need to integrate Vosk for accurate speech recognition in production.",
        "Testing the WebSocket connection for streaming audio data successfully."
      ];
      
      const finalText = mockFinalTexts[Math.floor(Math.random() * mockFinalTexts.length)];
      
      this.sendTranscript(ws, {
        type: 'final',
        meetingId: session.meetingId,
        role: session.role,
        participantId: session.participantId,
        text: finalText,
        startTime: session.startTime,
        endTime: Date.now(),
        timestamp: Date.now()
      });

      // Save to database
      await this.saveTranscriptToDatabase(session.meetingId, session.role, session.participantId, finalText);
    }
  }

  private async processVoiceActivity(ws: WebSocket, session: AudioSession, audioChunk: Buffer) {
    // Simple voice activity detection based on audio amplitude
    const audioData = new Int16Array(audioChunk.buffer, audioChunk.byteOffset, audioChunk.length / 2);
    
    // Calculate RMS (Root Mean Square) energy
    let sumSquares = 0;
    for (let i = 0; i < audioData.length; i++) {
      sumSquares += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(sumSquares / audioData.length);
    const amplitude = rms / 32768.0; // Normalize to [0, 1]
    
    // Log audio activity but don't send transcripts (frontend handles speech recognition now)
    if (amplitude > 0.01) {
      console.log(`🔊 Voice activity detected - Amplitude: ${amplitude.toFixed(4)}, Chunks: ${session.audioBuffer.length}`);
    }
    
    // Only send periodic status updates, not constant transcripts
    if (session.audioBuffer.length % 100 === 0) {
      console.log(`📊 Processing ${session.audioBuffer.length} audio chunks for session ${session.sessionId}`);
    }
  }

  private startMockASR(ws: WebSocket, sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Send initial connection confirmation
    this.sendTranscript(ws, {
      type: 'partial',
      meetingId: session.meetingId,
      role: session.role,
      participantId: session.participantId,
      text: 'ASR system connected and ready...',
      startTime: session.startTime,
      endTime: Date.now(),
      timestamp: Date.now()
    });
  }

  private sendTranscript(ws: WebSocket, transcript: TranscriptResponse) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(transcript));
      console.log(`📝 Sent ${transcript.type} transcript: "${transcript.text.slice(0, 50)}..."`);
    }
  }

  private sendError(ws: WebSocket, error: string) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        error,
        timestamp: Date.now()
      }));
    }
  }

  private async finalizeSession(ws: WebSocket, sessionId: string, message: AudioMessage) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    console.log(`🏁 Finalizing ASR session: ${sessionId}`);
    
    // Process any remaining audio buffer
    if (session.audioBuffer.length > 0) {
      const combinedBuffer = Buffer.concat(session.audioBuffer);
      
      // Save final audio file
      if (session.audioFilePath) {
        // Create a simple WAV file (for demo purposes)
        await this.saveAudioAsWAV(session.audioFilePath, combinedBuffer, session.sampleRate, session.channels);
      }

      // Send final transcript
      this.sendTranscript(ws, {
        type: 'final',
        meetingId: session.meetingId,
        role: session.role,
        participantId: session.participantId,
        text: `Session completed. Processed ${session.audioBuffer.length} audio chunks.`,
        startTime: session.startTime,
        endTime: Date.now(),
        timestamp: Date.now()
      });
    }

    session.isActive = false;
  }

  private async saveAudioAsWAV(filePath: string, pcmData: Buffer, sampleRate: number, channels: number) {
    try {
      // Simple WAV header creation
      const wavHeader = this.createWAVHeader(pcmData.length, sampleRate, channels);
      const wavData = Buffer.concat([wavHeader, pcmData]);
      
      const writeStream = createWriteStream(filePath);
      writeStream.write(wavData);
      writeStream.end();
      
      console.log(`💾 Audio saved to: ${filePath}`);
    } catch (error) {
      console.error('❌ Failed to save audio file:', error);
    }
  }

  private createWAVHeader(dataSize: number, sampleRate: number, channels: number): Buffer {
    const header = Buffer.alloc(44);
    const bitsPerSample = 16;
    const byteRate = sampleRate * channels * bitsPerSample / 8;
    const blockAlign = channels * bitsPerSample / 8;

    // WAV file header
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // PCM format
    header.writeUInt16LE(1, 20); // Audio format
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return header;
  }

  private async saveToContentCollection(message: AudioMessage, sessionId: string) {
    try {
      if (!message.transcripts || message.transcripts.length === 0) {
        console.log('📝 No transcripts to save to content collection');
        return null;
      }

      // Aggregate transcript data
      const transcriptArray = message.transcripts.map(transcript => ({
        speaker: transcript.role === 'host' ? 'Host' : (transcript.displayName || 'Guest'),
        role: transcript.role,
        text: transcript.text,
        timestamp: new Date(transcript.timestamp),
        confidence: transcript.confidence || 0.9
      }));

      // Calculate total word count
      const wordCount = transcriptArray.reduce((count, item) => {
        return count + (item.text.split(/\s+/).filter((word: string) => word.length > 0).length);
      }, 0);

      // Get session details
      const firstTranscript = message.transcripts[0];
      const lastTranscript = message.transcripts[message.transcripts.length - 1];
      const sessionStartTime = new Date(firstTranscript.timestamp);
      const sessionEndTime = new Date(lastTranscript.timestamp);
      const totalDuration = sessionEndTime.getTime() - sessionStartTime.getTime();

      // Find or create content document
      let contentDoc = await Content.findOne({ meetingId: message.meetingId }).exec();
      
      if (!contentDoc) {
        // Create new content document
        contentDoc = await Content.create({
          meetingId: message.meetingId,
          hostId: message.participantId,
          hostName: message.participantId, // Use participantId as hostName for now
          participants: [{
            participantId: message.participantId,
            role: message.role,
            joinedAt: sessionStartTime
          }],
          transcript: transcriptArray,
          sessionStartTime: sessionStartTime,
          sessionEndTime: sessionEndTime,
          totalDuration: totalDuration,
          wordCount: wordCount,
          metadata: {
            speechRecognitionEngine: 'Web Speech API',
            browserInfo: 'Unknown',
            deviceInfo: 'Unknown'
          },
          status: 'completed'
        });

        console.log(`✅ [CONTENT COLLECTION] Created new content document:`);
        console.log(`   🆔 Meeting ID: ${message.meetingId}`);
        console.log(`   📝 Total transcripts: ${transcriptArray.length}`);
        console.log(`   💬 Word count: ${wordCount}`);
        console.log(`   ⏱️ Duration: ${Math.round(totalDuration / 1000)}s`);
        console.log(`   📄 Document ID: ${contentDoc._id}`);
      } else {
        // Update existing content document
        contentDoc.transcript.push(...transcriptArray);
        contentDoc.wordCount += wordCount;
        contentDoc.sessionEndTime = sessionEndTime;
        contentDoc.totalDuration = sessionEndTime.getTime() - contentDoc.sessionStartTime.getTime();
        contentDoc.status = 'completed';
        contentDoc.updatedAt = new Date();
        
        await contentDoc.save();

        console.log(`🔄 [CONTENT COLLECTION] Updated existing content document:`);
        console.log(`   🆔 Meeting ID: ${message.meetingId}`);
        console.log(`   📝 Added transcripts: ${transcriptArray.length}`);
        console.log(`   📝 Total transcripts: ${contentDoc.transcript.length}`);
        console.log(`   💬 Total word count: ${contentDoc.wordCount}`);
        console.log(`   ⏱️ Total duration: ${Math.round(contentDoc.totalDuration / 1000)}s`);
      }

      return contentDoc;

    } catch (error) {
      console.error('❌ Failed to save to content collection:', error);
      return null;
    }
  }

  private async saveTranscripts(ws: WebSocket, sessionId: string, message: AudioMessage) {
    try {
      console.log(`💾 Saving ${message.transcripts?.length || 0} transcripts for session: ${sessionId}`);
      console.log(`📋 Saving to 'audios' collection in database`);
      
      if (!message.transcripts || message.transcripts.length === 0) {
        console.log('📝 No transcripts to save');
        return;
      }

      let savedCount = 0;

      // Save each transcript to the new 'audios' collection
      for (const transcript of message.transcripts) {
        try {
          const audioRecord = await Audio.create({
            meetingId: transcript.meetingId,
            participantId: transcript.participantId,
            hostName: transcript.participantId, // Use participantId as hostName for now
            role: transcript.role,
            text: transcript.text,
            confidence: transcript.confidence || 0.9, // Default confidence if not provided
            timestamp: new Date(transcript.timestamp),
            sessionId: sessionId,
            isFinal: transcript.type === 'final' || true // Assume final if not specified
          });

          savedCount++;
          console.log(`✅ [AUDIOS COLLECTION] Saved transcript ${savedCount}:`);
          console.log(`   📝 Text: "${transcript.text.substring(0, 100)}..."`);
          console.log(`   👤 Role: ${transcript.role}`);
          console.log(`   🆔 Meeting ID: ${transcript.meetingId}`);
          console.log(`   ⏰ Timestamp: ${new Date(transcript.timestamp).toISOString()}`);
          console.log(`   💯 Confidence: ${transcript.confidence || 0.9}`);
          console.log(`   🔗 Session ID: ${sessionId}`);
          console.log(`   📄 Document ID: ${audioRecord._id}`);
        } catch (error) {
          console.error('❌ Failed to save individual transcript to audios collection:', error);
          console.error('❌ Transcript data:', transcript);
        }
      }

      console.log(`💾 Successfully saved ${savedCount}/${message.transcripts.length} transcripts to 'audios' collection`);
      
      // Also save to content collection for session-based transcript aggregation
      const contentDoc = await this.saveToContentCollection(message, sessionId);
      const contentMessage = contentDoc ? 
        `[CONTENT DATABASE] Saved session transcript to MongoDB 'content' collection (${contentDoc.transcript.length} total transcripts)` :
        `[CONTENT DATABASE] Failed to save to content collection`;
      
      // Send confirmation back to frontend
      this.sendTranscript(ws, {
        type: 'final',
        meetingId: message.meetingId,
        role: message.role,
        participantId: message.participantId,
        text: `[AUDIOS DATABASE] Saved ${savedCount} transcripts to MongoDB 'audios' collection. ${contentMessage}`,
        startTime: Date.now(),
        endTime: Date.now(),
        timestamp: Date.now()
      });

      // **NEW: Automatically trigger question generation for the saved transcripts**
      // This happens asynchronously - don't wait for it to complete
      if (savedCount > 0 && message.meetingId) {
        setImmediate(async () => {
          try {
            // Import ServiceManager here to avoid circular dependencies
            const ServiceManager = require('../services/serviceManager').default;
            const autoQuestionService = ServiceManager.getInstance().getAutoQuestionService();
            
            // Combine all transcript texts into a single segment
            const combinedText = (message.transcripts || [])
              .map((t: any) => t.text)
              .join(' ')
              .trim();
            
            if (combinedText.length > 0) {
              console.log(`🤖 [AUTO-QUESTIONS] Triggering automatic question generation for ${savedCount} transcripts`);
              console.log(`📝 [AUTO-QUESTIONS] Combined text length: ${combinedText.length} characters`);
              
              await autoQuestionService.generateQuestionsForTranscripts(
                combinedText,
                message.meetingId
              );
              
              console.log(`✅ [AUTO-QUESTIONS] Question generation completed for meeting: ${message.meetingId}`);
            } else {
              console.log(`⚠️ [AUTO-QUESTIONS] No text content to generate questions from`);
            }
          } catch (error) {
            console.error(`❌ [AUTO-QUESTIONS] Failed to generate questions for transcripts:`, error);
            // Don't fail the transcript save if question generation fails
          }
        });
      }

    } catch (error) {
      console.error('❌ Failed to save transcripts:', error);
      this.sendError(ws, `Failed to save transcripts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleTranscriptMessage(ws: WebSocket, sessionId: string, message: AudioMessage) {
    try {
      console.log(`📝 [TRANSCRIPT MESSAGE] Received from ${message.role}:`, {
        sessionId,
        role: message.role,
        participantId: message.participantId,
        displayName: message.displayName || 'N/A',
        text: message.text?.substring(0, 100) + '...',
        type: message.type
      });

      if (!message.text) {
        console.warn('⚠️ [TRANSCRIPT MESSAGE] No text content in transcript message');
        return;
      }

      // For guest messages, broadcast to all host connections in the same meeting
      if (message.role === 'guest') {
        console.log(`📡 [TRANSCRIPT MESSAGE] Broadcasting guest transcript to hosts in meeting: ${message.meetingId}`);
        
        // Create transcript response for broadcasting
        const transcriptResponse: TranscriptResponse = {
          type: 'final', // Guest transcripts from frontend are always final when sent as transcript messages
          meetingId: message.meetingId,
          role: message.role,
          participantId: message.participantId,
          displayName: message.displayName,
          text: message.text,
          startTime: message.startTime || Date.now() - 2000,
          endTime: message.endTime || Date.now(),
          timestamp: message.timestamp || Date.now()
        };

        // Broadcast to all connected sessions in the same meeting
        this.broadcastToMeeting(message.meetingId, transcriptResponse);

        // Save guest transcripts to database (all transcript messages are final)
        console.log(`💾 [TRANSCRIPT MESSAGE] Saving guest transcript to database`);
        try {
          const audioRecord = await Audio.create({
            meetingId: message.meetingId,
            participantId: message.participantId,
            hostName: message.displayName || message.participantId,
            role: 'guest', // Store as guest in database
            text: message.text,
            confidence: 0.9, // Default confidence for guest transcripts
            timestamp: new Date(message.timestamp || Date.now()),
            sessionId: sessionId,
            isFinal: true
          });

          console.log(`✅ [TRANSCRIPT MESSAGE] Guest transcript saved to audios collection:`, {
            id: audioRecord._id,
            text: message.text.substring(0, 50) + '...',
            meetingId: message.meetingId,
            displayName: message.displayName
          });
        } catch (dbError) {
          console.error('❌ [TRANSCRIPT MESSAGE] Failed to save guest transcript to database:', dbError);
        }

      } else {
        // For host/participant messages, handle normally
        console.log(`📤 [TRANSCRIPT MESSAGE] Echoing ${message.role} transcript back to sender`);
        this.sendTranscript(ws, {
          type: 'final', // Assume final for now
          meetingId: message.meetingId,
          role: message.role,
          participantId: message.participantId,
          displayName: message.displayName,
          text: message.text,
          startTime: message.startTime || Date.now() - 2000,
          endTime: message.endTime || Date.now(),
          timestamp: message.timestamp || Date.now()
        });
      }

    } catch (error) {
      console.error('❌ [TRANSCRIPT MESSAGE] Failed to handle transcript message:', error);
      this.sendError(ws, `Failed to process transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private broadcastToMeeting(meetingId: string, transcript: TranscriptResponse) {
    console.log(`📡 [BROADCAST] Sending transcript to all sessions in meeting: ${meetingId}`);
    console.log(`📡 [BROADCAST] Transcript content: "${transcript.text.substring(0, 50)}..." from ${transcript.role}:${transcript.participantId}`);
    
    let broadcastCount = 0;
    let hostCount = 0;
    let guestCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.meetingId === meetingId && session.websocket) {
        const ws = session.websocket;
        if (ws.readyState === WebSocket.OPEN) {
          try {
            this.sendTranscript(ws, transcript);
            broadcastCount++;
            
            if (session.role === 'host') hostCount++;
            else if (session.role === 'guest') guestCount++;
            
            console.log(`   📤 [BROADCAST] Sent to session: ${sessionId} (${session.role}:${session.participantId})`);
          } catch (error) {
            console.error(`   ❌ [BROADCAST] Failed to send to session ${sessionId}:`, error);
          }
        } else {
          console.log(`   ⚠️ [BROADCAST] WebSocket not open for session: ${sessionId} (state: ${ws.readyState})`);
        }
      }
    }
    
    console.log(`📡 [BROADCAST] Transcript sent to ${broadcastCount} sessions (${hostCount} hosts, ${guestCount} guests) in meeting: ${meetingId}`);
  }

  private async saveTranscriptToDatabase(meetingId: string, role: string, participantId: string, text: string) {
    try {
      const { Transcript } = await import('../web/models/transcript.model');
      
      const transcript = await Transcript.create({
        meetingId,
        role,
        participantId,
        text,
        type: 'final',
        startTime: new Date(Date.now() - 5000), // Approximate start time
        endTime: new Date(),
        timestamp: new Date()
      });

      console.log(`💾 Transcript saved to database:`, {
        id: transcript.id,
        meetingId,
        role,
        participantId,
        textLength: text.length
      });

      return transcript;
    } catch (error) {
      console.error('❌ Failed to save transcript to database:', error);
      throw error;
    }
  }

  private cleanupSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      
      // Clean up any resources (Vosk processes, file streams, etc.)
      if (session.voskProcess) {
        // Kill Vosk process if running
        session.voskProcess.kill();
      }
      
      this.sessions.delete(sessionId);
      console.log(`🧹 Cleaned up session: ${sessionId}`);
    }
  }

  // Integration point for real Vosk ASR
  private async integrateWithVosk(session: AudioSession, audioChunk: Buffer) {
    // Example Vosk integration (requires vosk-api npm package)
    /*
    const vosk = require('vosk');
    
    if (!session.voskProcess) {
      const model = new vosk.Model('path/to/vosk-model');
      session.voskProcess = new vosk.KaldiRecognizer(model, session.sampleRate);
    }
    
    if (session.voskProcess.acceptWaveform(audioChunk)) {
      const result = JSON.parse(session.voskProcess.result());
      if (result.text) {
        // Send final transcript
        this.sendTranscript(ws, {
          type: 'final',
          text: result.text,
          // ... other fields
        });
      }
    } else {
      const partialResult = JSON.parse(session.voskProcess.partialResult());
      if (partialResult.partial) {
        // Send partial transcript
        this.sendTranscript(ws, {
          type: 'partial',
          text: partialResult.partial,
          // ... other fields
        });
      }
    }
    */
  }

  getStats() {
    return {
      activeSessions: this.sessions.size,
      totalConnections: this.wss.clients.size
    };
  }
}

export default ASRWebSocketServer;