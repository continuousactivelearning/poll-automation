"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hash,
  Upload,
  Users,
  Mail,
  FileText,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import GlassCard from "../components/GlassCard";
import DashboardLayout from "../components/DashboardLayout";
import * as XLSX from "xlsx";
import axios from "axios";

interface StudentInvite {
  name: string;
  email: string;
}

const POLL_STORAGE_KEY = "activePollSession";

const CreatePollPage: React.FC = () => {
  const [roomCode, setRoomCode] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [students, setStudents] = useState<StudentInvite[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [isDestroying, setIsDestroying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<{ csv?: string }>({});
  const [isPollActive, setIsPollActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3 * 60 * 60); // 3 hours in seconds
  const [invitesSent, setInvitesSent] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomNameError, setRoomNameError] = useState("");

  // Load poll session from localStorage if active
  useEffect(() => {
    const saved = localStorage.getItem(POLL_STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.isPollActive) {
          setRoomCode(data.roomCode || "");
          setRoomName(data.roomName || "");
          setTimeRemaining(
            typeof data.timeRemaining === "number"
              ? data.timeRemaining
              : 3 * 60 * 60
          );
          setIsPollActive(true);
        } else {
          setRoomCode(generateRoomCode());
        }
      } catch {
        setRoomCode(generateRoomCode());
      }
    } else {
      // Check if we have room data in localStorage from previous sessions
      const storedRoomCode = localStorage.getItem("roomCode");
      if (storedRoomCode) {
        setRoomCode(storedRoomCode);
      } else {
        setRoomCode(generateRoomCode());
      }
    }
  }, []);

  // Persist poll session to localStorage only if poll is active
  useEffect(() => {
    if (isPollActive) {
      localStorage.setItem(
        POLL_STORAGE_KEY,
        JSON.stringify({
          roomCode,
          roomName,
          timeRemaining,
          isPollActive: true,
        })
      );
    } else {
      localStorage.removeItem(POLL_STORAGE_KEY);
    }
  }, [isPollActive, roomCode, roomName, timeRemaining]);

  // Generate random room code
  const generateRoomCode = (): string => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  // Handle room code regeneration
  const handleRegenerateCode = () => {
    if (!isPollActive) {
      setRoomCode(generateRoomCode());
    }
  };

  // Handle destroy room
  const handleDestroyRoom = async () => {
    setIsDestroying(true);

    try {
      // Get room code from localStorage
      const storedRoomCode = localStorage.getItem("roomCode");

      if (storedRoomCode) {
        console.log("Deleting poll with room code:", storedRoomCode);

        const response = await axios.delete(
          `http://localhost:3000/api/room-code/polls/${storedRoomCode}`
        );

        console.log("Poll deleted successfully:", response.data);

        // Remove room data from localStorage
        localStorage.removeItem("roomId");
        localStorage.removeItem("roomCode");
      } else {
        console.warn("No room code found in localStorage");
      }

      // Reset UI state
      setTimeout(() => {
        setIsPollActive(false);
        setTimeRemaining(3 * 60 * 60); // Reset to 3 hours
        setRoomCode(generateRoomCode()); // Generate new code
        setIsDestroying(false);
        localStorage.removeItem(POLL_STORAGE_KEY); // Clear persisted session
        console.log("Room destroyed and reset");
      }, 1500);
    } catch (error) {
      console.error("Error deleting poll:", error);

      // Still reset UI even if deletion fails
      setTimeout(() => {
        setIsPollActive(false);
        setTimeRemaining(3 * 60 * 60); // Reset to 3 hours
        setRoomCode(generateRoomCode()); // Generate new code
        setIsDestroying(false);
        localStorage.removeItem(POLL_STORAGE_KEY); // Clear persisted session
        localStorage.removeItem("roomId");
        localStorage.removeItem("roomCode");
        console.log("Room destroyed and reset (with error)");
      }, 1500);
    }
  };

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPollActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsPollActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPollActive, timeRemaining]);

  // Extend time
  const handleExtendTime = (hours: number) => {
    setTimeRemaining((prev) => prev + hours * 60 * 60);
  };

  // Parse CSV content
  const parseCSV = (content: string): StudentInvite[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    const headers = lines[0]
      .toLowerCase()
      .split(",")
      .map((h) => h.trim());

    const emailIndex = headers.findIndex((h) => h.includes("email"));
    const nameIndex = headers.findIndex((h) => h.includes("name"));

    if (emailIndex === -1) {
      throw new Error("CSV must contain an 'email' column");
    }

    return lines
      .slice(1)
      .map((line) => {
        const values = line.split(",").map((v) => v.trim());
        return {
          name: nameIndex !== -1 ? values[nameIndex] || "Unknown" : "Unknown",
          email: values[emailIndex] || "",
        };
      })
      .filter((student) => student.email);
  };

  // Handle file upload (CSV or Excel)
  const handleFileUpload = useCallback(async (file: File) => {
    const isCSV = file.name.endsWith(".csv");
    const isXLS = file.name.endsWith(".xls") || file.name.endsWith(".xlsx");

    if (!isCSV && !isXLS) {
      setErrors((prev) => ({
        ...prev,
        csv: "Please upload a .csv or .xls/.xlsx file",
      }));
      return;
    }

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, csv: undefined }));

    try {
      let parsedStudents: StudentInvite[] = [];

      if (isCSV) {
        const content = await file.text();
        parsedStudents = parseCSV(content);
      } else if (isXLS) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
        }) as string[][];

        const headers = rows[0].map((h) => h.toLowerCase().trim());
        const emailIndex = headers.findIndex((h) => h.includes("email"));
        const nameIndex = headers.findIndex((h) => h.includes("name"));

        if (emailIndex === -1) {
          throw new Error("File must contain an 'email' column");
        }

        parsedStudents = rows
          .slice(1)
          .filter((row) => row[emailIndex])
          .map((row) => ({
            name:
              nameIndex !== -1
                ? row[nameIndex]?.toString().trim() || "Unknown"
                : "Unknown",
            email: row[emailIndex]?.toString().trim() || "",
          }));
      }

      if (parsedStudents.length === 0) {
        throw new Error("No valid student records found");
      }

      setStudents(parsedStudents);
      setCsvFile(file);
      setShowPreview(true);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        csv:
          error instanceof Error ? error.message : "Failed to parse the file",
      }));
      setStudents([]);
      setCsvFile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Remove uploaded file
  const removeFile = () => {
    setCsvFile(null);
    setStudents([]);
    setShowPreview(false);
    setInvitesSent(false);
    setErrors((prev) => ({ ...prev, csv: undefined }));
  };

  // Handle send invites
  const handleSendInvites = async () => {
    if (students.length === 0) return;

    setIsSendingInvites(true);
    setErrors((prev) => ({ ...prev, csv: undefined }));
    setInvitesSent(false);

    try {
      // Replace with your backend endpoint
      await axios.post("http://localhost:3000/api/invite-students", {
        roomCode,
        roomName,
        students,
      });

      setInvitesSent(true);
      // Optionally show a toast notification here
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        csv: "Failed to send invites. Please try again.",
      }));
      setInvitesSent(false);
      // Optionally show a toast notification here
    } finally {
      setIsSendingInvites(false);
    }
  };

  // Handle create poll
  const handleCreatePoll = async () => {
    if (!roomName.trim()) {
      setRoomNameError("Room Name is required.");
      return;
    }

    setRoomNameError(""); // Clear error if valid
    setIsLoading(true);

    try {
      // Get user ID from localStorage user object
      const userString = localStorage.getItem("user");
      let userId = "unknown_user";
      if (userString) {
        try {
          const userObj = JSON.parse(userString);
          userId = userObj.id || "unknown_user";
        } catch (e) {
          console.error("Failed to parse user from localStorage:", e);
        }
      }

      const response = await axios.post(
        "http://localhost:3000/api/room-code/polls",
        {
          room_code: roomCode,
          room_title: roomName, // Changed from room_name to room_title to match backend
          user_id: userId,
        }
      );

      console.log("Poll created successfully:", response.data);

      // Store the room ID in localStorage
      localStorage.setItem("roomId", response.data._id);
      localStorage.setItem("roomCode", roomCode);

      // Set poll as active immediately after successful API call
      setIsPollActive(true);
      setIsLoading(false);

      // Optional: Show success notification
      // You could add a toast notification here
    } catch (error) {
      console.error("Error creating poll:", error);
      setIsLoading(false);

      // Handle different types of errors
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const errorMessage =
            error.response.data?.message || "Failed to create poll";
          setRoomNameError(errorMessage);
          console.error("Server error:", error.response.status, errorMessage);
        } else if (error.request) {
          // Network error
          setRoomNameError("Network error. Please check your connection.");
          console.error("Network error:", error.request);
        } else {
          // Other error
          setRoomNameError("An unexpected error occurred.");
          console.error("Error:", error.message);
        }
      } else {
        setRoomNameError("An unexpected error occurred.");
        console.error("Unknown error:", error);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Create A New Poll Session
            </h1>
            <p className="text-gray-400 text-lg">
              Set up your room code and optionally invite students
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Section 1: Room Code Generator */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <GlassCard className="p-6 sm:p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Hash className="w-5 h-5 text-white" />
                  </div>

                  <h2 className="text-xl font-semibold text-white">
                    Room Code
                  </h2>
                  {isPollActive && (
                    <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                      ACTIVE
                    </div>
                  )}
                </div>
                {/* Room Name input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Room Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => {
                      setRoomName(e.target.value);
                      if (e.target.value.trim()) setRoomNameError(""); // Clear error on input
                    }}
                    placeholder="Enter a room name (e.g. Math Quiz, Science Poll)"
                    className={`w-full px-4 py-2 bg-white/5 border ${
                      roomNameError ? "border-red-500" : "border-white/10"
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition`}
                    maxLength={50}
                    required
                  />
                  {roomNameError && (
                    <p className="text-red-400 text-xs mt-1">{roomNameError}</p>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <div
                      className={`w-full px-4 py-6 bg-white/5 border rounded-lg text-center transition-all duration-300 ${
                        isPollActive
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-white/10"
                      }`}
                    >
                      <div className="text-3xl font-bold text-white tracking-wider mb-2">
                        {roomCode}
                      </div>
                      {/* Show the room name here */}
                      {roomName && (
                        <p className="text-primary-400 text-base font-semibold mt-2">
                          {roomName}
                        </p>
                      )}
                      <p className="text-gray-400 text-sm">
                        Share this code with participants
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-3">
                    <motion.button
                      whileHover={!isPollActive ? { scale: 1.05 } : {}}
                      whileTap={!isPollActive ? { scale: 0.95 } : {}}
                      onClick={handleRegenerateCode}
                      disabled={isPollActive}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        isPollActive
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg"
                      }`}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${
                          isPollActive
                            ? ""
                            : "hover:rotate-180 transition-transform duration-300"
                        }`}
                      />
                      <span>
                        {isPollActive ? "Code Locked" : "Generate New Code"}
                      </span>
                    </motion.button>

                    {/* Destroy Room Button */}
                    <AnimatePresence>
                      {isPollActive && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleDestroyRoom}
                          disabled={isDestroying}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                            isDestroying
                              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-lg"
                          }`}
                        >
                          {isDestroying ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Destroying...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              <span>Destroy Room</span>
                            </>
                          )}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <Users className="w-4 h-4" />
                    <span>
                      Students will use this code to join your poll session
                    </span>
                  </div>
                </div>

                {/* Create Poll Button */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <motion.button
                    whileHover={!isPollActive ? { scale: 1.02 } : {}}
                    whileTap={!isPollActive ? { scale: 0.98 } : {}}
                    onClick={handleCreatePoll}
                    disabled={isPollActive || isLoading}
                    className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                      isPollActive
                        ? "bg-green-600 text-white cursor-default"
                        : isLoading
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating Poll...</span>
                      </div>
                    ) : isPollActive ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Play className="w-5 h-5" />
                        <span>Poll Session Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Play className="w-5 h-5" />
                        <span>Create Poll Session</span>
                      </div>
                    )}
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>

            {/* Section 2: Invite Students via CSV (Optional) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GlassCard className="p-6 sm:p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    Invite Students
                  </h2>
                  <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                    OPTIONAL
                  </div>
                </div>

                <div className="space-y-4">
                  {/* File Upload Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                      isDragOver
                        ? "border-primary-500/50 bg-primary-500/10"
                        : errors.csv
                          ? "border-red-500/50 bg-red-500/5"
                          : "border-white/20 hover:border-white/30"
                    }`}
                  >
                    <input
                      type="file"
                      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={handleFileInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    <div className="space-y-4">
                      <motion.div
                        animate={{ scale: isDragOver ? 1.1 : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      </motion.div>

                      <div>
                        <p className="text-white font-medium">
                          {isDragOver
                            ? "Drop your CSV file here"
                            : "Drag & drop your CSV or Excel file"}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          or click to browse files
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {errors.csv && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center space-x-2 text-red-400 text-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.csv}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* File Info */}
                  <AnimatePresence>
                    {csvFile && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-white text-sm font-medium">
                              {csvFile.name}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {students.length} students found
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={removeFile}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* CSV Format Info */}
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <FileText className="w-4 h-4" />
                    <span>
                      CSV must contain 'email' column (optional: 'name' column)
                    </span>
                  </div>
                </div>

                {/* Send Invites Button */}
                <AnimatePresence>
                  {students.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-white/10"
                    >
                      <motion.button
                        whileHover={!invitesSent ? { scale: 1.02 } : {}}
                        whileTap={!invitesSent ? { scale: 0.98 } : {}}
                        onClick={handleSendInvites}
                        disabled={invitesSent || isSendingInvites}
                        className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                          invitesSent
                            ? "bg-green-600 text-white cursor-default"
                            : isSendingInvites
                              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg hover:shadow-xl"
                        }`}
                      >
                        {isSendingInvites ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Sending Invites...</span>
                          </div>
                        ) : invitesSent ? (
                          <div className="flex items-center justify-center space-x-2">
                            <Mail className="w-5 h-5" />
                            <span>Invites Sent Successfully</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <Mail className="w-5 h-5" />
                            <span>
                              Send Invites to {students.length} Students
                            </span>
                          </div>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          </div>

          {/* Timer Section */}
          <AnimatePresence>
            {isPollActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <GlassCard className="p-6 sm:p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      Session Timer
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white mb-2 font-mono">
                        {formatTime(timeRemaining)}
                      </div>
                      <p className="text-gray-400">Time Remaining</p>
                      {timeRemaining <= 600 && timeRemaining > 0 && (
                        <motion.p
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{
                            duration: 1,
                            repeat: Number.POSITIVE_INFINITY,
                          }}
                          className="text-red-400 text-sm mt-2"
                        >
                          Session expires soon!
                        </motion.p>
                      )}
                      {timeRemaining === 0 && (
                        <p className="text-red-400 text-sm mt-2">
                          Session Expired
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="text-gray-400 text-sm mb-3">
                        Extend session time:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            setTimeRemaining((prev) => prev + 30 * 60)
                          } // 30 mins in seconds
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-sm hover:shadow-lg transition-all duration-200"
                        >
                          <Plus className="w-3 h-3" />
                          <span>30 mins</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleExtendTime(1)}
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-sm hover:shadow-lg transition-all duration-200"
                        >
                          <Plus className="w-3 h-3" />
                          <span>1 Hour</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleExtendTime(2)}
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm hover:shadow-lg transition-all duration-200"
                        >
                          <Plus className="w-3 h-3" />
                          <span>2 Hours</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleExtendTime(3)}
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm hover:shadow-lg transition-all duration-200"
                        >
                          <Plus className="w-3 h-3" />
                          <span>3 Hours</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Student Preview */}
          <AnimatePresence>
            {students.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <GlassCard className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">
                        Student Preview ({students.length})
                      </h3>
                      {invitesSent && (
                        <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          INVITED
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {showPreview ? (
                        <EyeOff className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showPreview && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {students.slice(0, 10).map((student, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg"
                            >
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                  {student.name}
                                </p>
                                <p className="text-gray-400 text-xs truncate">
                                  {student.email}
                                </p>
                              </div>
                              {invitesSent && (
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              )}
                            </motion.div>
                          ))}
                        </div>

                        {students.length > 10 && (
                          <p className="text-gray-400 text-sm text-center">
                            +{students.length - 10} more students
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreatePollPage;
