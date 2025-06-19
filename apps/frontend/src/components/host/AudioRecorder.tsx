import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

interface AudioRecorderProps {
  meetingId: string;
  onPollsGenerated: (polls: any[]) => void;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  isProcessing: boolean;
  isStreaming: boolean;
  chunksProcessed: number;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ meetingId, onPollsGenerated }) => {
  const { currentUser } = useAuth();
  const { socket } = useSocket();
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    isProcessing: false,
    isStreaming: false,
    chunksProcessed: 0
  });
  
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [audioQuality, setAudioQuality] = useState<string>('Good');
  const [realtimeTranscript, setRealtimeTranscript] = useState<string>('');
  const [realtimePolls, setRealtimePolls] = useState<any[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Real-time AI WebSocket listeners
  useEffect(() => {
    if (socket) {
      // Listen for real-time transcript updates
      socket.on('realtime-transcript-update', (data: any) => {
        const { chunkIndex, partialTranscript, timestamp, isPartial } = data;
        console.log(`🎤 Real-time transcript chunk ${chunkIndex}:`, partialTranscript);

        setRealtimeTranscript(prev => {
          if (isPartial) {
            return prev + ' ' + partialTranscript;
          }
          return partialTranscript;
        });
      });

      // Listen for real-time poll generation
      socket.on('realtime-poll-generated', (data: any) => {
        const { poll, chunkIndex, timestamp } = data;
        console.log(`🚀 Real-time poll generated at chunk ${chunkIndex}:`, poll);

        setRealtimePolls(prev => [...prev, { ...poll, chunkIndex, timestamp }]);

        // Notify user of new real-time poll
        setSuccess(`🚀 Real-time poll generated! "${poll.question}"`);
        setTimeout(() => setSuccess(''), 3000);
      });

      return () => {
        socket.off('realtime-transcript-update');
        socket.off('realtime-poll-generated');
      };
    }
  }, [socket]);

  const startRecording = async () => {
    try {
      setError('');
      setSuccess('');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Set up Web Audio API for real-time audio analysis
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      // Start real-time audio level monitoring
      const monitorAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average audio level
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          const normalizedLevel = Math.round((average / 255) * 100);

          setAudioLevel(normalizedLevel);

          // Determine audio quality based on level
          if (normalizedLevel < 10) {
            setAudioQuality('Too Quiet');
          } else if (normalizedLevel > 80) {
            setAudioQuality('Too Loud');
          } else if (normalizedLevel > 30) {
            setAudioQuality('Excellent');
          } else {
            setAudioQuality('Good');
          }
        }

        if (recordingState.isRecording) {
          requestAnimationFrame(monitorAudioLevel);
        }
      };

      // Start monitoring
      monitorAudioLevel();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available - Real-time streaming
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);

          // Stream audio chunk in real-time via WebSocket
          if (socket && recordingState.isStreaming) {
            const reader = new FileReader();
            reader.onload = () => {
              const arrayBuffer = reader.result as ArrayBuffer;
              const chunkIndex = audioChunksRef.current.length - 1;

              socket.emit('audio-chunk', {
                meetingId,
                audioChunk: Array.from(new Uint8Array(arrayBuffer)),
                chunkIndex,
                timestamp: new Date().toISOString()
              });

              setRecordingState(prev => ({
                ...prev,
                chunksProcessed: prev.chunksProcessed + 1
              }));
            };
            reader.readAsArrayBuffer(event.data);
          }
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        await processRecording();
      };

      // Start recording with real-time chunking
      mediaRecorder.start(1000); // Collect data every second for real-time streaming

      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        duration: 0,
        isStreaming: true,
        chunksProcessed: 0
      }));

      // Start WebSocket audio stream
      if (socket) {
        socket.emit('start-audio-stream', {
          meetingId,
          hostId: currentUser?.email || 'anonymous'
        });
      }
      
      // Start duration timer
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
      
      setSuccess('Recording started! Speak clearly into your microphone.');
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Clean up Web Audio API
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Clear timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        isProcessing: true,
        isStreaming: false
      }));

      // Stop WebSocket audio stream
      if (socket) {
        socket.emit('stop-audio-stream', {
          meetingId,
          hostId: currentUser?.email || 'anonymous'
        });
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      if (recordingState.isPaused) {
        mediaRecorderRef.current.resume();
        setRecordingState(prev => ({ ...prev, isPaused: false }));
      } else {
        mediaRecorderRef.current.pause();
        setRecordingState(prev => ({ ...prev, isPaused: true }));
      }
    }
  };

  const processRecording = async () => {
    try {
      if (audioChunksRef.current.length === 0) {
        throw new Error('No audio data recorded');
      }

      // Create blob from recorded chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('meetingId', meetingId);
      formData.append('hostId', currentUser?.email || 'anonymous');

      // Upload to backend
      const response = await fetch('http://localhost:5003/api/audio/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTranscript(result.transcript);

        setSuccess(`🤖 AI Generated ${result.questions.length} poll questions from your recording!`);

        // Pass generated polls to parent component
        onPollsGenerated(result.questions);
      } else {
        throw new Error(result.message || 'Processing failed');
      }
      
    } catch (err) {
      console.error('Error processing recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to process recording');
    } finally {
      setRecordingState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingStatus = (): string => {
    if (recordingState.isProcessing) return 'Processing audio...';
    if (recordingState.isRecording && recordingState.isPaused) return 'Recording paused';
    if (recordingState.isRecording && recordingState.isStreaming) return 'Live streaming & recording...';
    if (recordingState.isRecording) return 'Recording in progress...';
    return 'Ready to record';
  };

  const getStatusColor = (): string => {
    if (recordingState.isProcessing) return 'text-yellow-600';
    if (recordingState.isRecording && recordingState.isPaused) return 'text-orange-600';
    if (recordingState.isRecording) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">🎤 AI Audio Recording</h3>
        <p className="text-sm text-gray-600">
          Record your voice to automatically generate poll questions using AI
        </p>
      </div>

      {/* Status Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${getStatusColor()}`}>
              {getRecordingStatus()}
            </p>
            {recordingState.isRecording && (
              <div className="text-sm text-gray-500 mt-1 space-y-1">
                <p>Duration: {formatDuration(recordingState.duration)}</p>
                {recordingState.isStreaming && (
                  <div className="space-y-1">
                    <p className="text-blue-600">
                      📡 Streaming live • {recordingState.chunksProcessed} chunks sent
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs">Audio Level:</span>
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-100 ${
                            audioLevel > 80 ? 'bg-red-500' :
                            audioLevel > 30 ? 'bg-green-500' :
                            audioLevel > 10 ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        audioQuality === 'Excellent' ? 'text-green-600' :
                        audioQuality === 'Good' ? 'text-blue-600' :
                        audioQuality === 'Too Quiet' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {audioQuality}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {recordingState.isRecording && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-red-600 font-medium">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Recording Controls */}
      <div className="flex space-x-3 mb-6">
        {!recordingState.isRecording ? (
          <button
            onClick={startRecording}
            disabled={recordingState.isProcessing}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-2">🎤</span>
            Start Recording
          </button>
        ) : (
          <>
            <button
              onClick={pauseRecording}
              className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              <span className="mr-2">{recordingState.isPaused ? '▶️' : '⏸️'}</span>
              {recordingState.isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={stopRecording}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <span className="mr-2">⏹️</span>
              Stop & Process
            </button>
          </>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          <strong>Success:</strong> {success}
        </div>
      )}

      {/* Real-time Transcript Display */}
      {realtimeTranscript && (
        <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="font-medium text-purple-900 mb-2">🎤 Real-time Transcript:</h4>
          <p className="text-sm text-purple-800 italic">"{realtimeTranscript}"</p>
          <div className="mt-2 flex items-center text-xs text-purple-600">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse mr-2"></div>
            Live transcription in progress...
          </div>
        </div>
      )}

      {/* Real-time Polls Display */}
      {realtimePolls.length > 0 && (
        <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="font-medium text-orange-900 mb-3">🚀 Real-time Generated Polls:</h4>
          <div className="space-y-3">
            {realtimePolls.map((poll, index) => (
              <div key={index} className="p-3 bg-white rounded border border-orange-200">
                <p className="font-medium text-orange-900 mb-2">{poll.question}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {poll.options.map((option: string, optIndex: number) => (
                    <div
                      key={optIndex}
                      className={`p-2 rounded ${
                        optIndex === poll.correctAnswer
                          ? 'bg-green-100 text-green-800 font-medium'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {String.fromCharCode(65 + optIndex)}. {option}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-orange-600">
                  Generated at chunk {poll.chunkIndex} • {poll.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Transcript Display */}
      {transcript && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📝 Final Transcript:</h4>
          <p className="text-sm text-blue-800 italic">"{transcript}"</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 space-y-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-900 mb-2">🤖 AI-Powered Transcription Active</h4>
          <p className="text-sm text-green-800">
            Your audio will be processed using OpenAI Whisper for transcription and GPT-3.5-turbo for intelligent poll generation.
          </p>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">🎵 Real-time Audio & AI Processing</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>MediaRecorder API:</strong> 1-second audio chunking</p>
            <p>• <strong>Web Audio API:</strong> Real-time level monitoring</p>
            <p>• <strong>WebSocket Streaming:</strong> Live chunk transmission</p>
            <p>• <strong>Real-time AI:</strong> Live transcription during recording</p>
            <p>• <strong>Live Poll Generation:</strong> Questions generated every 5 seconds</p>
            <p>• <strong>Audio Quality:</strong> Automatic noise suppression & echo cancellation</p>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">💡 Tips for Best Results:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Speak clearly and at a moderate pace</li>
            <li>• Mention key topics, concepts, or questions you want to cover</li>
            <li>• Record for at least 30 seconds for meaningful content</li>
            <li>• Ensure good microphone quality and minimal background noise</li>
            <li>• Include educational content, explanations, and key concepts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;
