"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckSquare,
  ToggleLeft,
  Edit,
  BarChart3,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Send,
  Loader2,
} from "lucide-react"
import GlassCard from "../components/GlassCard"
import DashboardLayout from "../components/DashboardLayout"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import { useNotificationContext } from "../contexts/NotificationContext"

// Interface for a single poll option
interface PollOption {
  id: string
  text: string
}

// Interface for the main poll data structure - RENAMED 'title' to 'questionTitle' and 'types' to 'questionType'
interface PollData {
  questionTitle: string // Renamed from 'title'
  questionType: "mcq" | "truefalse" | "shortanswer" | "opinion" // Renamed from 'types'
  options: PollOption[]
  timerEnabled: boolean
  timerDuration: number
  timerUnit: "seconds" | "minutes"
  shortAnswerPlaceholder?: string
  correctAnswer?: string // ID or text of the correct option for MCQ/TrueFalse
}

// Interface for validation errors
interface ValidationErrors {
  questionTitle?: string // Renamed from 'title'
  options?: string
  timer?: string
  api?: string; // For general API errors
}

// Interface for Session Info (minimal, just what's needed here)
interface SessionInfo {
  _id: string;
  host: string; // Host User ID (string representation of ObjectId)
  isActive: boolean;
  sessionTitle: string;
}

const API_BASE_URL = 'http://localhost:3000/api';
const POLL_STORAGE_KEY = "activePollSession"; // Key used in CreatePollPage for the active session ID

