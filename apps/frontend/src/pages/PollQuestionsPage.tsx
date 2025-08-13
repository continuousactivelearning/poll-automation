"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  Trophy,
  CheckCircle,
  Zap,
  Target,
  TrendingUp,
  Timer,
  Lightbulb,
  Loader2,
  AlertCircle,
  Clock as ClockIcon,
  Send,
} from "lucide-react"
import GlassCard from "../components/GlassCard"
import { useCopyProtection } from "../hooks/useCopyProtection"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import { useNotificationContext } from "../contexts/NotificationContext"
import { useSearchParams } from "react-router-dom";
import { io } from 'socket.io-client';

// Interface for a single poll option
interface PollOption {
  id: string;
  text: string;
}

// Interface for the fetched poll data from backend
interface ManualPollQuestion {
  _id: string;
  sessionId: string;
  host: string;
  questionTitle: string;
  questionType: "mcq" | "truefalse" | "shortanswer" | "opinion";
  options: PollOption[];
  timerEnabled: boolean;
  timerDuration: number;
  timerUnit: "seconds" | "minutes";
  shortAnswerPlaceholder?: string;
  correctAnswer?: string;
  isActive: boolean;
  approvedAt: string; // ISO date string
  createdAt: string; // ISO date string
}

const API_BASE_URL = 'http://localhost:3000/api';
const SOCKET_SERVER_URL = 'http://localhost:3000';

