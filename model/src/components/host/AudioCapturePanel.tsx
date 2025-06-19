// src/components/host/AudioCapturePanel.tsx

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Settings, Volume2, Waves, History, X, CheckCircle } from 'lucide-react';
import GlassCard from '../GlassCard';
import toast from 'react-hot-toast';

// --- Type Definitions ---
interface PollDataFromAPI {
  question: string;
  options: string[];
  correctOptionIndex: number;
}
interface AudioCapturePanelProps {
  onPollGenerated: (poll: PollDataFromAPI) => void;
}
interface HistoryItem {
  id: string;
  timestamp: string;
  transcript: string;
  poll: PollDataFromAPI;
}
interface AudioDevice {
  deviceId: string;
  label: string;
}
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

const AudioCapturePanel: React.FC<AudioCapturePanelProps> = ({ onPollGenerated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  const [audioLevel, setAudioLevel] = useState(0);
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // --- Setup and Teardown ---
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('pollHistory');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (error) {
      console.error("Failed to parse history from localStorage", error);
    }

    const SpeechRecognition = (window as IWindow).SpeechRecognition || (window as IWindow).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        resetSilenceTimeout();
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript.trimStart() + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimTranscript(interim);
        if (final) {
          setFinalTranscript(prev => prev + final);
        }
      };
      
      recognition.onend = () => {
        // Check component mount status if needed or rely on isRecording state
        if (isRecording) stopRecording(false);
      };

      recognition.onerror = (event: any) => {
        toast.error(`Speech recognition error: ${event.error}`);
        stopRecording(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      toast.error("Speech Recognition not supported in this browser.");
    }
    
    getAudioDevices();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      recognitionRef.current?.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // isRecording dependency removed to prevent re-initialization

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [finalTranscript, interimTranscript]);

  // --- COMPLETE FUNCTION DEFINITIONS ---

  const getAudioDevices = async () => {
    try {
      // Prompt for permission which is necessary to enumerate devices
      await navigator.mediaDevices.getUserMedia({ audio: true }); 
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(device => device.kind === 'audioinput');
      setDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedDevice) {
        setSelectedDevice(audioInputs[0].deviceId);
      }
    } catch (error) {
      toast.error('Unable to access audio devices. Please grant permission.');
    }
  };

  const updateAudioLevel = () => {
    if (analyserRef.current && audioContextRef.current && audioContextRef.current.state === 'running') {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };
  
  const startRecording = async () => {
    if (!recognitionRef.current) return toast.error("Speech Recognition not available.");
    
    setFinalTranscript('');
    setInterimTranscript('');
    setIsRecording(true); // Set state immediately for UI feedback

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedDevice ? { exact: selectedDevice } : undefined }
      });
      
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      updateAudioLevel();

      recognitionRef.current.start();
      resetSilenceTimeout();
      toast.success('Recording started');
    } catch (error) {
      toast.error('Could not start recording. Check microphone permissions.');
      setIsRecording(false); // Reset state on error
    }
  };

  const stopRecording = (showToast = true) => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (audioContextRef.current) audioContextRef.current.close().catch();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    
    setAudioLevel(0);
    setIsRecording(false);
    if (showToast) toast.success('Recording stopped');
  };
  
  const resetSilenceTimeout = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    silenceTimeoutRef.current = setTimeout(() => {
        // Check isRecording state inside timeout to avoid stopping if already stopped
        if (recognitionRef.current && isRecording) {
            toast.error("Stopped due to inactivity.");
            stopRecording(false);
        }
    }, 10000); // 10 seconds
  };

  const clearTranscript = () => {
    setFinalTranscript('');
    setInterimTranscript('');
    toast.success('Transcript cleared');
  };

  const handleGeneratePoll = async () => {
    const fullTranscript = (finalTranscript + interimTranscript).trim();
    if (!fullTranscript) {
        toast.error("Please provide some text first.");
        return;
    }
    setIsGenerating(true);
    const generationToast = toast.loading('Generating poll...');
    try {
        const response = await fetch('http://localhost:5000/api/generate-poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: fullTranscript }),
        });
        const data: PollDataFromAPI = await response.json();
        if (!response.ok) throw new Error((data as any).error || "An unknown error occurred.");
        
        toast.success('Poll generated!', { id: generationToast });
        onPollGenerated(data);
        
        const newHistoryItem: HistoryItem = {
          id: new Date().toISOString(),
          timestamp: new Date().toLocaleString(),
          transcript: fullTranscript,
          poll: data,
        };
        setHistory(prev => {
          const updatedHistory = [newHistoryItem, ...prev];
          localStorage.setItem('pollHistory', JSON.stringify(updatedHistory));
          return updatedHistory;
        });

        setFinalTranscript('');
        setInterimTranscript('');

    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to generate poll.";
        toast.error(message, { id: generationToast });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setFinalTranscript(event.target.value);
    setInterimTranscript('');
  };

  const fullTranscript = finalTranscript + interimTranscript;

  return (
    <div className="p-6 h-full overflow-auto relative">
      <div className="absolute top-0 right-6 z-20">
        <button onClick={() => setIsHistoryVisible(true)} className="btn-secondary flex items-center">
          <History className="w-4 h-4 mr-2" />
          View History
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Audio Capture</h1>
        <p className="text-gray-300">Capture audio or paste text to generate interactive polls.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <GlassCard className="p-6 col-span-1">
          <div className="text-center">
            <motion.button
              onClick={isRecording ? () => stopRecording(true) : startRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 mx-auto transition-all duration-300 ${isRecording ? 'bg-red-500/20 border-2 border-red-500 text-red-400 animate-pulse' : 'bg-electric-cyan/20 border-2 border-electric-cyan text-electric-cyan hover:bg-electric-cyan/30'}`}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </motion.button>
            <h3 className="text-xl font-semibold text-white mb-2">{isRecording ? 'Recording...' : 'Ready to Record'}</h3>
            <p className="text-gray-300 text-sm mb-4">{isRecording ? 'Click to stop manually' : 'Click the mic to start'}</p>
            <button onClick={() => setShowSettings(!showSettings)} className="btn-secondary text-sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-6 col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Waves className="w-5 h-5 mr-2 text-electric-cyan" /> Audio Level
          </h3>
          <div className="space-y-4">
            <div className="progress-bar h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="progress-fill h-full bg-electric-cyan"
                animate={{ width: `${audioLevel * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
            <div className="flex justify-center">
              <motion.div
                className="w-16 h-16 rounded-full bg-gradient-to-r from-electric-cyan to-vibrant-magenta flex items-center justify-center"
                animate={{ scale: 1 + audioLevel * 0.3, opacity: 0.7 + audioLevel * 0.3 }}
                transition={{ duration: 0.1 }}
              >
                <Volume2 className="w-6 h-6 text-white" />
              </motion.div>
            </div>
            <p className="text-center text-gray-300 text-sm">{isRecording ? 'Listening...' : 'Microphone inactive'}</p>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6 col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Session Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-300">Words:</span>
              <span className="text-white font-medium">{fullTranscript.split(/\s+/).filter(Boolean).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Status:</span>
              <span className={isRecording ? "text-green-400 font-medium" : "text-gray-400 font-medium"}>
                {isRecording ? "Active" : "Idle"}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Audio Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Microphone Device</label>
                  <select 
                    value={selectedDevice} 
                    onChange={(e) => setSelectedDevice(e.target.value)} 
                    className="glass-input w-full" 
                    disabled={isRecording}
                  >
                    {devices.map(device => (<option key={device.deviceId} value={device.deviceId}>{device.label}</option>))}
                  </select>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Live Transcript</h3>
          <button onClick={clearTranscript} className="btn-secondary text-sm" disabled={!fullTranscript}>Clear</button>
        </div>
        <div className="relative">
          <textarea
            ref={textareaRef}
            className="bg-charcoal/30 rounded-lg p-4 w-full text-white leading-relaxed min-h-[96px] max-h-64 overflow-y-auto resize-none relative z-10"
            value={fullTranscript}
            onChange={handleTextChange}
            placeholder={isRecording ? 'Listening for speech...' : 'Start recording or paste text here'}
          />
          {/* This is a clever trick: an underlying div shows the interim text in a different color */}
          <div className="absolute top-0 left-0 p-4 w-full text-gray-500 leading-relaxed pointer-events-none z-0">
            {finalTranscript}<span className="text-gray-400">{interimTranscript}</span>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleGeneratePoll}
            className="btn-primary w-full"
            disabled={isGenerating || !fullTranscript.trim()}
          >
            {isGenerating ? 'Generating Poll...' : 'Create Poll from Transcript'}
          </button>
        </div>
      </GlassCard>

      <AnimatePresence>
        {isHistoryVisible && (
          <motion.div
            className="absolute top-0 right-0 h-full w-full lg:w-1/3 bg-charcoal/80 backdrop-blur-lg shadow-2xl z-50 p-6 flex flex-col"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Poll History</h2>
              <button onClick={() => setIsHistoryVisible(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {history.length > 0 ? (
                history.map(item => (
                  <div key={item.id} className="bg-space-blue/50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2">{item.timestamp}</p>
                    <p className="text-white font-semibold mb-3">{item.poll.question}</p>
                    <ul className="space-y-2 text-sm">
                      {item.poll.options.map((option, index) => {
                        const isCorrect = index === item.poll.correctOptionIndex;
                        return (
                          <li key={index} className={`flex items-center p-2 rounded ${isCorrect ? 'bg-green-500/20 text-green-300' : 'text-gray-300'}`}>
                            {isCorrect && <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />}
                            <span>{option}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 mt-10">No history yet.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AudioCapturePanel;