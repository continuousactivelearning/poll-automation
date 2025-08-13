"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Loader2
} from "lucide-react"
import GlassCard from "../components/GlassCard"
import DashboardLayout from "../components/DashboardLayout"
import * as XLSX from "xlsx"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import { useNotificationContext } from "../contexts/NotificationContext"

interface StudentInvite {
  name?: string
  email: string
}

interface Session {
  _id: string;
  roomCode: string;
  sessionTitle: string;
  host: string;
  hostName: string;
  hostEmail: string;
  createdAt: string;
  endedAt: string;
  isActive: boolean;
  invitedParticipants?: StudentInvite[]; // Now explicitly optional, but we'll always send it
  joinedParticipants?: any[];
  approvedPollsCount: number;
}

const POLL_STORAGE_KEY = "activePollSession";
const API_BASE_URL = 'http://localhost:3000/api';

const CreatePollPage: React.FC = () => {
  const { user, token, isLoading: authLoading } = useAuth();
  const { showNotification } = useNotificationContext();

  const [roomCode, setRoomCode] = useState("")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [students, setStudents] = useState<StudentInvite[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingInvites, setIsSendingInvites] = useState(false) // This state is now mostly for UX feedback
  const [isDestroying, setIsDestroying] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<{ csv?: string; api?: string }>({})
  const [isPollActive, setIsPollActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(3 * 60 * 60)
  const [invitesSent, setInvitesSent] = useState(false) // This state is now for UX feedback
  const [roomName, setRoomName] = useState("");
  const [roomNameError, setRoomNameError] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  // isSessionDataLoaded will now primarily prevent duplicate fetches *within* a stable state,
  // not prevent initial loads or re-loads after navigation.
  const [isSessionDataLoaded, setIsSessionDataLoaded] = useState(false); 

  // Function to generate random room code (Frontend only)
  const generateRoomCode = (): string => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  // Generate a new room code on initial load
  useEffect(() => {
    setRoomCode(generateRoomCode());
  }, []);

  // Effect to load poll session from localStorage or fetch from backend if active
  useEffect(() => {
    const loadSession = async () => {
      setLoadingSession(true);
      const savedSessionId = localStorage.getItem(POLL_STORAGE_KEY);

      // Only attempt to fetch if auth is not loading, user is authenticated,
      // a token is available, AND savedSessionId is a valid string.
      // Also, only fetch if the session data hasn't been loaded for this specific activeSessionId yet.
      if (!authLoading && user?.id && token && savedSessionId && savedSessionId !== "null" && savedSessionId !== activeSessionId) {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
          const response = await axios.get<any, { data: { session: Session } }>(
            `${API_BASE_URL}/sessions/${savedSessionId}`,
            config
          );
          const fetchedSession = response.data.session;

          if (fetchedSession.isActive && fetchedSession.host === user.id) {
            setRoomCode(fetchedSession.roomCode);
            setRoomName(fetchedSession.sessionTitle);
            setActiveSessionId(fetchedSession._id);
            setIsPollActive(true);

            if (fetchedSession.invitedParticipants && fetchedSession.invitedParticipants.length > 0) {
              setStudents(fetchedSession.invitedParticipants);
              setInvitesSent(true);
              setShowPreview(true);
            } else {
              setStudents([]);
              setInvitesSent(false);
              setShowPreview(false);
            }

            const now = new Date().getTime();
            const endedAtTime = new Date(fetchedSession.endedAt).getTime();
            const remaining = Math.max(0, Math.floor((endedAtTime - now) / 1000));
            setTimeRemaining(remaining);

            if (remaining === 0) {
              setIsPollActive(false);
              showNotification("Active session has expired.", "info");
              localStorage.removeItem(POLL_STORAGE_KEY);
              // Reset all states for a new session
              setRoomCode(generateRoomCode());
              setRoomName("");
              setActiveSessionId(null);
              setStudents([]);
              setInvitesSent(false);
              setShowPreview(false);
            } else {
              showNotification("Active session loaded from backend.", "info");
            }
            setIsSessionDataLoaded(true); // Mark session data as loaded for this activeSessionId
          } else {
            console.log("Existing session is not active or does not belong to current user. Clearing.");
            localStorage.removeItem(POLL_STORAGE_KEY);
            // Reset all states for a new session
            setRoomCode(generateRoomCode());
            setIsPollActive(false);
            setRoomName("");
            setActiveSessionId(null);
            setStudents([]);
            setInvitesSent(false);
            setShowPreview(false);
            setIsSessionDataLoaded(false); // Reset flag if session is invalid
          }
        } catch (error: any) {
          console.error("Error fetching active session:", error.response?.data || error.message);
          showNotification("Failed to load active session. It might have expired or been destroyed.", "error");
          localStorage.removeItem(POLL_STORAGE_KEY);
          // Reset all states for a new session
          setRoomCode(generateRoomCode());
          setIsPollActive(false);
          setRoomName("");
          setActiveSessionId(null);
          setStudents([]);
          setInvitesSent(false);
          setShowPreview(false);
          setIsSessionDataLoaded(false); // Reset flag on error
        }
      } else if (!authLoading && (!user?.id || !token || !savedSessionId || savedSessionId === "null" || savedSessionId === activeSessionId)) {
        // If auth is stable but no valid user/token or savedSessionId is invalid,
        // OR if the current activeSessionId is already loaded, ensure states are consistent.
        // This block primarily handles initial state setup or clearing when no valid session is found/needed.
        if (!activeSessionId) { // Only reset if no active session is truly set
          localStorage.removeItem(POLL_STORAGE_KEY);
          setRoomCode(generateRoomCode());
          setIsPollActive(false);
          setRoomName("");
          setActiveSessionId(null);
          setStudents([]);
          setInvitesSent(false);
          setShowPreview(false);
          setIsSessionDataLoaded(false);
        }
      }
      setLoadingSession(false); // End loading regardless of whether a session was found
    };

    // Only call loadSession if auth is not loading, as user and token will be stable then
    // And if current activeSessionId is null or different from savedSessionId
    // This ensures it attempts to load if a session is in local storage, or if we need to initialize.
    if (!authLoading && (!activeSessionId || localStorage.getItem(POLL_STORAGE_KEY) !== activeSessionId)) {
      loadSession();
    } else if (!authLoading && activeSessionId && localStorage.getItem(POLL_STORAGE_KEY) === activeSessionId) {
      // If there's an active session and it matches local storage, and auth is done,
      // we can assume it's loaded and stop the loading indicator.
      setLoadingSession(false);
    }
  }, [token, user?.id, authLoading, activeSessionId, showNotification]); // Removed isSessionDataLoaded from dependencies to allow re-evaluation

  // Persist active session ID to localStorage
  useEffect(() => {
    if (isPollActive && activeSessionId) {
      localStorage.setItem(POLL_STORAGE_KEY, activeSessionId);
    } else {
      localStorage.removeItem(POLL_STORAGE_KEY);
    }
  }, [isPollActive, activeSessionId]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPollActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsPollActive(false);
            showNotification("Session has ended.", "info");
            localStorage.removeItem(POLL_STORAGE_KEY);
            // Reset all states for a new session
            setRoomCode(generateRoomCode());
            setRoomName("");
            setActiveSessionId(null);
            setStudents([]);
            setInvitesSent(false);
            setShowPreview(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeRemaining === 0 && isPollActive) {
      setIsPollActive(false);
      showNotification("Session has ended.", "info");
      localStorage.removeItem(POLL_STORAGE_KEY);
      // Reset all states for a new session
      setRoomCode(generateRoomCode());
      setRoomName("");
      setActiveSessionId(null);
      setStudents([]);
      setInvitesSent(false);
      setShowPreview(false);
    }
    return () => clearInterval(interval);
  }, [isPollActive, timeRemaining, showNotification]);

  // Handle room code regeneration (Frontend only, if poll not active)
  const handleRegenerateCode = () => {
    if (!isPollActive) {
      setRoomCode(generateRoomCode());
    }
  }

  // Handle destroy room (Backend call)
  const handleDestroyRoom = async () => {
    if (!activeSessionId || !token) {
      showNotification("No active session to destroy.", "error");
      return;
    }

    setIsDestroying(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.put<any, { data: { message: string, session: Session } }>(
        `${API_BASE_URL}/sessions/${activeSessionId}/deactivate`,
        {},
        config
      );
      
      console.log("Session destruction response (Frontend):", response.data);
      showNotification(response.data.message || "Session destroyed successfully.", "success");

      // Reset all states to default new session state
      setIsPollActive(false);
      setTimeRemaining(3 * 60 * 60);
      setRoomCode(generateRoomCode()); // Generate new code
      setRoomName(""); // Clear room name
      setActiveSessionId(null);
      setInvitesSent(false);
      setStudents([]);
      setCsvFile(null);
      setErrors({});
      setIsSessionDataLoaded(false); // Reset this flag after destroying session
      
    } catch (error: any) {
      console.error("Error destroying room (Frontend):", error.response?.data || error.message);
      showNotification(error.response?.data?.message || "Failed to destroy session.", "error");
    } finally {
      setIsDestroying(false);
    }
  };

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Extend time (Backend call)
  const handleExtendTime = async (hours: number) => {
    if (!activeSessionId || !token) {
      showNotification("No active session to extend.", "error");
      return;
    }

    const extensionMinutes = hours * 60;
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.put<any, { data: { session: Session } }>(
        `${API_BASE_URL}/sessions/${activeSessionId}/extend`,
        { extensionMinutes: extensionMinutes },
        config
      );
      
      const newEndedAt = new Date(response.data.session.endedAt).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((newEndedAt - now) / 1000));
      setTimeRemaining(remaining);
      showNotification(`Session extended by ${hours} hour(s)!`, "success");
      console.log(`Session ${activeSessionId} extended. New end time: ${response.data.session.endedAt}`);
    } catch (error: any) {
      console.error("Error extending session:", error.response?.data || error.message);
      showNotification(error.response?.data?.message || "Failed to extend session.", "error");
    }
  };

  // Parse CSV content (Frontend only)
  const parseCSV = (content: string): StudentInvite[] => {
    const lines = content.split("\n").filter((line) => line.trim())
    const headers = lines[0]
      .toLowerCase()
      .split(",")
      .map((h) => h.trim())

    const emailIndex = headers.findIndex((h) => h.includes("email"))
    const nameIndex = headers.findIndex((h) => h.includes("name"))

    if (emailIndex === -1) {
      throw new Error("CSV must contain an 'email' column")
    }

    return lines
      .slice(1)
      .map((line) => {
        const values = line.split(",").map((v) => v.trim())
        return {
          name: nameIndex !== -1 ? values[nameIndex] || undefined : undefined,
          email: values[emailIndex] || "",
        }
      })
      .filter((student) => student.email)
  }

  // Handle file upload (CSV or Excel) - Frontend parsing
  const handleFileUpload = useCallback(async (file: File) => {
    const isCSV = file.name.endsWith(".csv")
    const isXLS = file.name.endsWith(".xls") || file.name.endsWith(".xlsx")

    if (!isCSV && !isXLS) {
      setErrors((prev) => ({ ...prev, csv: "Please upload a .csv or .xls/.xlsx file" }))
      return
    }

    setIsLoading(true)
    setErrors((prev) => ({ ...prev, csv: undefined, api: undefined }))

    try {
      let parsedStudents: StudentInvite[] = []

      if (isCSV) {
        const content = await file.text()
        parsedStudents = parseCSV(content)
      } else if (isXLS) {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][]

        const headers = rows[0].map((h) => h.toLowerCase().trim())
        const emailIndex = headers.findIndex((h) => h.includes("email"))
        const nameIndex = headers.findIndex((h) => h.includes("name"))

        if (emailIndex === -1) {
          throw new Error("File must contain an 'email' column")
        }

        parsedStudents = rows
          .slice(1)
          .filter((row) => row[emailIndex])
          .map((row) => ({
            name: nameIndex !== -1 ? row[nameIndex]?.toString().trim() || undefined : undefined,
            email: row[emailIndex]?.toString().trim() || "",
          }))
      }

      if (parsedStudents.length === 0) {
        throw new Error("No valid student records found")
      }

      setStudents(parsedStudents)
      setCsvFile(file)
      setShowPreview(true)
      setInvitesSent(false); // Reset invitesSent when a new file is uploaded
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        csv: error instanceof Error ? error.message : "Failed to parse the file",
      }))
      setStudents([])
      setCsvFile(null)
      setShowPreview(false)
      setInvitesSent(false);
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileUpload(files[0])
      }
    },
    [handleFileUpload],
  )

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  // Remove uploaded file
  const removeFile = () => {
    setCsvFile(null)
    setStudents([])
    setShowPreview(false)
    setInvitesSent(false)
    setErrors((prev) => ({ ...prev, csv: undefined, api: undefined }))
  }

  // Handle send invites (This will now be part of createSession, but kept for UX)
  const handleSendInvites = async () => {
    if (students.length === 0) {
      showNotification("No students to invite. Upload a CSV first.", "warning");
      return;
    }
    // This is now purely for UX feedback, the actual invites are sent with session creation
    showNotification("Invitations will be sent upon session creation.", "info");
    setInvitesSent(true);
  };

  // Handle create poll (Backend call)
  const handleCreatePoll = async () => {
    if (!roomName.trim()) {
      setRoomNameError("Room Name is required.");
      return;
    }
    setRoomNameError("");

    if (isPollActive) {
      showNotification("A session is already active.", "info");
      return;
    }

    if (!user || !token) {
      showNotification("You must be logged in to create a session.", "error");
      return;
    }

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, api: undefined }));

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      // Ensure invitedParticipants is always an array, even if empty
      const invitedParticipants = students.map(s => ({ email: s.email, name: s.name }));

      const payload = {
        sessionTitle: roomName.trim(),
        roomCode: roomCode.toUpperCase(),
        initialDurationHours: 3,
        invitedParticipants: invitedParticipants, // Always send the array
      };

      const response = await axios.post<any, { data: { session: Session } }>(
        `${API_BASE_URL}/sessions/create`,
        payload,
        config
      );

      const createdSession = response.data.session;
      setActiveSessionId(createdSession._id);
      setIsPollActive(true);
      // Set invitesSent based on whether students array was populated
      setInvitesSent(students.length > 0);
      
      const now = new Date().getTime();
      const endedAtTime = new Date(createdSession.endedAt).getTime();
      const remaining = Math.max(0, Math.floor((endedAtTime - now) / 1000));
      setTimeRemaining(remaining);

      showNotification("Poll session created successfully!", "success");
      console.log("Created Session (Frontend):", createdSession);
      setIsSessionDataLoaded(true); // Mark session data as loaded after creation

    } catch (error: any) {
      console.error("Error creating poll session (Frontend):", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || "Failed to create poll session.";
      setErrors((prev) => ({ ...prev, api: errorMessage }));
      showNotification(errorMessage, "error");
      setIsPollActive(false);
      setIsSessionDataLoaded(false); // Reset flag on error
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || loadingSession) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
          <div className="flex flex-col items-center text-white">
            <Loader2 className="w-10 h-10 animate-spin text-primary-400" />
            <p className="mt-4 text-lg">Loading session data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Create A New Poll Session</h1>
            <p className="text-gray-400 text-lg">Set up your room code and optionally invite students</p>
          </motion.div>

          {/* API Error Display */}
          <AnimatePresence>
            {errors.api && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-center max-w-md mx-auto"
              >
                <AlertCircle className="inline-block w-5 h-5 mr-2" />
                {errors.api}
              </motion.div>
            )}
          </AnimatePresence>

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

                  <h2 className="text-xl font-semibold text-white">Room Code</h2>
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
                    onChange={e => {
                      setRoomName(e.target.value);
                      if (e.target.value.trim()) setRoomNameError("");
                    }}
                    placeholder="Enter a room name (e.g. Math Quiz, Science Poll)"
                    className={`w-full px-4 py-2 bg-white/5 border ${roomNameError ? "border-red-500" : "border-white/10"} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition`}
                    maxLength={50}
                    required
                    disabled={isPollActive}
                  />
                  {roomNameError && (
                    <p className="text-red-400 text-xs mt-1">{roomNameError}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <div
                      className={`w-full px-4 py-6 bg-white/5 border rounded-lg text-center transition-all duration-300 ${isPollActive ? "border-green-500/30 bg-green-500/5" : "border-white/10"
                        }`}
                    >
                      <div className="text-3xl font-bold text-white tracking-wider mb-2">{roomCode}</div>
                      {roomName && (
                        <p className="text-primary-400 text-base font-semibold mt-2">{roomName}</p>
                      )}
                      <p className="text-gray-400 text-sm">Share this code with participants</p>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-3">
                    <motion.button
                      whileHover={!isPollActive ? { scale: 1.05 } : {}}
                      whileTap={!isPollActive ? { scale: 0.95 } : {}}
                      onClick={handleRegenerateCode}
                      disabled={isPollActive}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${isPollActive
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg"
                        }`}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isPollActive ? "" : "hover:rotate-180 transition-transform duration-300"}`}
                      />
                      <span>{isPollActive ? "Code Locked" : "Generate New Code"}</span>
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
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${isDestroying
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-lg"
                            }`}
                        >
                          {isDestroying ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
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
                    <span>Students will use this code to join your poll session</span>
                  </div>
                </div>

                {/* Create Poll Button */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <motion.button
                    whileHover={!isPollActive ? { scale: 1.02 } : {}}
                    whileTap={!isPollActive ? { scale: 0.98 } : {}}
                    onClick={handleCreatePoll}
                    disabled={isPollActive || isLoading}
                    className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${isPollActive
                      ? "bg-green-600 text-white cursor-default"
                      : isLoading
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl"
                      }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating Session...</span>
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
                  <h2 className="text-xl font-semibold text-white">Invite Students</h2>
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
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${isDragOver
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
                      disabled={isPollActive}
                    />

                    <div className="space-y-4">
                      <motion.div animate={{ scale: isDragOver ? 1.1 : 1 }} transition={{ duration: 0.2 }}>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      </motion.div>

                      <div>
                        <p className="text-white font-medium">
                          {isDragOver ? "Drop your CSV file here" : "Drag & drop your CSV or Excel file"}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">or click to browse files</p>
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
                            <p className="text-white text-sm font-medium">{csvFile.name}</p>
                            <p className="text-gray-400 text-xs">{students.length} students found</p>
                          </div>
                        </div>
                        <button onClick={removeFile} className="p-1 hover:bg-white/10 rounded transition-colors" disabled={isPollActive}>
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* CSV Format Info */}
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <FileText className="w-4 h-4" />
                    <span>CSV must contain 'email' column (optional: 'name' column)</span>
                  </div>
                </div>

                {/* Send Invites Button (Now just for UX, invites sent with session creation) */}
                <AnimatePresence>
                  {students.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-white/10"
                    >
                      <motion.button
                        whileHover={!invitesSent && !isPollActive ? { scale: 1.02 } : {}}
                        whileTap={!invitesSent && !isPollActive ? { scale: 0.98 } : {}}
                        onClick={handleSendInvites}
                        disabled={invitesSent || isSendingInvites || isPollActive}
                        className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${invitesSent || isPollActive
                          ? "bg-green-600 text-white cursor-default"
                          : isSendingInvites
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg hover:shadow-xl"
                          }`}
                      >
                        {isSendingInvites ? (
                          <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
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
                            <span>Send Invites to {students.length} Students</span>
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
                    <h3 className="text-xl font-semibold text-white">Session Timer</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white mb-2 font-mono">{formatTime(timeRemaining)}</div>
                      <p className="text-gray-400">Time Remaining</p>
                      {timeRemaining <= 600 && timeRemaining > 0 && (
                        <motion.p
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                          className="text-red-400 text-sm mt-2"
                        >
                          Session expires soon!
                        </motion.p>
                      )}
                      {timeRemaining === 0 && <p className="text-red-400 text-sm mt-2">Session Expired</p>}
                    </div>

                    <div className="space-y-3">
                      <p className="text-gray-400 text-sm mb-3">Extend session time:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleExtendTime(0.5)}
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
                      <h3 className="text-xl font-semibold text-white">Student Preview ({students.length})</h3>
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
                                {student.name ? student.name.charAt(0).toUpperCase() : student.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{student.name || "No Name"}</p>
                                <p className="text-gray-400 text-xs truncate">{student.email}</p>
                              </div>
                              {invitesSent && <div className="w-2 h-2 bg-green-400 rounded-full"></div>}
                            </motion.div>
                          ))}
                        </div>

                        {students.length > 10 && (
                          <p className="text-gray-400 text-sm text-center">+{students.length - 10} more students</p>
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
  )
}

export default CreatePollPage
