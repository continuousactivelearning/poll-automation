"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Edit3, Clock, Settings, Play } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import GlassCard from "../components/GlassCard";
import AIControlPanel from "../components/AIControlPanel";
import io from "socket.io-client";
import config from "../config/websocket";

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

interface DataChangeEvent {
  type: "insert" | "update" | "delete" | "replace";
  collection: string;
  id?: string;
  data?: BackendQuestion;
  timestamp: string;
}

const AIQuestionFeed = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [questionsPerPoll, _setQuestionsPerPoll] = useState(5); // Default value, update as needed

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 100); // Show settings icon after scrolling 100px
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Real-time connection state
  const [_socket, setSocket] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [backendQuestions, setBackendQuestions] = useState<BackendQuestion[]>(
    [],
  );

  // Transform backend questions to frontend format
  const transformBackendQuestions = (backendQuestions: BackendQuestion[]) => {
    return backendQuestions.map((backendQ) => {
      // Find the correct answer index
      const correctAnswerIndex = backendQ.options.findIndex(
        (option) => option === backendQ.correct_answer,
      );

      // Map difficulty to frontend format
      const difficulty =
        backendQ.difficulty.charAt(0).toUpperCase() +
        backendQ.difficulty.slice(1);

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
        correct: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
        difficulty: difficulty as "Easy" | "Medium" | "Hard",
        tags: [backendQ.concept || "General"],
        confidence: 85, // Default confidence
        status: backendQ.is_approved
          ? "approved"
          : backendQ.is_active
            ? "pending"
            : "rejected",
        timeEstimate: `${difficultyTimeLimit[difficulty as keyof typeof difficultyTimeLimit]}s`,
      };
    });
  };

  // Real-time Socket.IO connection
  useEffect(() => {
    let isComponentMounted = true;

    const connectSocket = () => {
      if (!isComponentMounted) return;

      try {
        const newSocket = io(config.socketIO.url, config.socketIO.options);
        setSocket(newSocket);

        newSocket.on("connect", () => {
          if (!isComponentMounted) return;
          console.log("✅ Connected to Socket.IO server");
          setConnected(true);

          // Request initial data when connected
          newSocket.emit("request-initial-data");
        });

        newSocket.on("connect_error", (error: any) => {
          if (!isComponentMounted) return;
          console.error("❌ Connection error:", error);
          setConnected(false);
        });

        newSocket.on("disconnect", () => {
          if (!isComponentMounted) return;
          console.log("❌ Disconnected from Socket.IO server");
          setConnected(false);
        });

        // Listen for initial data
        newSocket.on(
          "initial-data",
          (data: { questions: BackendQuestion[]; timestamp: string }) => {
            if (!isComponentMounted) return;
            console.log("📥 Initial data received:", data);
            setBackendQuestions(data.questions);
          },
        );

        // Listen for real-time question changes
        newSocket.on("question-added", (change: DataChangeEvent) => {
          if (!isComponentMounted) return;
          console.log("📥 New question added:", change);
          setBackendQuestions((prev) => [change.data!, ...prev]);
        });

        newSocket.on("question-updated", (change: DataChangeEvent) => {
          if (!isComponentMounted) return;
          console.log("📥 Question updated:", change);
          setBackendQuestions((prev) =>
            prev.map((q) => (q._id === change.id ? change.data! : q)),
          );
        });

        newSocket.on("question-deleted", (change: DataChangeEvent) => {
          if (!isComponentMounted) return;
          console.log("📥 Question deleted:", change);
          setBackendQuestions((prev) =>
            prev.filter((q) => q._id !== change.id),
          );
        });

        return newSocket;
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        setConnected(false);
        return null;
      }
    };

    const socketInstance = connectSocket();

    // Also fetch initial data via API as fallback
    const fetchInitialData = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/questions");
        if (response.ok) {
          const data = await response.json();
          setBackendQuestions(data);
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };

    fetchInitialData();

    // Cleanup on unmount
    return () => {
      isComponentMounted = false;
      if (socketInstance && typeof socketInstance.close === "function") {
        socketInstance.close();
      }
    };
  }, []);

  // Use transformed questions for display
  const transformedQuestions = transformBackendQuestions(backendQuestions);

  const [_selectedQuestion, setSelectedQuestion] = useState<string | null>(
    null,
  );
  const [_isEditMode, setIsEditMode] = useState(false);
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [defaultTimer, setDefaultTimer] = useState(30);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);

  const handleApprove = (id: string) => {
    // For now, just log the action. In a full implementation,
    // you'd call an API to update the question status
    console.log("Approving question:", id);
  };

  const handleReject = (id: string) => {
    // For now, just log the action. In a full implementation,
    // you'd call an API to update the question status
    console.log("Rejecting question:", id);
  };

  const handleEdit = (id: string) => {
    setSelectedQuestion(id);
    setIsEditMode(true);
  };

  const handleLaunch = (id: string) => {
    console.log("Launching question:", id);
    // Implementation for launching question
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "Medium":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "Hard":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "rejected":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "pending":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  const filteredQuestions = transformedQuestions;

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 overflow-x-hidden"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              AI Question Feed
            </h1>
            <p className="text-gray-400">
              Review and manage AI-generated questions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full text-sm font-medium">
              {filteredQuestions.filter((q) => q.status === "pending").length}{" "}
              Pending
            </div>
            {/* Connection Status */}
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                connected
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {connected ? "🟢 Live" : "🔴 Offline"}
            </div>
            {!isScrolled && (
              <motion.button
                onClick={() => setIsControlPanelOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg border border-primary-500/30 hover:bg-primary-500/30 transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Settings className="w-4 h-4" />
                <span>AI Config</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Auto-Launch Settings */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Auto-Launch Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Enable Auto-Launch
                </label>
                <button
                  onClick={() => setAutoLaunch(!autoLaunch)}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ${
                    autoLaunch ? "bg-primary-500" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${
                      autoLaunch ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Timer Enabled
                </label>
                <button
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ${
                    timerEnabled ? "bg-primary-500" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${
                      timerEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {timerEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Default Timer: {defaultTimer}s
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={defaultTimer}
                    onChange={(e) =>
                      setDefaultTimer(Number.parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Stop Generating More Questions
                </label>
                <button className="px-4 py-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200">
                  STOP
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Quick Stats */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Total Questions</span>
                <span className="text-white font-medium">
                  {transformedQuestions.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Approved</span>
                <span className="text-green-400 font-medium">
                  {
                    transformedQuestions.filter((q) => q.status === "approved")
                      .length
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Pending</span>
                <span className="text-yellow-400 font-medium">
                  {
                    transformedQuestions.filter((q) => q.status === "pending")
                      .length
                  }
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Question Queue */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-white mb-6">Question Queue</h3>
          <div className="mb-4">
            <span className="text-primary-400 font-semibold text-lg">
              Questions Per Poll: {questionsPerPoll}
            </span>
          </div>
          <div className="space-y-4">
            <AnimatePresence>
              {filteredQuestions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 rounded-lg border border-white/10 p-6 hover:border-white/20 transition-colors duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(question.difficulty)}`}
                        >
                          {question.difficulty}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(question.status)}`}
                        >
                          {question.status}
                        </span>
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs">
                            {question.timeEstimate}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-lg font-medium text-white mb-3">
                        {question.question}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded-lg text-sm ${
                              optionIndex === question.correct
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-white/5 text-gray-300 border border-gray-600"
                            }`}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {question.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-row flex-wrap items-center gap-2 md:ml-4">
                      {question.status === "pending" && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleApprove(question.id)}
                            className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors duration-200"
                          >
                            <Check className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleReject(question.id)}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors duration-200"
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(question.id)}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors duration-200"
                      >
                        <Edit3 className="w-4 h-4" />
                      </motion.button>
                      {question.status === "approved" && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleLaunch(question.id)}
                          className="p-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors duration-200"
                        >
                          <Play className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>
        {/* Regenerate Questions Button */}
        <div className="flex flex-col sm:flex-row justify-start mt-4">
          <motion.button
            onClick={() => {
              console.log("Regenerating questions...");
              // TODO: Add logic to regenerate questions here
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 backdrop-blur-md text-sm font-semibold rounded-lg shadow-md transition-all duration-200"
          >
            🔁 Regenerate Questions
          </motion.button>
        </div>
      </motion.div>
      <AIControlPanel
        isOpen={isControlPanelOpen}
        onToggle={() => setIsControlPanelOpen(!isControlPanelOpen)}
        showFloatingButton={isScrolled}
      />
    </DashboardLayout>
  );
};

export default AIQuestionFeed;
