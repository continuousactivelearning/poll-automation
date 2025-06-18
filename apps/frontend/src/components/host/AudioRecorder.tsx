import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AudioRecorderProps {
  meetingId: string;
  onPollsGenerated: (polls: any[]) => void;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  isProcessing: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ meetingId, onPollsGenerated }) => {
  const { currentUser } = useAuth();
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    isProcessing: false
  });
  
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        await processRecording();
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      
      setRecordingState(prev => ({ ...prev, isRecording: true, duration: 0 }));
      
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
      
      // Clear timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setRecordingState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isPaused: false,
        isProcessing: true 
      }));
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
      const response = await fetch('http://localhost:5000/api/audio/upload', {
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
              <p className="text-sm text-gray-500 mt-1">
                Duration: {formatDuration(recordingState.duration)}
              </p>
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

      {/* Transcript Display */}
      {transcript && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📝 Transcript:</h4>
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
