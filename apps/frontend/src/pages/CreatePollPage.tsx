// File: apps/frontend/src/pages/CreatePollPage.tsx
"use client"

import React, { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  Upload,
  FileText,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Trash2,
  Loader
} from "lucide-react"
import GlassCard from "../components/GlassCard"
import DashboardLayout from "../components/DashboardLayout"
import * as XLSX from "xlsx"
import { apiService } from '../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

interface StudentInvite {
  name: string
  email: string
}

const CreatePollPage: React.FC = () => {
  // Use AuthContext for room management
  const { activeRoom, createRoom, destroyRoom, isCreatingRoom } = useAuth();
  const navigate = useNavigate();
  
  // Local state for CSV functionality
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [students, setStudents] = useState<StudentInvite[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingInvites, setIsSendingInvites] = useState(false)
  const [invitesSent, setInvitesSent] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [roomNameError, setRoomNameError] = useState("")
  const [errors, setErrors] = useState<{ csv?: string }>({})
  const [showPreview, setShowPreview] = useState(false)

  // File handling functions
  const handleFileUpload = useCallback(async (file: File) => {
    const isCSV = file.name.endsWith(".csv")
    const isXLSX = file.name.endsWith(".xls") || file.name.endsWith(".xlsx")

    if (!isCSV && !isXLSX) {
      setErrors({ csv: "Please upload a .csv or .xls/.xlsx file" })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      let parsedStudents: StudentInvite[] = []
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][]
      const headers = rows[0].map((h) => String(h).toLowerCase().trim())
      const emailIndex = headers.findIndex((h) => h.includes("email"))
      const nameIndex = headers.findIndex((h) => h.includes("name"))

      if (emailIndex === -1) {
        throw new Error("File must contain an 'email' column")
      }

      parsedStudents = rows.slice(1).filter((row) => row[emailIndex]).map((row) => ({
        name: nameIndex !== -1 ? String(row[nameIndex]).trim() || "Unknown" : "Unknown",
        email: String(row[emailIndex]).trim() || "",
      }))

      if (parsedStudents.length === 0) {
        throw new Error("No valid student records found")
      }

      setStudents(parsedStudents)
      setCsvFile(file)
      setShowPreview(true)
    } catch (error) {
      setErrors({ csv: error instanceof Error ? error.message : "Failed to parse the file" })
      setStudents([])
      setCsvFile(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) handleFileUpload(files[0])
    }, [handleFileUpload])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) handleFileUpload(files[0])
  }

  const removeFile = () => {
    setCsvFile(null)
    setStudents([])
    setShowPreview(false)
    setInvitesSent(false)
    setErrors({})
  }

  const handleCreateSession = () => {
    if (!roomName.trim()) {
      setRoomNameError("Room Name is required.");
      return;
    }
    setRoomNameError("");
    createRoom(roomName);
  };

  const handleSendInvites = async () => {
    if (!activeRoom) return toast.error("An active session is required to send invites.");
    if (!csvFile) return toast.error("Please upload a file with student emails.");
    
    const formData = new FormData();
    formData.append('studentsFile', csvFile);

    setIsSendingInvites(true);
    const sendingToast = toast.loading(`Sending invites to ${students.length} students...`);
    try {
        const response = await apiService.sendInvites(activeRoom._id, formData);
        toast.success(response.data.message, { id: sendingToast, duration: 4000 });
        setInvitesSent(true);
    } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to send invites.', { id: sendingToast });
    } finally {
        setIsSendingInvites(false);
    }
  };

  const handleDestroySession = () => {
      destroyRoom(() => navigate('/host/leaderboard'));
      setRoomName('');
      removeFile();
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <motion.div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Create New Poll Session</h1>
            <p className="text-gray-400">Start a new room and invite your students to join.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Session Creation Panel */}
            <motion.div>
              <GlassCard className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-white mb-6">1. Create Your Session</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Session Name <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    value={roomName} 
                    onChange={e => {
                      setRoomName(e.target.value);
                      setRoomNameError('');
                    }} 
                    placeholder="e.g., Weekly Chapter 5 Review" 
                    disabled={!!activeRoom}
                    className={`w-full px-4 py-2 bg-white/5 border ${roomNameError ? "border-red-500" : "border-white/10"} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition disabled:bg-white/10 disabled:cursor-not-allowed`}
                  />
                  {roomNameError && <p className="text-red-400 text-xs mt-1">{roomNameError}</p>}
                </div>
                
                {!activeRoom ? (
                  <motion.button 
                    onClick={handleCreateSession} 
                    disabled={isCreatingRoom} 
                    className="btn-primary w-full py-3 flex items-center justify-center"
                  >
                    {isCreatingRoom ? <Loader className="animate-spin" /> : 'Create Session & Get Code'}
                  </motion.button>
                ) : (
                  <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-gray-300">Session <span className="font-bold text-white">"{activeRoom.name}"</span> is active!</p>
                    <p className="text-3xl font-bold text-white tracking-widest my-2">{activeRoom.code}</p>
                    <button 
                        onClick={handleDestroySession} 
                        className="text-red-400 text-sm hover:underline flex items-center justify-center mx-auto gap-1"
                    >
                        <Trash2 size={14}/> End This Session
                    </button>
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Invite Panel */}
            <AnimatePresence>
              {activeRoom && (
                <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay:0.2}}>
                   <GlassCard className="p-6 sm:p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">2. Invite Students (Optional)</h2>
                    
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                        isDragOver ? "border-primary-500/50 bg-primary-500/10" : errors.csv ? "border-red-500/50 bg-red-500/5" : "border-white/20 hover:border-white/30"
                      }`}
                    >
                        <input
                          type="file"
                          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                          onChange={handleFileInputChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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

                    <AnimatePresence>
                      {errors.csv && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center space-x-2 text-red-400 text-sm mt-2"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.csv}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {csvFile && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg mt-4"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-green-400" />
                            <div>
                              <p className="text-white text-sm font-medium">{csvFile.name}</p>
                              <p className="text-gray-400 text-xs">{students.length} students found</p>
                            </div>
                          </div>
                          <button onClick={removeFile} className="p-1 hover:bg-white/10 rounded transition-colors">
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {students.length > 0 && (
                      <motion.div className="mt-6 pt-6 border-t border-white/10">
                        <button 
                          onClick={handleSendInvites} 
                          disabled={invitesSent || isSendingInvites} 
                          className="btn-primary w-full py-3"
                        >
                          {isSendingInvites ? "Sending..." : invitesSent ? "Invites Sent!" : `Send Invites to ${students.length} Students`}
                        </button>
                      </motion.div>
                    )}
                   </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{student.name}</p>
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

export default CreatePollPage;