// // apps/frontend/src/pages/CreateManualPoll.tsx

// "use client"

// import React, { useState, useEffect, useCallback } from "react" // --- NEW: Added useEffect and useCallback
// import { motion, AnimatePresence } from "framer-motion"
// import { CheckSquare, ToggleLeft, Edit, BarChart3, Clock, Plus, Trash2, AlertCircle, CheckCircle, Send } from "lucide-react"
// import toast from 'react-hot-toast';
// import { apiService } from "../utils/api";
// import GlassCard from "../components/GlassCard"
// import DashboardLayout from "../components/DashboardLayout"
// import { useAuth } from '../contexts/AuthContext'; // Import the useAuth hook

// // --- NEW ---
// // Import the HostPollLauncher component we created.
// // Make sure this file exists at `apps/frontend/src/components/host/HostPollLauncher.tsx`
// import HostPollLauncher from "../components/host/HostPollLauncher";

// // --- NEW ---
// // A type for the active room object, based on your models
// interface ActiveRoom {
//   _id: string;
//   name: string;
//   code: string;
// }

// interface PollOption {
//   id: string
//   text: string
// }

// interface PollData {
//   title: string
//   type: "mcq" | "truefalse" | "shortanswer" | "opinion"
//   options: PollOption[]
//   timerEnabled: boolean
//   timerDuration: number
//   timerUnit: "seconds" | "minutes"
//   shortAnswerPlaceholder?: string
//   correctAnswer?: string
// }

// interface ValidationErrors {
//   title?: string
//   options?: string
//   timer?: string
// }

// const CreateManualPoll = () => {
//   const [pollData, setPollData] = useState<PollData>({
//     title: "",
//     type: "mcq",
//     options: [
//       { id: "a", text: "" },
//       { id: "b", text: "" },
//       { id: "c", text: "" },
//       { id: "d", text: "" },
//     ],
//     timerEnabled: false,
//     timerDuration: 30,
//     timerUnit: "seconds",
//     correctAnswer: undefined,
//   });

//   const [errors, setErrors] = useState<ValidationErrors>({})
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [showSuccess, setShowSuccess] = useState(false)

//   // --- NEW STATE TO HOLD THE ACTIVE ROOM ---
//   const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  
//   // --- NEW STATE TO FORCE THE POLL LAUNCHER TO REFRESH ---
//   // We will change this value every time a new poll is created
//   const [refreshPollsKey, setRefreshPollsKey] = useState(0);

//   // --- NEW EFFECT TO FETCH THE ACTIVE ROOM ON PAGE LOAD ---
//   useEffect(() => {
//     const fetchActiveRoom = async () => {
//       try {
//         const response = await apiService.getActiveRoom();
//         setActiveRoom(response.data);
//       } catch (error) {
//         console.log("No active room found for host.");
//       }
//     };
//     fetchActiveRoom();
//   }, []);


//   const questionTypes = [
//     { id: "mcq", label: "Multiple Choice", icon: CheckSquare, description: "A, B, C, D options" },
//     { id: "truefalse", label: "True/False", icon: ToggleLeft, description: "Yes or No question" },
//     { id: "shortanswer", label: "Short Answer", icon: Edit, description: "Text response" },
//     { id: "opinion", label: "Opinion Poll", icon: BarChart3, description: "Rating scale" },
//   ]

//   const validateForm = (): boolean => {
//     const newErrors: ValidationErrors = {}
//     if (!pollData.title.trim()) {
//       newErrors.title = "Poll question is required"
//     }
//     if (pollData.type === "mcq") {
//       const filledOptions = pollData.options.filter((opt) => opt.text.trim())
//       if (filledOptions.length < 2) {
//         newErrors.options = "At least 2 options are required"
//       }
//     }
//     if ((pollData.type === "mcq" || pollData.type === "truefalse")) {
//         if (!pollData.correctAnswer?.trim()) {
//             newErrors.options = "A correct answer is required for this poll type."
//         }
//     }
//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSubmit = async () => {
//     if (!validateForm()) return;

//     setIsSubmitting(true);
//     const submissionToast = toast.loading("Saving your poll...");

//     const timerInSeconds = pollData.timerUnit === 'minutes' 
//         ? pollData.timerDuration * 60 
//         : pollData.timerDuration;
    
//     const payload = {
//       title: pollData.title,
//       type: pollData.type,
//       options: pollData.options.map(opt => opt.text).filter(Boolean),
//       correctAnswer: pollData.correctAnswer,
//       timerDuration: pollData.timerEnabled ? timerInSeconds : 0,
//     };

//     if (payload.type === 'shortanswer' || payload.type === 'opinion') {
//         payload.correctAnswer = 'N/A';
//     }