const PollQuestionsPage: React.FC = () => {
  useCopyProtection(true);
  const { user, token, isLoading: authLoading } = useAuth();
  const { showNotification } = useNotificationContext();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get('roomCode');

  const [activePoll, setActivePoll] = useState<ManualPollQuestion | null>(null);
  const [loadingPoll, setLoadingPoll] = useState(true);
  const [pollError, setPollError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'inactive' | 'blocked' | 'unauthorized' | 'unjoined' | 'invalid_room_code' | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState<string>('');
  const [isAnswered, setIsAnswered] = useState(false);

  const [streak, setStreak] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  const lastActivePollIdRef = useRef<string | null>(null);

  const fetchActivePoll = useCallback(async (currentRoomCode: string | null) => {
    console.log("fetchActivePoll called for roomCode:", currentRoomCode);

    if (!currentRoomCode) {
      setLoadingPoll(false);
      setPollError("No room code provided. Please join a session first.");
      setSessionStatus('invalid_room_code');
      console.log("No room code provided, stopping fetch.");
      return;
    }

    if (!user?.id || !token) {
      setLoadingPoll(false);
      setPollError("You must be logged in to view polls.");
      setSessionStatus('unauthorized');
      console.log("User not authenticated, stopping fetch.");
      return;
    }

    if (!activePoll || pollError) {
        setLoadingPoll(true);
        setPollError(null);
        setActivePoll(null);
        setTimerExpired(false);
        setSelectedOption(null);
        setShortAnswer('');
        setIsAnswered(false);
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get<{ message: string, poll: ManualPollQuestion | null, sessionStatus?: string, sessionId?: string }>(
        `${API_BASE_URL}/manual-polls/active/${currentRoomCode}`,
        config
      );

      const { poll, sessionStatus: backendSessionStatus, message } = response.data;
      console.log("Backend response for active poll:", response.data);

      if (backendSessionStatus) {
        setSessionStatus(backendSessionStatus as any);
      }

      if (poll) {
        if (lastActivePollIdRef.current === poll._id) {
          console.log("Received same active poll ID, no state update needed.");
          setLoadingPoll(false);
          return;
        }

        setActivePoll(poll);
        lastActivePollIdRef.current = poll._id;
        console.log("Active poll received and set:", poll);
        setPollError(null);
        
        if (poll.timerEnabled && poll.timerDuration > 0) {
          const approvedTime = new Date(poll.approvedAt).getTime();
          const durationInSeconds = poll.timerUnit === 'minutes' ? poll.timerDuration * 60 : poll.timerDuration;
          const now = Date.now();
          const endTime = approvedTime + (durationInSeconds * 1000);
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

          console.log(`Timer Debug: approvedAt=${new Date(approvedTime).toISOString()}, duration=${durationInSeconds}s, now=${new Date(now).toISOString()}, endTime=${new Date(endTime).toISOString()}, remaining=${remaining}s`);

          setTimeLeft(remaining);
          if (remaining <= 0) {
            setTimerExpired(true);
            showNotification("Time's up for this poll!", "info");
          }
        } else {
          setTimeLeft(null);
          setTimerExpired(false);
        }
      } else {
        setActivePoll(null);
        lastActivePollIdRef.current = null;
        setPollError(message || "No active poll for this session yet.");
        console.log("No active poll returned by backend.");
      }
    } catch (error: any) {
      console.error("Error fetching active poll:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || "Failed to fetch active poll.";
      setPollError(errorMessage);
      if (error.response?.data?.sessionStatus) {
        setSessionStatus(error.response.data.sessionStatus);
      } else {
        setSessionStatus('unauthorized');
      }
    } finally {
      setLoadingPoll(false);
      console.log("fetchActivePoll finished. loadingPoll:", false);
    }
  }, [user?.id, token, showNotification, activePoll, pollError]);

  useEffect(() => {
    console.log("Initial fetch useEffect triggered.");
    if (!authLoading && roomCode) {
      fetchActivePoll(roomCode);
    } else if (!authLoading && !roomCode) {
      setLoadingPoll(false);
      setPollError("No room code found in URL. Please ensure you joined via a valid link.");
      setSessionStatus('invalid_room_code');
    }
  }, [authLoading, roomCode, fetchActivePoll]);

  // NEW: Socket.IO Integration Effect - Replaces polling
  useEffect(() => {
    if (!roomCode) {
      console.log("No roomCode, skipping Socket.IO connection.");
      return;
    }

    const socket = io(SOCKET_SERVER_URL); // Connect to Socket.IO server

    console.log("Attempting to connect to Socket.IO server...");

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server:', socket.id);
      // Optionally join a room specific to the session
      // socket.emit('joinSessionRoom', roomCode); // If you implement rooms on backend
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
      showNotification(`Real-time connection error: ${err.message}`, "error");
    });

    socket.on('newPollAvailable', (data: { roomCode: string, pollId: string }) => {
      console.log('Received newPollAvailable event:', data);
      if (data.roomCode === roomCode) {
        showNotification("New poll has arrived!", "success");
        setActivePoll(null); // Clear current poll to force re-fetch
        lastActivePollIdRef.current = null; // Clear ref to ensure new poll is set
        fetchActivePoll(roomCode); // Fetch the new poll
      }
    });

    return () => {
      console.log("Disconnecting Socket.IO client.");
      socket.disconnect();
    };
  }, [roomCode, showNotification, fetchActivePoll]); // Dependencies for Socket.IO effect

  // Timer countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (activePoll?.timerEnabled && timeLeft !== null && timeLeft > 0 && !timerExpired) {
      console.log("Starting timer countdown. Initial timeLeft:", timeLeft);
      timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime === null || prevTime <= 1) {
            clearInterval(timer!);
            setTimerExpired(true);
            showNotification("Time's up!", "info");
            console.log("Timer expired or reached 0.");
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
        console.log("Timer cleared.");
      }
    };
  }, [activePoll, timeLeft, timerExpired, showNotification]);

  const handleSubmitAnswer = async () => {
    if (isAnswered || timerExpired || !activePoll) return;

    if (activePoll.questionType === 'shortanswer' && !shortAnswer.trim()) {
      showNotification("Please provide an answer.", "error");
      return;
    }
    if ((activePoll.questionType === 'mcq' || activePoll.questionType === 'truefalse' || activePoll.questionType === 'opinion') && !selectedOption) {
      showNotification("Please select an option.", "error");
      return;
    }

    setIsAnswered(true);

    let correct = false;
    let message = "Answer submitted!";

    if (activePoll.questionType === 'mcq' || activePoll.questionType === 'truefalse') {
      if (selectedOption === activePoll.correctAnswer) {
        correct = true;
        message = "Correct Answer!";
        setStreak(prev => prev + 1);
        setCorrectAnswersCount(prev => prev + 1);
      } else {
        correct = false;
        message = `Incorrect. Correct answer was: ${activePoll.correctAnswer}`;
        setStreak(0);
      }
    } else if (activePoll.questionType === 'shortanswer') {
      message = "Short answer submitted!";
    } else if (activePoll.questionType === 'opinion') {
      message = "Opinion submitted!";
    }

    showNotification(message, correct ? "success" : "error");

    setTimeout(() => {
      console.log("Answer submitted, clearing current poll and fetching new poll after delay.");
      setActivePoll(null);
      lastActivePollIdRef.current = null;
      fetchActivePoll(roomCode);
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderPollContent = () => {
    if (loadingPoll) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
          <p className="mt-4 text-gray-300">Loading poll...</p>
        </div>
      );
    }

    if (pollError) {
      return (
        <div className="text-center p-8">
          <AlertCircle className="w-10 h-10 mx-auto text-red-400 mb-4" />
          <p className="text-red-400 text-lg font-semibold">{pollError}</p>
          {sessionStatus === 'unauthorized' && <p className="text-gray-400 mt-2">You must be logged in to view polls.</p>}
          {sessionStatus === 'unjoined' && <p className="text-gray-400 mt-2">Please join the session to view active polls.</p>}
          {sessionStatus === 'blocked' && <p className="text-gray-400 mt-2">You have been blocked from this session.</p>}
          {sessionStatus === 'inactive' && <p className="text-gray-400 mt-2">This session is currently inactive.</p>}
          {sessionStatus === 'invalid_room_code' && <p className="text-gray-400 mt-2">Please ensure the room code is correct and you joined via a valid link.</p>}
        </div>
      );
    }

    if (!activePoll) {
      return (
        <div className="text-center p-8">
          <Lightbulb className="w-10 h-10 mx-auto text-blue-400 mb-4" />
          <p className="text-blue-400 text-lg font-semibold">Waiting for the host to push a new poll...</p>
          <p className="text-gray-400 mt-2">Please be patient, the host will send a question shortly.</p>
        </div>
      );
    }

    const { questionTitle, questionType, options, timerEnabled, shortAnswerPlaceholder } = activePoll;

    return (
      <div className="space-y-6">
        {/* Poll Question */}
        <div className="text-center">
          <p className="text-2xl font-bold text-white mb-4">{questionTitle}</p>
        </div>

        {/* Timer Display */}
        {timerEnabled && timeLeft !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-center space-x-2 p-3 rounded-lg font-bold text-lg ${timerExpired ? "bg-red-500/20 text-red-400" : "bg-primary-500/20 text-primary-400"
              }`}
          >
            <ClockIcon className="w-5 h-5" />
            <span>{formatTime(timeLeft)}</span>
            {timerExpired && <span className="text-red-400 ml-2">(Time's Up!)</span>}
          </motion.div>
        )}

        {/* Answer Options / Input */}
        <div className="space-y-3">
          {questionType === "mcq" && (
            options.map((option, index) => (
              <motion.button
                key={option.id}
                onClick={() => !isAnswered && !timerExpired && setSelectedOption(option.id)}
                className={`w-full flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 ${selectedOption === option.id
                  ? "bg-primary-500/30 border-primary-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
                  } ${isAnswered || timerExpired ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99]"
                  }`}
                disabled={isAnswered || timerExpired}
                whileHover={isAnswered || timerExpired ? {} : { scale: 1.01 }}
                whileTap={isAnswered || timerExpired ? {} : { scale: 0.99 }}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-white font-medium">{option.text}</span>
              </motion.button>
            ))
          )}

          {questionType === "truefalse" && (
            <>
              <motion.button
                onClick={() => !isAnswered && !timerExpired && setSelectedOption("true")}
                className={`w-full flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 ${selectedOption === "true"
                  ? "bg-green-500/30 border-green-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
                  } ${isAnswered || timerExpired ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99]"
                  }`}
                disabled={isAnswered || timerExpired}
                whileHover={isAnswered || timerExpired ? {} : { scale: 1.01 }}
                whileTap={isAnswered || timerExpired ? {} : { scale: 0.99 }}
              >
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">T</div>
                <span className="text-white font-medium">True</span>
              </motion.button>
              <motion.button
                onClick={() => !isAnswered && !timerExpired && setSelectedOption("false")}
                className={`w-full flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 ${selectedOption === "false"
                  ? "bg-red-500/30 border-red-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
                  } ${isAnswered || timerExpired ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99]"
                  }`}
                disabled={isAnswered || timerExpired}
                whileHover={isAnswered || timerExpired ? {} : { scale: 1.01 }}
                whileTap={isAnswered || timerExpired ? {} : { scale: 0.99 }}
              >
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">F</div>
                <span className="text-white font-medium">False</span>
              </motion.button>
            </>
          )}

          {questionType === "shortanswer" && (
            <textarea
              value={shortAnswer}
              onChange={(e) => setShortAnswer(e.target.value)}
              placeholder={shortAnswerPlaceholder || "Type your answer here..."}
              rows={4}
              className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${isAnswered || timerExpired ? "opacity-60 cursor-not-allowed" : ""
                }`}
              disabled={isAnswered || timerExpired}
            />
          )}

          {questionType === "opinion" && (
            options.map((option, index) => (
              <motion.button
                key={option.id}
                onClick={() => !isAnswered && !timerExpired && setSelectedOption(option.id)}
                className={`w-full flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 ${selectedOption === option.id
                  ? "bg-purple-500/30 border-purple-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
                  } ${isAnswered || timerExpired ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99]"
                  }`}
                disabled={isAnswered || timerExpired}
                whileHover={isAnswered || timerExpired ? {} : { scale: 1.01 }}
                whileTap={isAnswered || timerExpired ? {} : { scale: 0.99 }}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <span className="text-white font-medium">{option.text}</span>
              </motion.button>
            ))
          )}
        </div>

        {/* Submit Answer Button */}
        <motion.button
          onClick={handleSubmitAnswer}
          disabled={isAnswered || timerExpired || loadingPoll || !activePoll || (activePoll.questionType === 'shortanswer' && !shortAnswer.trim()) || ((activePoll.questionType === 'mcq' || activePoll.questionType === 'truefalse' || activePoll.questionType === 'opinion') && !selectedOption)}
          className={`w-full px-6 py-3 font-semibold rounded-lg shadow-lg transition-all duration-200 ${isAnswered || timerExpired || loadingPoll || !activePoll || (activePoll.questionType === 'shortanswer' && !shortAnswer.trim()) || ((activePoll.questionType === 'mcq' || activePoll.questionType === 'truefalse' || activePoll.questionType === 'opinion') && !selectedOption)
            ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
            : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-green-500/40"
            }`}
          whileHover={isAnswered || timerExpired || loadingPoll || !activePoll ? {} : { scale: 1.02, y: -2 }}
          whileTap={isAnswered || timerExpired || loadingPoll || !activePoll ? {} : { scale: 0.98 }}
        >
          <div className="flex items-center justify-center space-x-2">
            {isAnswered ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span>{isAnswered ? "Answered!" : "Submit Answer"}</span>
          </div>
        </motion.button>

        <AnimatePresence>
          {/* Answer Result Feedback will go here once backend integration for answering is done */}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={activePoll?._id || "no-poll"} // Key changes when a new poll is active
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <GlassCard>
            <div className="p-6 rounded-lg shadow-xl bg-gray-800/50 backdrop-filter backdrop-blur-lg border border-gray-700/50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Live Poll</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-primary-400">
                    <Users className="w-5 h-5" />
                    <span>{correctAnswersCount} / {correctAnswersCount + streak}</span> {/* Dummy joined count */}
                  </div>
                  <div className="flex items-center space-x-2 text-yellow-400">
                    <Trophy className="w-5 h-5" />
                    <span>{correctAnswersCount}</span> {/* Dummy score */}
                  </div>
                </div>
              </div>

              {renderPollContent()}

              {/* Performance Metrics (Dummy for now) */}
              {activePoll && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GlassCard>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">Accuracy: 85%</span>
                    </div>
                  </GlassCard>
                  <GlassCard>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center space-x-3">
                      <Timer className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300">Avg. Time: 15s</span>
                    </div>
                  </GlassCard>
                  <GlassCard>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center space-x-3">
                      <Target className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-300">Polls Answered: {correctAnswersCount + streak}</span>
                    </div>
                  </GlassCard>
                  {streak > 0 && (
                    <GlassCard>
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center space-x-3">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <span>{streak} streak!</span>
                      </div>
                    </GlassCard>
                  )}
                </motion.div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default PollQuestionsPage