const CreateManualPoll: React.FC = () => {
  const { user, token, isLoading: authLoading } = useAuth();
  const { showNotification } = useNotificationContext();

  const [pollData, setPollData] = useState<PollData>({
    questionTitle: "", // Renamed
    questionType: "mcq", // Renamed
    options: [
      { id: "a", text: "" },
      { id: "b", text: "" },
      { id: "c", text: "" },
      { id: "d", text: "" },
    ],
    timerEnabled: false,
    timerDuration: 30,
    timerUnit: "seconds",
    shortAnswerPlaceholder: "",
    correctAnswer: undefined,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [loadingSessionStatus, setLoadingSessionStatus] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);


  const questionTypes = [
    { id: "mcq", label: "Multiple Choice", icon: CheckSquare, description: "A, B, C, D options" },
    { id: "truefalse", label: "True/False", icon: ToggleLeft, description: "Yes or No question" },
    { id: "shortanswer", label: "Short Answer", icon: Edit, description: "Text response" },
    { id: "opinion", label: "Opinion Poll", icon: BarChart3, description: "Rating scale" },
  ];

  // Function to validate the form data
  const validateForm = (currentPollData: PollData): boolean => {
    const newErrors: ValidationErrors = {};

    if (!currentPollData.questionTitle.trim()) { // Renamed
      newErrors.questionTitle = "Poll question is required"; // Renamed
    }

    if (currentPollData.questionType === "mcq") { // Renamed
      const filledOptions = currentPollData.options.filter((opt) => opt.text.trim());
      if (filledOptions.length < 2) {
        newErrors.options = "At least 2 options are required for multiple choice";
      } else {
        const texts = filledOptions.map((opt) => opt.text.trim().toLowerCase());
        const uniqueTexts = new Set(texts);
        if (uniqueTexts.size !== texts.length) {
          newErrors.options = "All options must be unique for multiple choice";
        }
      }
      if (!currentPollData.correctAnswer || !currentPollData.options.some(opt => opt.text.trim() === currentPollData.correctAnswer?.trim())) {
        newErrors.options = (newErrors.options ? newErrors.options + ". " : "") + "Please enter the correct answer exactly as one of the options above before creating the poll";
      }
    }

    if (currentPollData.questionType === "truefalse") { // Renamed
      if (!currentPollData.correctAnswer || (currentPollData.correctAnswer.toLowerCase() !== "true" && currentPollData.correctAnswer.toLowerCase() !== "false")) {
        newErrors.options = "Correct answer for True/False must be 'True' or 'False'.";
      }
    }

    if (currentPollData.questionType === "opinion") { // Renamed
      const filledOptions = currentPollData.options.filter((opt) => opt.text.trim());
      if (filledOptions.length < 2) {
        newErrors.options = "At least 2 options are required for opinion poll";
      } else {
        const texts = filledOptions.map((opt) => opt.text.trim().toLowerCase());
        const uniqueTexts = new Set(texts);
        if (uniqueTexts.size !== texts.length) {
          newErrors.options = "All options must be unique for opinion poll";
        }
      }
    }

    if (currentPollData.timerEnabled && currentPollData.timerDuration <= 0) {
      newErrors.timer = "Timer duration must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check for active session on component mount and when auth state changes
  useEffect(() => {
    const checkActiveSession = async () => {
      setLoadingSessionStatus(true);
      setSessionError(null);
      setHasActiveSession(false);
      setActiveSessionId(null);

      if (!authLoading && user?.id && token) {
        const savedSessionId = localStorage.getItem(POLL_STORAGE_KEY);
        if (savedSessionId && savedSessionId !== "null") {
          try {
            const config = {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            };
            // Fetch session details to verify it's active and belongs to the current user
            const response = await axios.get<{ message: string, session: SessionInfo }>(
              `${API_BASE_URL}/sessions/${savedSessionId}`,
              config
            );
            const fetchedSession = response.data.session;

            if (fetchedSession.isActive && fetchedSession.host === user.id) {
              setHasActiveSession(true);
              setActiveSessionId(fetchedSession._id);
              showNotification(`Active session "${fetchedSession.sessionTitle}" loaded.`, "info");
            } else {
              setSessionError("No active session found or it has expired/been destroyed.");
              localStorage.removeItem(POLL_STORAGE_KEY); // Clear stale ID
            }
          } catch (error: any) {
            console.error("Error checking active session:", error.response?.data || error.message);
            setSessionError(error.response?.data?.message || "Failed to load active session status. Please create one.");
            localStorage.removeItem(POLL_STORAGE_KEY); // Clear on error
          }
        } else {
          setSessionError("No active poll session found. Please create one first.");
        }
      } else if (!authLoading && (!user?.id || !token)) {
        setSessionError("You must be logged in to manage poll questions.");
      }
      setLoadingSessionStatus(false);
    };

    if (!authLoading) {
      checkActiveSession();
    }
  }, [authLoading, user?.id, token, showNotification]);

  // Function to handle form submission
  const handleSubmit = async () => {
    // Validate form with current pollData
    if (!validateForm(pollData)) {
      showNotification("Please fix the errors in the form.", "error");
      return;
    }

    if (!hasActiveSession || !activeSessionId) {
      showNotification("You must have an active poll session to create questions.", "error");
      return;
    }

    setIsSubmitting(true);
    setErrors({}); // Clear validation errors
    setShowSuccess(false); // Hide previous success message

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      // Construct payload with backend-matching names
      const payload = {
        sessionId: activeSessionId,
        questionTitle: pollData.questionTitle, // Mapped from frontend state
        questionType: pollData.questionType,   // Mapped from frontend state
        options: pollData.options,
        timerEnabled: pollData.timerEnabled,
        timerDuration: pollData.timerDuration,
        timerUnit: pollData.timerUnit,
        shortAnswerPlaceholder: pollData.shortAnswerPlaceholder,
        correctAnswer: pollData.correctAnswer,
      };

      console.log("Sending payload to backend:", JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${API_BASE_URL}/manual-polls/create`, // New endpoint for manual polls
        payload,
        config
      );

      console.log("Manual Poll created and activated:", response.data);
      showNotification(response.data.message || "Poll question created successfully!", "success");
      setShowSuccess(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setPollData({
          questionTitle: "", // Renamed
          questionType: "mcq", // Renamed
          options: [
            { id: "a", text: "" },
            { id: "b", text: "" },
            { id: "c", text: "" },
            { id: "d", text: "" },
          ],
          timerEnabled: false,
          timerDuration: 30,
          timerUnit: "seconds",
          shortAnswerPlaceholder: "",
          correctAnswer: undefined,
        });
        setErrors({});
      }, 3000);
    } catch (err: any) {
      console.error("Error submitting poll:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || "Failed to submit poll.";
      showNotification(errorMessage, "error");
      setErrors((prev) => ({ ...prev, api: errorMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to update an existing option's text
  const updateOption = (id: string, text: string) => {
    setPollData((prev) => ({
      ...prev,
      options: prev.options.map((opt) => (opt.id === id ? { ...opt, text } : opt)),
    }));
  };

  // Function to add a new option for MCQ/Opinion polls
  const addOption = () => {
    setPollData((prev) => {
      let newId;
      if (prev.questionType === "mcq") { // Renamed
        // Find the next available letter ID (a, b, c, ...)
        const lastIdChar = prev.options.length > 0 ? prev.options[prev.options.length - 1].id.charCodeAt(0) : 96;
        newId = String.fromCharCode(lastIdChar + 1);
      } else if (prev.questionType === "opinion") { // Renamed
        newId = String(prev.options.length + 1); // Generates '1', '2', '3', etc. for Opinion
      } else {
        newId = String(prev.options.length + 1); // Fallback, though not expected for other types
      }
      return {
        ...prev,
        options: [...prev.options, { id: newId, text: "" }],
      };
    });
  };

  // Function to remove an option
  const removeOption = (id: string) => {
    setPollData((prev) => {
      let newOptions = prev.options.filter((opt) => opt.id !== id);
      // Re-assign IDs for MCQ/Opinion to maintain 'a, b, c' or '1, 2, 3' sequence
      if (prev.questionType === "mcq") { // Renamed
        newOptions = newOptions.map((opt, idx) => ({ ...opt, id: String.fromCharCode(97 + idx) }));
      } else if (prev.questionType === "opinion") { // Renamed
        newOptions = newOptions.map((opt, idx) => ({ ...opt, id: String((idx + 1)) }));
      }
      return {
        ...prev,
        options: newOptions,
      };
    });
  };

  // Function to handle changes in poll type
  const handleTypeChange = (newType: PollData["questionType"]) => { // Renamed
    let newOptions: PollOption[] = [];

    switch (newType) {
      case "mcq":
        newOptions = [
          { id: "a", text: "" },
          { id: "b", text: "" },
          { id: "c", text: "" },
          { id: "d", text: "" },
        ];
        break;
      case "truefalse":
        newOptions = [
          { id: "true", text: "True" },
          { id: "false", text: "False" },
        ];
        break;
      case "shortanswer":
        newOptions = []; // No predefined options for short answer
        break;
      case "opinion":
        newOptions = [
          { id: "1", text: "" },
          { id: "2", text: "" },
        ];
        break;
    }

    setPollData((prev) => ({
      ...prev,
      questionType: newType, // Renamed
      options: newOptions,
      shortAnswerPlaceholder: newType === "shortanswer" ? "" : undefined,
      correctAnswer: undefined, // Clear correct answer when type changes
    }));
  };

  // Determine if form fields should be disabled
  const areFieldsDisabled = !hasActiveSession || authLoading || loadingSessionStatus;

  if (authLoading || loadingSessionStatus) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
          <div className="flex flex-col items-center text-white">
            <Loader2 className="w-10 h-10 animate-spin text-primary-400" />
            <p className="mt-4 text-lg">Checking active session status...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Create Manual Poll</h1>
            <p className="text-gray-400">Design and launch your custom poll question</p>
          </motion.div>

          {/* Session Status Message */}
          <AnimatePresence>
            {sessionError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-center max-w-md mx-auto mb-6"
              >
                <AlertCircle className="inline-block w-5 h-5 mr-2" />
                {sessionError}
              </motion.div>
            )}
            {hasActiveSession && !sessionError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-lg text-center max-w-md mx-auto mb-6"
              >
                <CheckCircle className="inline-block w-5 h-5 mr-2" />
                You have an active session! You can create and push polls.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Alert Message */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="mb-6"
              >
                <GlassCard>
                  <div className="p-4 rounded-lg shadow-xl bg-green-500/10 backdrop-filter backdrop-blur-lg border border-green-500/30">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">Poll created successfully!</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Poll Question Input */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <GlassCard>
                  <div className="p-6 rounded-lg shadow-xl bg-gray-800/50 backdrop-filter backdrop-blur-lg border border-gray-700/50">
                    <div className="space-y-4">
                      <label className="block text-lg font-semibold text-white">Poll Question</label>
                      <div className="relative">
                        <textarea
                          value={pollData.questionTitle} // Renamed
                          onChange={(e) => {
                            setPollData((prev) => ({ ...prev, questionTitle: e.target.value })) // Renamed
                            if (errors.questionTitle) setErrors((prev) => ({ ...prev, questionTitle: undefined })) // Renamed
                          }}
                          placeholder="Type your question here..."
                          rows={3}
                          className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${errors.questionTitle ? "border-red-500/50" : "border-white/10" // Renamed
                            } ${areFieldsDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                          disabled={areFieldsDisabled}
                        />
                        {errors.questionTitle && ( // Renamed
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center space-x-2 mt-2 text-red-400 text-sm"
                          >
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.questionTitle}</span> {/* Renamed */}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Question Type Selector */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <GlassCard>
                  <div className="p-6 rounded-lg shadow-xl bg-gray-800/50 backdrop-filter backdrop-blur-lg border border-gray-700/50">
                    <div className="space-y-4">
                      <label className="block text-lg font-semibold text-white">Question Type</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {questionTypes.map((type) => {
                          const isSelected = pollData.questionType === type.id // Renamed
                          const Icon = type.icon

                          return (
                            <motion.button
                              key={type.id}
                              onClick={() => handleTypeChange(type.id as PollData["questionType"])} // Renamed
                              className={`p-4 rounded-lg border transition-all duration-200 text-left ${isSelected
                                  ? "bg-primary-500/20 text-primary-400 border-primary-500/30 shadow-lg shadow-primary-500/20"
                                  : "bg-white/5 text-gray-300 border-white/10 hover:border-white/20 hover:bg-white/10"
                                } ${areFieldsDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                              whileHover={areFieldsDisabled ? {} : { scale: 1.02 }}
                              whileTap={areFieldsDisabled ? {} : { scale: 0.98 }}
                              disabled={areFieldsDisabled}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${isSelected ? "bg-primary-500/30" : "bg-white/10"}`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-sm opacity-75">{type.description}</div>
                                </div>
                              </div>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Dynamic Options Section based on Question Type */}
              <AnimatePresence>
                {(pollData.questionType === "mcq" || // Renamed
                  pollData.questionType === "truefalse" || // Renamed
                  pollData.questionType === "shortanswer" || // Renamed
                  pollData.questionType === "opinion") && ( // Renamed
                    <motion.div
                      initial={{ opacity: 0, y: 20, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -20, height: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <GlassCard>
                        <div className="p-6 rounded-lg shadow-xl bg-gray-800/50 backdrop-filter backdrop-blur-lg border border-gray-700/50">
                          <div className="space-y-4">
                            {/* MCQ Options */}
                            {pollData.questionType === "mcq" && ( // Renamed
                              <>
                                <div className="flex items-center justify-between">
                                  <label className="block text-lg font-semibold text-white">Answer Options</label>
                                  {pollData.options.length < 6 && (
                                    <motion.button
                                      onClick={addOption}
                                      className={`flex items-center space-x-2 px-3 py-1 rounded-lg border transition-colors duration-200 ${areFieldsDisabled ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-primary-500/20 text-primary-400 border-primary-500/30 hover:bg-primary-500/30"}`}
                                      whileHover={areFieldsDisabled ? {} : { scale: 1.05 }}
                                      whileTap={areFieldsDisabled ? {} : { scale: 0.95 }}
                                      disabled={areFieldsDisabled}
                                    >
                                      <Plus className="w-4 h-4" />
                                      <span className="text-sm">Add Option</span>
                                    </motion.button>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  {pollData.options.map((option, index) => (
                                    <motion.div
                                      key={option.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.1 * index }}
                                      className="flex items-center space-x-3"
                                    >
                                      <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                        {String.fromCharCode(65 + index)}
                                      </div>
                                      <input
                                        type="text"
                                        value={option.text}
                                        onChange={e => {
                                          updateOption(option.id, e.target.value)
                                          if (errors.options && pollData.questionType === "mcq") { // Renamed
                                            const filledOptions = pollData.options.map(opt => opt.id === option.id ? e.target.value : opt.text).filter(text => text.trim())
                                            const texts = filledOptions.map(text => text.trim().toLowerCase())
                                            const uniqueTexts = new Set(texts)
                                            if (filledOptions.length < 2) {
                                              setErrors(prev => ({ ...prev, options: "At least 2 options are required for multiple choice" }))
                                            } else if (uniqueTexts.size !== texts.length) {
                                              setErrors(prev => ({ ...prev, options: "All options must be unique for multiple choice" }))
                                            } else {
                                              setErrors(prev => ({ ...prev, options: undefined }))
                                            }
                                          }
                                        }}
                                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                        className={`flex-1 px-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${errors.options ? "border-red-500/50" : "border-white/10"
                                          } ${areFieldsDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                                        disabled={areFieldsDisabled}
                                      />
                                      {pollData.options.length > 2 && (
                                        <motion.button
                                          onClick={() => removeOption(option.id)}
                                          className={`p-2 text-red-400 rounded-lg transition-colors duration-200 ${areFieldsDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-red-500/20"}`}
                                          whileHover={areFieldsDisabled ? {} : { scale: 1.1 }}
                                          whileTap={areFieldsDisabled ? {} : { scale: 0.9 }}
                                          disabled={areFieldsDisabled}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </motion.button>
                                      )}
                                    </motion.div>
                                  ))}
                                </div>
                                {/* Correct Answer Input for MCQ */}
                                <div className="mt-4">
                                  <label className="block text-sm font-medium text-white mb-1">What is the correct answer?</label>
                                  <input
                                    type="text"
                                    value={pollData.correctAnswer || ""}
                                    onChange={e => {
                                      setPollData(prev => ({ ...prev, correctAnswer: e.target.value }))
                                      if (errors.options && pollData.options.some(opt => opt.text.trim() === e.target.value.trim())) {
                                        setErrors(prev => ({ ...prev, options: undefined }))
                                      }
                                    }}
                                    placeholder="Type the correct answer exactly as one of the options"
                                    className={`w-full px-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${errors.options ? "border-red-500/50" : "border-white/10"
                                      } ${areFieldsDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                                    disabled={areFieldsDisabled}
                                  />
                                  <div className="text-xs text-gray-400 mt-1">Enter the correct answer exactly as it appears in the options above.</div>
                                </div>
                              </>
                            )}

                            {/* True/False Options */}
                            {pollData.questionType === "truefalse" && ( // Renamed
                              <>
                                <label className="block text-lg font-semibold text-white">Answer Options</label>
                                <div className="space-y-3">
                                  {pollData.options.map((option) => (
                                    <div key={option.id} className="flex items-center space-x-3 p-4 bg-white/5 border border-white/10 rounded-lg">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${option.id === "true" ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-red-500 to-rose-500"}`}>{option.id === "true" ? "T" : "F"}</div>
                                      <span className="text-white font-medium">{option.text}</span>
                                    </div>
                                  ))}
                                </div>
                                {/* Correct Answer Input for True/False */}
                                <div className="mt-4">
                                  <label className="block text-sm font-medium text-white mb-1">What is the correct answer?</label>
                                  <input
                                    type="text"
                                    value={pollData.correctAnswer || ""}
                                    onChange={e => {
                                      setPollData(prev => ({ ...prev, correctAnswer: e.target.value }))
                                      if (errors.options && (e.target.value.toLowerCase() === "true" || e.target.value.toLowerCase() === "false")) {
                                        setErrors(prev => ({ ...prev, options: undefined }))
                                      }
                                    }}
                                    placeholder="Type the correct answer exactly as one of the options (True or False)"
                                    className={`w-full px-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${errors.options ? "border-red-500/50" : "border-white/10"
                                      } ${areFieldsDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                                    disabled={areFieldsDisabled}
                                  />
                                  <div className="text-xs text-gray-400 mt-1">Enter the correct answer exactly as it appears in the options above.</div>
                                </div>
                              </>
                            )}

                            {/* Short Answer Configuration */}
                            {pollData.questionType === "shortanswer" && ( // Renamed
                              <>
                                <label className="block text-lg font-semibold text-white">Answer Configuration</label>
                                <div className="space-y-3">
                                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                                    <div className="flex items-center space-x-3 mb-3">
                                      <Edit className="w-5 h-5 text-primary-400" />
                                      <span className="text-white font-medium">Text Response Field</span>
                                    </div>
                                    <input
                                      type="text"
                                      value={pollData.shortAnswerPlaceholder || ""}
                                      onChange={(e) =>
                                        setPollData((prev) => ({ ...prev, shortAnswerPlaceholder: e.target.value }))
                                      }
                                      placeholder="Enter placeholder text for answer field..."
                                      className={`w-full px-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${areFieldsDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                                      disabled={areFieldsDisabled}
                                    />
                                    <p className="text-gray-400 text-sm mt-2">
                                      Students will see a text input with this placeholder
                                    </p>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Opinion Poll Options */}
                            {pollData.questionType === "opinion" && ( // Renamed
                              <>
                                <div className="flex items-center justify-between">
                                  <label className="block text-lg font-semibold text-white">Opinion Options</label>
                                  {pollData.options.length < 4 && ( // Max 4 options for opinion
                                    <motion.button
                                      onClick={addOption}
                                      className={`flex items-center space-x-2 px-3 py-1 rounded-lg border transition-colors duration-200 ${areFieldsDisabled ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-primary-500/20 text-primary-400 border-primary-500/30 hover:bg-primary-500/30"}`}
                                      whileHover={areFieldsDisabled ? {} : { scale: 1.05 }}
                                      whileTap={areFieldsDisabled ? {} : { scale: 0.95 }}
                                      disabled={areFieldsDisabled}
                                    >
                                      <Plus className="w-4 h-4" />
                                      <span className="text-sm">Add Option</span>
                                    </motion.button>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  {pollData.options.map((option, index) => (
                                    <motion.div
                                      key={option.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.1 * index }}
                                      className="flex items-center space-x-3"
                                    >
                                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                        {index + 1}
                                      </div>
                                      <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => updateOption(option.id, e.target.value)}
                                        placeholder={`Opinion ${index + 1}`}
                                        className={`flex-1 px-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${areFieldsDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                                        disabled={areFieldsDisabled}
                                      />
                                      {pollData.options.length > 2 && (
                                        <motion.button
                                          onClick={() => removeOption(option.id)}
                                          className={`p-2 text-red-400 rounded-lg transition-colors duration-200 ${areFieldsDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-red-500/20"}`}
                                          whileHover={areFieldsDisabled ? {} : { scale: 1.1 }}
                                          whileTap={areFieldsDisabled ? {} : { scale: 0.9 }}
                                          disabled={areFieldsDisabled}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </motion.button>
                                      )}
                                    </motion.div>
                                  ))}
                                </div>
                              </>
                            )}

                            {errors.options && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center space-x-2 text-red-400 text-sm"
                              >
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.options}</span>
                              </motion.div>
                            )}
                          </div>
                        </div>
                        </GlassCard>
                      </motion.div>
                    )}
              </AnimatePresence>

              {/* Timer Settings Section */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <GlassCard>
                  <div className="p-6 rounded-lg shadow-xl bg-gray-800/50 backdrop-filter backdrop-blur-lg border border-gray-700/50">
                    <div className="space-y-4">
                      <label className="block text-lg font-semibold text-white">Timer Settings</label>

                      {/* Timer Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-300">Enable Timer</span>
                        </div>
                        <motion.button
                          onClick={() => setPollData((prev) => ({ ...prev, timerEnabled: !prev.timerEnabled }))}
                          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${pollData.timerEnabled ? "bg-primary-500" : "bg-gray-600"
                            } ${areFieldsDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                          whileTap={areFieldsDisabled ? {} : { scale: 0.95 }}
                          disabled={areFieldsDisabled}
                        >
                          <motion.div
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                            animate={{ x: pollData.timerEnabled ? 24 : 2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>

                      {/* Timer Duration Input (conditionally rendered) */}
                      <AnimatePresence>
                        {pollData.timerEnabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center space-x-3"
                          >
                            <input
                              type="text"
                              value={String(pollData.timerDuration)}
                              onChange={(e) => {
                                let raw = e.target.value.replace(/\D/g, "");
                                raw = raw.replace(/^0+(?!$)/, "");
                                setPollData((prev) => ({ ...prev, timerDuration: raw === "" ? 0 : Number(raw) }));
                              }}
                              min="1"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className={`w-20 px-3 py-2 bg-white/5 border rounded-lg text-white text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${errors.timer ? "border-red-500/50" : "border-white/10"
                                } ${areFieldsDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                              disabled={areFieldsDisabled}
                            />
                            <select
                              value={pollData.timerUnit}
                              onChange={(e) =>
                                setPollData((prev) => ({ ...prev, timerUnit: e.target.value as "seconds" | "minutes" }))
                              }
                              className={`px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${areFieldsDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                              disabled={areFieldsDisabled}
                            >
                              <option value="seconds" className="bg-gray-800">Seconds</option>
                              <option value="minutes" className="bg-gray-800">Minutes</option>
                            </select>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {errors.timer && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center space-x-2 text-red-400 text-sm"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.timer}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </div>

            {/* Preview Panel Section */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="sticky top-6"
              >
                <GlassCard>
                  <div className="p-6 rounded-lg shadow-xl bg-gray-800/50 backdrop-filter backdrop-blur-lg border border-gray-700/50">
                    <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>

                    <div className="space-y-4">
                      {/* Preview Question */}
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-white font-medium">{pollData.questionTitle || "Your question will appear here..."}</p> {/* Renamed */}
                      </div>

                      {/* Preview Options based on type */}
                      {pollData.questionType === "mcq" && ( // Renamed
                        <div className="space-y-2">
                          {pollData.options.map((option, index) => (
                            <div key={option.id} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                              <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded text-white text-xs flex items-center justify-center font-bold">
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span className="text-gray-300 text-sm">
                                {option.text || `Option ${String.fromCharCode(65 + index)}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {pollData.questionType === "truefalse" && ( // Renamed
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                            <div className="w-6 h-6 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">
                              T
                            </div>
                            <span className="text-gray-300 text-sm">True</span>
                          </div>
                          <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                            <div className="w-6 h-6 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">
                              F
                            </div>
                            <span className="text-gray-300 text-sm">False</span>
                          </div>
                        </div>
                      )}

                      {pollData.questionType === "shortanswer" && ( // Renamed
                        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                          <input
                            type="text"
                            placeholder={pollData.shortAnswerPlaceholder || "Type your answer here..."}
                            disabled
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-gray-400 text-sm"
                          />
                        </div>
                      )}

                      {pollData.questionType === "opinion" && ( // Renamed
                        <div className="space-y-2">
                          {pollData.options.map((option, index) => (
                            <div key={option.id} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded text-white text-xs flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <span className="text-gray-300 text-sm">{option.text || `Opinion ${index + 1}`}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Preview Timer */}
                      {pollData.timerEnabled && (
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>
                            {pollData.timerDuration} {pollData.timerUnit}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      onClick={handleSubmit}
                      disabled={isSubmitting || areFieldsDisabled}
                      className={`w-full mt-6 px-6 py-3 font-semibold rounded-lg shadow-lg transition-all duration-200 ${isSubmitting || areFieldsDisabled
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
                          : "bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-primary-500/40"
                        }`}
                      whileHover={isSubmitting || areFieldsDisabled ? {} : { scale: 1.02, y: -2 }}
                      whileTap={isSubmitting || areFieldsDisabled ? {} : { scale: 0.98 }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {isSubmitting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                        <span>{isSubmitting ? "Creating..." : "Create Poll"}</span>
                      </div>
                    </motion.button>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CreateManualPoll;