//     try {
//       await apiService.createPoll(payload);
//       toast.success("Poll created and saved successfully!", { id: submissionToast });

//       // --- NEW ---
//       // This will trigger the HostPollLauncher to re-fetch the list of polls
//       setRefreshPollsKey(prevKey => prevKey + 1);

//       setShowSuccess(true);
//       setTimeout(() => {
//         setShowSuccess(false);
//         setPollData({
//           title: "",
//           type: "mcq",
//           options: [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }],
//           timerEnabled: false,
//           timerDuration: 30,
//           timerUnit: "seconds",
//           correctAnswer: undefined,
//         });
//         setErrors({});
//       }, 2000);

//     } catch (err: any) {
//       toast.error(err.response?.data?.message || "Failed to save poll.", { id: submissionToast });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };


"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckSquare, ToggleLeft, Edit, BarChart3, Clock, Plus, Trash2, AlertCircle, CheckCircle, Send } from "lucide-react"
import toast from 'react-hot-toast'
import { apiService } from "../utils/api"
import GlassCard from "../components/GlassCard"
import DashboardLayout from "../components/DashboardLayout"
import HostPollLauncher from "../components/host/HostPollLauncher"
import { useAuth } from '../contexts/AuthContext' 


interface PollOption {
  id: string
  text: string
}
interface PollData {
  title: string
  type: "mcq" | "truefalse" | "shortanswer" | "opinion"
  options: PollOption[]
  timerEnabled: boolean
  timerDuration: number
  timerUnit: "seconds" | "minutes"
  shortAnswerPlaceholder?: string
  correctAnswer?: string
}
interface ValidationErrors {
  title?: string
  options?: string
  timer?: string
}

