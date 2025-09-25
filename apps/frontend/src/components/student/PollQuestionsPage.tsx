"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Trophy,
  CheckCircle,
  X,
  ArrowRight,
  Zap,
  Target,
  Award,
  TrendingUp,
  Star,
  Timer,
  Brain,
  Lightbulb,
  Wifi,
  WifiOff,
} from "lucide-react";
import GlassCard from "../GlassCard";
import { useCopyProtection } from "../../hooks/useCopyProtection";
import io from "socket.io-client";
import config from "../../config/websocket";

interface DataChangeEvent {
  type: "insert" | "update" | "delete" | "replace";
  collection: string;
  id?: string;
  data?: any;
  timestamp: string;
}

interface BackendQuestion {
  _id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  concept: string;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  timeLimit: number;
  points: number;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  correctAnswer: number;
}

interface PollQuestionsPageProps {
  roomCode: string;
  onComplete?: () => void;
}

const PollQuestionsPage: React.FC<PollQuestionsPageProps> = ({
  roomCode,
  onComplete,
}) => {
  useCopyProtection(true);

  // Real-time connection state
  const [socket, setSocket] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [backendQuestions, setBackendQuestions] = useState<BackendQuestion[]>(
    [],
  );
  const [recentChanges, setRecentChanges] = useState<DataChangeEvent[]>([]);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "success" | "info" | "warning" }>
  >([]);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Transform backend questions to frontend format
  const transformBackendQuestions = (
    backendQuestions: BackendQuestion[],
  ): Question[] => {
    const activeQuestions = backendQuestions.filter(
      (q) => q.is_active && q.is_approved,
    );

    return activeQuestions.map((backendQ) => {
      // Find the correct answer index
      const correctAnswerIndex = backendQ.options.findIndex(
        (option) => option === backendQ.correct_answer,
      );

      // Map difficulty to frontend format
      const difficulty = (backendQ.difficulty.charAt(0).toUpperCase() +
        backendQ.difficulty.slice(1)) as "Easy" | "Medium" | "Hard";

      // Calculate points based on difficulty
      const difficultyPoints = {
        Easy: 100,
        Medium: 150,
        Hard: 200,
      };

      // Calculate time limit based on difficulty
      const difficultyTimeLimit = {
        Easy: 30,
        Medium: 25,
        Hard: 35,
      };

      return {
        id: backendQ._id,
        question: backendQ.question,
        options: backendQ.options,
        timeLimit: difficultyTimeLimit[difficulty],
        points: difficultyPoints[difficulty],
        difficulty: difficulty,
        category: backendQ.concept || "General",
        correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
      };
    });
  };

  // Fallback questions for when backend questions aren't available
  const fallbackQuestions: Question[] = [
    {
      id: "fallback-1",
      question: "Loading questions from backend...",
      options: [
        "Please wait",
        "Connecting to server",
        "Loading data",
        "Almost ready",
      ],
      timeLimit: 30,
      points: 100,
      difficulty: "Easy",
      category: "System",
      correctAnswer: 0,
    },
  ];

  // Get questions from backend or use fallback
  const questions =
    backendQuestions.length > 0
      ? transformBackendQuestions(backendQuestions)
      : fallbackQuestions;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30); // Default time, will be updated when questions load
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalParticipants] = useState(47);
  const [answeredCount, setAnsweredCount] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Update timer when questions change or current question changes
  useEffect(() => {
    if (currentQuestion && !isAnswered) {
      setTimeLeft(currentQuestion.timeLimit);
    }
  }, [currentQuestion, isAnswered]);

  // Reset poll when backend questions change
  useEffect(() => {
    if (backendQuestions.length > 0) {
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowResult(false);
      setScore(0);
      setStreak(0);
      setAnsweredCount(0);

      // Set initial timer for first question
      const transformedQuestions = transformBackendQuestions(backendQuestions);
      if (transformedQuestions.length > 0) {
        setTimeLeft(transformedQuestions[0].timeLimit);
      }
    }
  }, [backendQuestions]);

  // --- useEffect: timer logic ---
  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleTimeUp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isAnswered]);

  // --- handleTimeUp ---
  const handleTimeUp = () => {
    setIsAnswered(true);
    setShowResult(true);
    setStreak(0); // Reset streak on timeout
    setTimeout(() => {
      nextQuestion();
    }, 3000);
  };

  // --- handleAnswerSelect ---
  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return;

    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    setShowResult(true);
    setAnsweredCount(Math.floor(Math.random() * totalParticipants) + 20); // Simulate other participants

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      const timeBonus = Math.floor((timeLeft / currentQuestion.timeLimit) * 50);
      const totalPoints = currentQuestion.points + timeBonus;
      setScore(score + totalPoints);
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      nextQuestion();
    }, 3000);
  };

  // --- nextQuestion ---
  const nextQuestion = () => {
    if (isLastQuestion) {
      onComplete?.();
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowResult(false);
    setTimeLeft(questions[nextIndex]?.timeLimit || 30);
    setAnsweredCount(0);
  };

  // --- handleFinalResults ---
  const handleFinalResults = async () => {
    try {
      // Get user data from localStorage
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        console.error("No user found in localStorage");
        showToast("Error: User not found", "warning");
        return;
      }

      const user = JSON.parse(storedUser);
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";

      // Prepare result data
      const resultData = {
        user_name:
          user.fullName ||
          (user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : "Unknown User"),
        user_id: user.id,
        score: score,
        room_code: roomCode,
      };

      // Validate required fields
      if (!resultData.user_id) {
        console.error("User ID is missing");
        showToast("Error: User ID is missing", "warning");
        return;
      }

      console.log("Saving result:", resultData);

      // Send result to backend
      const response = await fetch(`${API_URL}/results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resultData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Result saved successfully:", result);
        showToast("Result saved successfully!", "success");
      } else {
        const error = await response.json();
        console.error("Error saving result:", error);
        showToast("Error saving result", "warning");
      }
    } catch (error) {
      console.error("Error saving result:", error);
      showToast("Error saving result", "warning");
    }
  };

  // --- getDifficultyColor ---
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "from-green-500 to-emerald-500";
      case "Medium":
        return "from-yellow-500 to-orange-500";
      case "Hard":
        return "from-red-500 to-pink-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  // --- getTimerColor ---
  const getTimerColor = () => {
    if (timeLeft <= 5) return "text-red-400 animate-pulse";
    if (timeLeft <= 10) return "text-yellow-400";
    return "text-green-400";
  };

  // --- Real-time helper functions ---
  const showToast = useCallback(
    (message: string, type: "success" | "info" | "warning") => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto-remove toast after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 3000);
    },
    [],
  );

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log("Audio context not available");
    }
  }, []);

  const addRecentChange = useCallback((change: DataChangeEvent) => {
    setRecentChanges((prev) => {
      const newChanges = [change, ...prev.slice(0, 4)]; // Keep last 5 changes
      return newChanges;
    });
  }, []);

  // --- Real-time Socket.IO connection ---
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let currentAttempts = 0;
    let isComponentMounted = true;

    const connectSocket = () => {
      if (!isComponentMounted) return;

      try {
        const newSocket = io(config.socketIO.url, config.socketIO.options);

        setSocket(newSocket);
        currentAttempts += 1;

        newSocket.on("connect", () => {
          if (!isComponentMounted) return;
          console.log("✅ Connected to Socket.IO server");
          setConnected(true);
          currentAttempts = 0;
          setLastActivity(new Date());
          showToast("Connected to real-time server", "success");

          // Join the room for this poll
          newSocket.emit("join-room", roomCode);

          // Request initial data when connected
          newSocket.emit("request-initial-data");
        });

        newSocket.on("connect_error", (error: any) => {
          if (!isComponentMounted) return;
          console.error("❌ Connection error:", error);
          setConnected(false);

          // Only show toast for first few attempts to avoid spam
          if (currentAttempts <= 2) {
            showToast(
              `Connection failed (attempt ${currentAttempts})`,
              "warning",
            );
          }

          // Auto-retry connection after 5 seconds (max 3 attempts)
          if (currentAttempts < 3) {
            reconnectTimeout = setTimeout(() => {
              if (isComponentMounted) {
                connectSocket();
              }
            }, 3000);
          } else {
            console.log(
              "Max connection attempts reached. Real-time features disabled.",
            );
          }
        });

        newSocket.on("disconnect", () => {
          if (!isComponentMounted) return;
          console.log("❌ Disconnected from Socket.IO server");
          setConnected(false);
          showToast("Disconnected from server", "warning");
        });

        // Listen for initial data
        newSocket.on(
          "initial-data",
          (data: { questions: BackendQuestion[]; timestamp: string }) => {
            console.log("📥 Initial data received:", data);
            setBackendQuestions(data.questions);
            setLastActivity(new Date());
            showToast(`Loaded ${data.questions.length} questions`, "info");
          },
        );

        // Listen for real-time question changes
        newSocket.on("question-added", (change: DataChangeEvent) => {
          console.log("📥 New question added:", change);
          setBackendQuestions((prev) => [change.data, ...prev]);
          addRecentChange(change);
          setLastActivity(new Date());
          showToast(`New question added`, "success");
          playNotificationSound();
        });

        newSocket.on("question-updated", (change: DataChangeEvent) => {
          console.log("📥 Question updated:", change);
          setBackendQuestions((prev) =>
            prev.map((q) => (q._id === change.id ? change.data : q)),
          );
          addRecentChange(change);
          setLastActivity(new Date());
          showToast("Question updated", "info");
        });

        newSocket.on("question-deleted", (change: DataChangeEvent) => {
          console.log("📥 Question deleted:", change);
          setBackendQuestions((prev) =>
            prev.filter((q) => q._id !== change.id),
          );
          addRecentChange(change);
          setLastActivity(new Date());
          showToast("Question deleted", "warning");
        });

        // Listen for poll events
        newSocket.on("poll", (questions: BackendQuestion[]) => {
          console.log("📥 New Poll Received:", questions);
          setLastActivity(new Date());
          showToast(`New poll with ${questions.length} questions!`, "info");
          playNotificationSound();
        });

        // Listen for generic data changes
        // Listen for initial data
        newSocket.on(
          "initial-data",
          (data: { questions: BackendQuestion[]; timestamp: string }) => {
            if (!isComponentMounted) return;
            console.log("📥 Initial data received:", data);
            setBackendQuestions(data.questions);
            setLastActivity(new Date());
            showToast(`Loaded ${data.questions.length} questions`, "info");
          },
        );

        // Listen for real-time question changes
        newSocket.on("question-added", (change: DataChangeEvent) => {
          if (!isComponentMounted) return;
          console.log("📥 New question added:", change);
          setBackendQuestions((prev) => [change.data, ...prev]);
          addRecentChange(change);
          setLastActivity(new Date());
          showToast(`New question added`, "success");
          playNotificationSound();
        });

        newSocket.on("question-updated", (change: DataChangeEvent) => {
          if (!isComponentMounted) return;
          console.log("📥 Question updated:", change);
          setBackendQuestions((prev) =>
            prev.map((q) => (q._id === change.id ? change.data : q)),
          );
          addRecentChange(change);
          setLastActivity(new Date());
          showToast("Question updated", "info");
        });

        newSocket.on("question-deleted", (change: DataChangeEvent) => {
          if (!isComponentMounted) return;
          console.log("📥 Question deleted:", change);
          setBackendQuestions((prev) =>
            prev.filter((q) => q._id !== change.id),
          );
          addRecentChange(change);
          setLastActivity(new Date());
          showToast("Question deleted", "warning");
        });

        // Listen for poll events
        newSocket.on("poll", (questions: BackendQuestion[]) => {
          if (!isComponentMounted) return;
          console.log("📥 New Poll Received:", questions);
          setLastActivity(new Date());
          showToast(`New poll with ${questions.length} questions!`, "info");
          playNotificationSound();
        });

        // Listen for generic data changes
        newSocket.on("data-changed", (change: DataChangeEvent) => {
          if (!isComponentMounted) return;
          console.log("📥 Data changed:", change);
          addRecentChange(change);
          setLastActivity(new Date());
        });

        return newSocket;
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        setConnected(false);
        return null;
      }
    };

    const socketInstance = connectSocket();

    // Cleanup on unmount
    return () => {
      isComponentMounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (socketInstance && typeof socketInstance.close === "function") {
        socketInstance.close();
      }
    };
  }, [roomCode, showToast, playNotificationSound, addRecentChange]);

  // Safety check for currentQuestion
  if (!currentQuestion) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <GlassCard className="p-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="text-xl text-white">
                Loading Poll Questions...
              </span>
            </div>
            <p className="text-gray-400">
              {connected
                ? "Fetching questions from server..."
                : "Connecting to server..."}
            </p>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-full px-6 py-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-medium">
              Live Session Active
            </span>
          </div>
          {/* Real-time Connection Status */}
          <div
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border ${
              connected
                ? "bg-green-500/20 border-green-500/30"
                : "bg-red-500/20 border-red-500/30"
            }`}
          >
            {connected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span
              className={`text-sm font-medium ${
                connected ? "text-green-400" : "text-red-400"
              }`}
            >
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Interactive Poll</h1>
        {/* Show the room code here */}
        <p className="text-gray-400 truncate max-w-md mx-auto">{roomCode}</p>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-primary-400 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-2xl font-bold text-white">{score}</span>
              </div>
              <p className="text-xs text-gray-400">Total Score</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-yellow-400 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-2xl font-bold text-white">{streak}</span>
              </div>
              <p className="text-xs text-gray-400">Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-blue-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-2xl font-bold text-white">
                  {totalParticipants}
                </span>
              </div>
              <p className="text-xs text-gray-400">Participants</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-green-400 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-2xl font-bold text-white">
                  {Math.round(progress)}%
                </span>
              </div>
              <p className="text-xs text-gray-400">Progress</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Real-time Data Section */}
          {connected && backendQuestions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-400">Live Questions Pool:</span>
                  <span className="text-green-400 font-medium">
                    {
                      backendQuestions.filter(
                        (q) => q.is_active && q.is_approved,
                      ).length
                    }
                  </span>
                  <button
                    onClick={() => socket?.emit("request-initial-data")}
                    className="ml-2 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    title="Refresh data"
                  >
                    <svg
                      className="w-3 h-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
                <div className="text-gray-400">
                  Last update: {lastActivity.toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* Real-time Offline Notice */}
          {!connected && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Real-time features unavailable - playing in offline mode
                </span>
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          <GlassCard className="p-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 right-4">
                <Brain className="w-32 h-32 text-white" />
              </div>
            </div>

            {/* Question Header */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                {/* Timer */}
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex items-center space-x-2 ${getTimerColor()}`}
                  >
                    <Timer className="w-6 h-6" />
                    <span className="font-bold text-3xl">{timeLeft}</span>
                    <span className="text-sm">sec</span>
                  </div>
                </div>

                {/* Question Info */}
                <div className="flex items-center space-x-4">
                  <div
                    className={`px-3 py-1 rounded-full bg-gradient-to-r ${getDifficultyColor(currentQuestion.difficulty)} text-white text-sm font-medium`}
                  >
                    {currentQuestion.difficulty}
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-sm">
                    {currentQuestion.category}
                  </div>
                  <div className="flex items-center space-x-1 text-yellow-400">
                    <Star className="w-4 h-4" />
                    <span className="font-bold">{currentQuestion.points}</span>
                  </div>
                </div>
              </div>

              {/* Question Number & Text */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-full px-4 py-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-primary-400" />
                  <span className="text-primary-400 font-medium">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Answer Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect =
                    showResult && index === currentQuestion.correctAnswer;
                  const isWrong = showResult && isSelected && !isCorrect;
                  const optionLabels = ["A", "B", "C", "D"];

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={isAnswered}
                      whileHover={!isAnswered ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!isAnswered ? { scale: 0.98 } : {}}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden
                        ${
                          isCorrect
                            ? "bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20"
                            : isWrong
                              ? "bg-red-500/20 border-red-500 shadow-lg shadow-red-500/20"
                              : isSelected
                                ? "bg-primary-500/20 border-primary-500 shadow-lg shadow-primary-500/20"
                                : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg"
                        }
                        ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      {/* Option Background Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`
                            w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg
                            ${
                              isCorrect
                                ? "bg-green-500 text-white"
                                : isWrong
                                  ? "bg-red-500 text-white"
                                  : isSelected
                                    ? "bg-primary-500 text-white"
                                    : "bg-white/10 text-gray-300 group-hover:bg-white/20"
                            }
                          `}
                          >
                            {optionLabels[index]}
                          </div>
                          <span
                            className={`
                            font-medium text-lg
                            ${
                              isCorrect
                                ? "text-green-400"
                                : isWrong
                                  ? "text-red-400"
                                  : isSelected
                                    ? "text-primary-400"
                                    : "text-white"
                            }
                          `}
                          >
                            {option}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {showResult && isCorrect && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center space-x-1 text-green-400"
                            >
                              <CheckCircle className="w-6 h-6" />
                              <span className="font-bold">Correct!</span>
                            </motion.div>
                          )}
                          {showResult && isWrong && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center space-x-1 text-red-400"
                            >
                              <X className="w-6 h-6" />
                              <span className="font-bold">Wrong</span>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Live Stats */}
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <GlassCard className="p-4 bg-white/5">
                    <div className="flex items-center justify-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>
                          {answeredCount}/{totalParticipants} answered
                        </span>
                      </div>
                      {selectedAnswer === currentQuestion.correctAnswer && (
                        <div className="flex items-center space-x-2 text-green-400">
                          <TrendingUp className="w-4 h-4" />
                          <span>
                            +
                            {currentQuestion.points +
                              Math.floor(
                                (timeLeft / currentQuestion.timeLimit) * 50,
                              )}{" "}
                            points
                          </span>
                        </div>
                      )}
                      {streak > 1 && (
                        <div className="flex items-center space-x-2 text-yellow-400">
                          <Zap className="w-4 h-4" />
                          <span>{streak} streak!</span>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* Next Question Button */}
              {isLastQuestion && isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 text-center"
                >
                  <button
                    onClick={handleFinalResults}
                    className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold text-lg rounded-2xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Award className="w-6 h-6" />
                    <span>View Final Results</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 space-y-2 z-50">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`px-4 py-3 rounded-lg shadow-lg border transform transition-all duration-300 ${
                toast.type === "success"
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : toast.type === "warning"
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    : "bg-blue-500/20 text-blue-400 border-blue-500/30"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm">
                  {toast.type === "success"
                    ? "✅"
                    : toast.type === "warning"
                      ? "⚠️"
                      : "ℹ️"}
                </span>
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent Changes Indicator */}
      {recentChanges.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 max-w-sm"
          >
            <div className="text-white text-sm font-medium mb-2">
              Recent Updates ({recentChanges.length})
            </div>
            <div className="space-y-1">
              {recentChanges.slice(0, 3).map((change, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-300 flex items-center space-x-2"
                >
                  <span>
                    {change.type === "insert"
                      ? "➕"
                      : change.type === "update"
                        ? "✏️"
                        : "🗑️"}
                  </span>
                  <span>
                    {change.type} in {change.collection}
                  </span>
                  <span className="text-gray-400">
                    {new Date(change.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PollQuestionsPage;