const CreateManualPoll = () => {
  // Local state for the form itself is correct and should remain
  const [pollData, setPollData] = useState<PollData>({
    title: "",
    type: "mcq",
    options: [ { id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" } ],
    timerEnabled: false,
    timerDuration: 30,
    timerUnit: "seconds",
    correctAnswer: undefined,
  });
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // --- REPLACED local activeRoom state with the global one from the context ---
  const { activeRoom } = useAuth();
  
  // This state is still needed locally to trigger a refresh of the launcher component
  const [refreshPollsKey, setRefreshPollsKey] = useState(0);

  // --- REMOVED the useEffect that fetched the active room. It's no longer needed! ---
  // The AuthContext handles this for the entire application now.

  const questionTypes = [
    { id: "mcq", label: "Multiple Choice", icon: CheckSquare, description: "A, B, C, D options" },
    { id: "truefalse", label: "True/False", icon: ToggleLeft, description: "Yes or No question" },
    { id: "shortanswer", label: "Short Answer", icon: Edit, description: "Text response" },
    { id: "opinion", label: "Opinion Poll", icon: BarChart3, description: "Rating scale" },
  ];

  // Your validateForm and handleSubmit functions are correct and do not need changes.
  const validateForm = (): boolean => {
    // ... your existing validation logic ...
    const newErrors: ValidationErrors = {};
    if (!pollData.title.trim()) { newErrors.title = "Poll question is required" }
    if (pollData.type === "mcq") {
      const filledOptions = pollData.options.filter((opt) => opt.text.trim())
      if (filledOptions.length < 2) { newErrors.options = "At least 2 options are required" }
    }
    if ((pollData.type === "mcq" || pollData.type === "truefalse")) {
        if (!pollData.correctAnswer?.trim()) { newErrors.options = "A correct answer is required" }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async () => {
    // Make sure there's an active room before trying to save
    if (!activeRoom) {
        toast.error("You must have an active session to create a poll.");
        return;
    }
    if (!validateForm()) return;

    setIsSubmitting(true);
    const submissionToast = toast.loading("Saving your poll...");

    const timerInSeconds = pollData.timerUnit === 'minutes' ? pollData.timerDuration * 60 : pollData.timerDuration;
    
    const payload = {
      title: pollData.title,
      type: pollData.type,
      options: pollData.options.map(opt => opt.text).filter(Boolean),
      correctAnswer: pollData.correctAnswer,
      timerDuration: pollData.timerEnabled ? timerInSeconds : 0,
       sessionId: activeRoom._id, // <-- THE CRUCIAL ADDITION
    };

    if (payload.type === 'shortanswer' || payload.type === 'opinion') {
        payload.correctAnswer = 'N/A';
    }

    try {
      await apiService.createPoll(payload);
      toast.success("Poll created and saved successfully!", { id: submissionToast });
      setRefreshPollsKey(prevKey => prevKey + 1); // Trigger refresh
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // Reset form...
        setPollData({
            title: "", type: "mcq", options: [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }],
            timerEnabled: false, timerDuration: 30, timerUnit: "seconds", correctAnswer: undefined
        });
        setErrors({});
      }, 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save poll.", { id: submissionToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (Your other helper functions like updateOption, addOption, removeOption, handleTypeChange are all correct and do not need changes)
  // ... Paste them here ...
  const updateOption = (id: string, text: string) => {
    setPollData((prev) => ({
      ...prev,
      options: prev.options.map((opt) => (opt.id === id ? { ...opt, text } : opt)),
    }))
  }

  const addOption = () => {
    const newId = String.fromCharCode(97 + pollData.options.length)
    setPollData((prev) => ({
      ...prev,
      options: [...prev.options, { id: newId, text: "" }],
    }))
  }

  const removeOption = (id: string) => {
    setPollData((prev) => ({
      ...prev,
      options: prev.options.filter((opt) => opt.id !== id),
    }))
  }

  const handleTypeChange = (newType: PollData["type"]) => {
    let newOptions: PollOption[] = []

    switch (newType) {
      case "mcq":
        newOptions = [
          { id: "a", text: "" },
          { id: "b", text: "" },
          { id: "c", text: "" },
          { id: "d", text: "" },
        ]
        break
      case "truefalse":
        newOptions = [
          { id: "true", text: "True" },
          { id: "false", text: "False" },
        ]
        break
      case "shortanswer":
        newOptions = []
        break
      case "opinion":
        newOptions = [
          { id: "1", text: "" },
          { id: "2", text: "" },
        ]
        break
    }

    setPollData((prev) => ({
      ...prev,
      type: newType,
      options: newOptions,
      shortAnswerPlaceholder: newType === "shortanswer" ? "" : undefined,
      correctAnswer: undefined,
    }))
  }
  return (
  <DashboardLayout>
      <div className="min-h-screen p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Create & Launch Manual Poll</h1>
            <p className="text-gray-400">Step 1: Create a poll. Step 2: Launch it to your active session.</p>
          </motion.div>

          <AnimatePresence>
            {showSuccess && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    className="mb-6"




                >
                    <GlassCard className="p-4 border-green-500/30 bg-green-500/10">
                        <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 font-medium">Poll saved! It's now available in the 'Launch Poll' list.</span>
                        </div>
                    </GlassCard>
                </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            {/* Left Column: Poll Creation Form */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white">Step 1: Create a Poll</h2>


              {/* Your existing poll creation form components go here */}
              {/* Poll Question */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <GlassCard className="p-6">
                      {/* ... (Your Poll Question JSX) ... */}
                      <div className="space-y-4">
                        <label className="block text-lg font-semibold text-white">Poll Question</label>
                        <div className="relative">
                          <textarea
                            value={pollData.title}
                            onChange={(e) => {
                              setPollData((prev) => ({ ...prev, title: e.target.value }))
                              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
                            }}
                            placeholder="Type your question here..."
                            rows={3}
                            className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${errors.title ? "border-red-500/50" : "border-white/10"
                              }`}
                          />
                          {errors.title && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center space-x-2 mt-2 text-red-400 text-sm"
                            >
                              <AlertCircle className="w-4 h-4" />
                              <span>{errors.title}</span>
                            </motion.div>
                          )}
                        </div>
                      </div>
                  </GlassCard>
              </motion.div>

              {/* Question Type Selector */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <GlassCard className="p-6">
                      {/* ... (Your Question Type Selector JSX) ... */}
                      <div className="space-y-4">
                        <label className="block text-lg font-semibold text-white">Question Type</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {questionTypes.map((type) => {
                            const isSelected = pollData.type === type.id
                            const Icon = type.icon

                            return (
                              <motion.button
                                key={type.id}
                                onClick={() => handleTypeChange(type.id as PollData["type"])}
                                className={`p-4 rounded-lg border transition-all duration-200 text-left ${isSelected
                                    ? "bg-primary-500/20 text-primary-400 border-primary-500/30 shadow-lg shadow-primary-500/20"
                                    : "bg-white/5 text-gray-300 border-white/10 hover:border-white/20 hover:bg-white/10"
                                  }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
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
                  </GlassCard>
              </motion.div>
              
              {/* ... (Your Dynamic Options and Timer Settings JSX) ... */}
               {/* Dynamic Options Based on Question Type */}
               <AnimatePresence>
                {(pollData.type === "mcq" ||
                  pollData.type === "truefalse" ||
                  pollData.type === "shortanswer" ||
                  pollData.type === "opinion") && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -20, height: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <GlassCard className="p-6">
                        {/* ... (The entire dynamic options content from your original file) ... */}
                         <div className="space-y-4">
                          {/* MCQ Options */}
                          {pollData.type === "mcq" && (
                            <>
                              <div className="flex items-center justify-between">
                                <label className="block text-lg font-semibold text-white">Answer Options</label>
                                {pollData.options.length < 6 && (
                                  <motion.button
                                    onClick={addOption}
                                    className="flex items-center space-x-2 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-lg border border-primary-500/30 hover:bg-primary-500/30 transition-colors duration-200"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
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
                                      {option.id.toUpperCase()}
                                    </div>
                                    <input
                                      type="text"
                                      value={option.text}
                                      onChange={e => {
                                        updateOption(option.id, e.target.value)
                                        if (errors.options && pollData.type === "mcq") {
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
                                      placeholder={`Option ${option.id.toUpperCase()}`}
                                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                                    />
                                    {pollData.options.length > 2 && (
                                      <motion.button
                                        onClick={() => removeOption(option.id)}
                                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </motion.button>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
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
                                  className={`w-full px-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${errors.options ? "border-red-500/50" : "border-white/10"}`}
                                />
                                <div className="text-xs text-gray-400 mt-1">Enter the correct answer exactly as it appears in the options above.</div>
                              </div>
                            </>
                          )}

                          {/* True/False Options */}
                          {pollData.type === "truefalse" && (
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
                                  placeholder="Type the correct answer exactly as one of the options (True or False)"
                                  className={`w-full px-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${errors.options ? "border-red-500/50" : "border-white/10"}`}
                                />
                                <div className="text-xs text-gray-400 mt-1">Enter the correct answer exactly as it appears in the options above.</div>
                              </div>
                            </>
                          )}

                          {/* Short Answer */}
                          {pollData.type === "shortanswer" && (
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
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                                  />
                                  <p className="text-gray-400 text-sm mt-2">
                                    Students will see a text input with this placeholder
                                  </p>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Opinion Poll */}
                          {pollData.type === "opinion" && (
                            <>
                              <div className="flex items-center justify-between">
                                <label className="block text-lg font-semibold text-white">Opinion Options</label>
                                {pollData.options.length < 4 && (
                                  <motion.button
                                    onClick={addOption}
                                    className="flex items-center space-x-2 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-lg border border-primary-500/30 hover:bg-primary-500/30 transition-colors duration-200"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span className="text-sm">Add Opinion</span>
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
                                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                                    />
                                    {pollData.options.length > 2 && (
                                      <motion.button
                                        onClick={() => removeOption(option.id)}
                                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
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
                      </GlassCard>
                    </motion.div>
                  )}
              </AnimatePresence>

               {/* Timer Settings */}
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <GlassCard className="p-6">
                 {/* ... (The entire timer settings content from your original file) ... */}
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
                          }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                          animate={{ x: pollData.timerEnabled ? 24 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </motion.button>
                    </div>

                    {/* Timer Duration */}
                    <AnimatePresence>
                      {pollData.timerEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center space-x-3"
                        >
                          <input
                            type="number"
                            value={pollData.timerDuration}
                            onChange={(e) =>
                              setPollData((prev) => ({ ...prev, timerDuration: Number.parseInt(e.target.value) || 0 }))
                            }
                            min="1"
                            className={`w-20 px-3 py-2 bg-white/5 border rounded-lg text-white text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${errors.timer ? "border-red-500/50" : "border-white/10"
                              }`}
                          />
                          <select
                            value={pollData.timerUnit}
                            onChange={(e) =>
                              setPollData((prev) => ({ ...prev, timerUnit: e.target.value as "seconds" | "minutes" }))
                            }
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
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
                </GlassCard>
              </motion.div>
              {/* Submit Button */}
              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full mt-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg shadow-lg"
              >
                  {isSubmitting ? "Saving..." : "Save Poll to My Library"}
              </motion.button>
            </div>











     {/* Right Column: Launch Poll Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white">Step 2: Launch a Poll</h2>
              <GlassCard>
                <div className="p-6">
                  {/* --- THIS UI NOW READS FROM THE GLOBAL `activeRoom` --- */}
                  {!activeRoom ? (
                    <div className="text-center bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
                      <p className="font-semibold text-yellow-300">No Active Session</p>
                      <p className='text-sm text-yellow-400 mt-1'>
                        Please go to the "Create Poll Session" page to start a new session before you can launch a poll.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                        <p className="text-sm text-gray-300">Active Session:</p>
                        <p className="font-bold text-white">{activeRoom.name} (Code: {activeRoom.code})</p>
                      </div>
                      <HostPollLauncher key={refreshPollsKey} activeRoomId={activeRoom._id} />
                    </>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CreateManualPoll;