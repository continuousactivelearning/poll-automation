// apps/frontend/src/pages/HostProfilePage.tsx
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import {
  User,
  X,
  RefreshCw,
  Edit3,
  Camera,
  Save,
  Trash2,
  Lock,
  TrendingUp,
  Users as UsersIcon,
  Award,
  Clock,
  Target,
  BarChart3,
} from "lucide-react"
import GlassCard from "../components/GlassCard"
import DashboardLayout from "../components/DashboardLayout"
import { useAuth } from "../contexts/AuthContext"
import { apiService } from "../utils/api"
import toast from 'react-hot-toast'

const HostProfilePage = () => {
  const { user, updateUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading] = useState(false)
  
  // Insights state
  const [sessionReports, setSessionReports] = useState<any[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [hostStats, setHostStats] = useState({
    totalSessions: 0,
    totalParticipants: 0,
    totalPolls: 0,
    averageAccuracy: 0,
    totalPointsAwarded: 0,
    averageParticipantsPerSession: 0,
  })
  
  // Bio editing state
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioText, setBioText] = useState("")
  const [originalBio, setOriginalBio] = useState("")
  
  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  
  // Security state
  const navigate = useNavigate()
  const [passwordData, setPasswordData] = useState({ 
    currentPassword: '', 
    newPassword: '', 
    confirmNewPassword: '' 
  })
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletePassword, setDeletePassword] = useState('')

  useEffect(() => {
    if (user) {
      setBioText(user?.bio || "")
      setOriginalBio(user?.bio || "")
    }
  }, [user])

  // Fetch session reports when Insights tab is active
  useEffect(() => {
    if (activeTab === 'insights') {
      fetchSessionReports()
    }
  }, [activeTab])

  // Fetch session reports
  const fetchSessionReports = async () => {
    try {
      setInsightsLoading(true)
      const response = await apiService.getHostSessionReports()
      const reports = response.data || []
      setSessionReports(reports)

      // Calculate stats
      if (reports.length > 0) {
        const totalSessions = reports.length
        let totalParticipants = 0
        let totalPolls = 0
        let totalCorrectAnswers = 0
        let totalAttempts = 0
        let totalPoints = 0

        reports.forEach((report: any) => {
          const participants = report.studentResults?.length || 0
          totalParticipants += participants

          report.studentResults?.forEach((student: any) => {
            totalPolls += student.totalPolls || 0
            totalCorrectAnswers += student.correctAnswers || 0
            totalAttempts += student.pollsAttempted || 0
            totalPoints += student.totalPoints || 0
          })
        })

        const averageAccuracy = totalAttempts > 0 ? (totalCorrectAnswers / totalAttempts) * 100 : 0
        const averageParticipants = totalSessions > 0 ? totalParticipants / totalSessions : 0

        setHostStats({
          totalSessions,
          totalParticipants,
          totalPolls,
          averageAccuracy,
          totalPointsAwarded: totalPoints,
          averageParticipantsPerSession: averageParticipants,
        })
      } else {
        setHostStats({
          totalSessions: 0,
          totalParticipants: 0,
          totalPolls: 0,
          averageAccuracy: 0,
          totalPointsAwarded: 0,
          averageParticipantsPerSession: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching session reports:', error)
      toast.error('Failed to load session insights')
    } finally {
      setInsightsLoading(false)
    }
  }

  // Bio editing functions
  const startEditingBio = () => {
    setOriginalBio(user?.bio || "")
    setBioText(user?.bio || "")
    setIsEditingBio(true)
  }

  const saveBio = async () => {
    if (bioText.trim() === originalBio.trim()) {
      setIsEditingBio(false)
      return
    }

    try {
      const saveToast = toast.loading('Updating bio...')
      
      await apiService.updateProfile({
        fullName: user?.fullName || "",
        bio: bioText.trim()
      })

      // Update user context with new bio
      updateUser({ bio: bioText.trim() })
      setIsEditingBio(false)
      toast.success('Bio updated successfully!', { id: saveToast })
      
    } catch (error: any) {
      console.error('Error updating bio:', error)
      toast.error('Failed to update bio: ' + (error.response?.data?.message || error.message))
    }
  }

  const cancelBioEdit = () => {
    setBioText(originalBio)
    setIsEditingBio(false)
  }

  // Image upload functions
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB')
      return
    }

    try {
      setIsUploadingImage(true)
      const uploadToast = toast.loading('Uploading profile image...')

      const formData = new FormData()
      formData.append('avatar', file)
      
      const response = await apiService.uploadAvatar(formData)
      
      // Update user context with new avatar URL
      if (response.data?.avatar) {
        updateUser({ avatar: response.data.avatar })
      }

      toast.success('Profile image updated successfully!', { id: uploadToast })

    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image: ' + (error.response?.data?.message || error.message))
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Delete avatar function
  const handleDeleteAvatar = async () => {
    if (!user?.avatar || user.avatar === "https://www.gravatar.com/avatar/?d=mp") {
      toast.error('No custom profile image to delete')
      return
    }

    const confirmDelete = window.confirm('Are you sure you want to delete your profile image?')
    if (!confirmDelete) return

    try {
      setIsUploadingImage(true)
      const deleteToast = toast.loading('Deleting profile image...')

      const response = await apiService.deleteAvatar()
      
      // Update user context to default avatar
      if (response.data?.avatar) {
        updateUser({ avatar: response.data.avatar })
      }

      toast.success('Profile image deleted successfully!', { id: deleteToast })

    } catch (error: any) {
      console.error('Error deleting avatar:', error)
      toast.error('Failed to delete image: ' + (error.response?.data?.message || error.message))
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Security functions
  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      return toast.error("New passwords do not match.")
    }
    
    const pwdToast = toast.loading('Changing password...')
    try {
      const api = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
      const response = await fetch(`${api}/users/change-password`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(passwordData),
      })
      const data = await response.json()
      
      // Dismiss loading toast first
      toast.dismiss(pwdToast)
      
      if (!response.ok) {
        // Show specific error for wrong current password
        if (response.status === 401 || data.message?.toLowerCase().includes('current password')) {
          return Swal.fire({
            title: 'Incorrect Password',
            text: 'The current password you entered is incorrect. Please try again.',
            icon: 'error',
            confirmButtonText: 'Try Again',
            background: '#1f2937',
            color: '#ffffff',
            confirmButtonColor: '#ef4444',
            backdrop: `rgba(0,0,0,0.4)`
          })
        }
        throw new Error(data.message)
      }

      // Password changed successfully - show success message and logout
      await Swal.fire({
        title: 'Password Changed!',
        text: 'Your password has been updated successfully. You will be logged out now. Please login with your new password.',
        icon: 'success',
        confirmButtonText: 'OK',
        background: '#1f2937',
        color: '#ffffff',
        confirmButtonColor: '#10b981',
        backdrop: `rgba(0,0,0,0.4)`
      })
      
      // Clear password fields
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
      
      // Logout user and redirect to login page
      logout()
      navigate('/login')
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password.')
    }
  }
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return toast.error('Please type DELETE to confirm.')
    if (!deletePassword) return toast.error('Please enter your current password to confirm deletion.')
    
    const delToast = toast.loading('Deleting account...')
    try {
      const api = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
      const response = await fetch(`${api}/users/delete-account`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ password: deletePassword }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)

      toast.success('Account deleted. Logging out...', { id: delToast, duration: 4000 })
      setTimeout(() => {
        logout()
        navigate('/login')
      }, 2000)
    } catch (error: any) {
      toast.error(error.message || 'Deletion failed.', { id: delToast })
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Hero Profile Section */}
      <GlassCard className="p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar Section */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 p-1">
              <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-dark-800 animate-pulse"></div>
            
            {/* Image Upload/Delete Buttons */}
            <div className="absolute bottom-0 right-0 flex gap-2">
              {/* Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="profile-image-upload"
                  disabled={isUploadingImage}
                />
                <label
                  htmlFor="profile-image-upload"
                  className={`bg-white/10 backdrop-blur-xl rounded-full p-2 hover:bg-white/20 transition-all duration-200 cursor-pointer flex items-center justify-center ${
                    isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Upload new profile image"
                >
                  {isUploadingImage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                </label>
              </div>

              {/* Delete Button - Only show if user has a custom avatar */}
              {user?.avatar && user.avatar !== "https://www.gravatar.com/avatar/?d=mp" && (
                <button
                  onClick={handleDeleteAvatar}
                  disabled={isUploadingImage}
                  className={`bg-red-500/20 backdrop-blur-xl rounded-full p-2 hover:bg-red-500/30 transition-all duration-200 ${
                    isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Delete profile image"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{user?.fullName || 'Loading...'}</h1>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-full">
                <span className="text-white text-sm font-bold">Host</span>
              </div>
            </div>
            <p className="text-blue-300 mb-2 text-center md:text-left">{user?.email}</p>
            
            {/* Bio Section with Edit Functionality */}
            <div className="mb-4">
              {isEditingBio ? (
                <div className="space-y-3">
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    placeholder="Add a bio to tell others about yourself..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={3}
                    maxLength={200}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {bioText.length}/200 characters
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={saveBio}
                        className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 px-3 py-1 rounded-lg text-white text-sm font-medium transition-all duration-200 flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={cancelBioEdit}
                        className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-white text-sm font-medium transition-all duration-200 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 group">
                  <p className="text-gray-400 flex-1">{user?.bio || 'No bio added yet'}</p>
                  <button
                    onClick={startEditingBio}
                    className="opacity-0 group-hover:opacity-100 bg-white/10 hover:bg-white/20 p-1 rounded transition-all duration-200"
                  >
                    <Edit3 className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Host Profile</span>
              </div>
            </div>
          </div>

          {/* User Status Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm">Online</span>
          </div>
        </div>
      </GlassCard>
    </div>
  )

  const renderInsights = () => (
    <div className="space-y-6">
      {insightsLoading ? (
        <GlassCard className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          </div>
        </GlassCard>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Sessions */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Sessions</p>
                  <h3 className="text-3xl font-bold text-white">{hostStats.totalSessions}</h3>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-3 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </GlassCard>

            {/* Total Participants */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Participants</p>
                  <h3 className="text-3xl font-bold text-white">{hostStats.totalParticipants}</h3>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-3 rounded-lg">
                  <UsersIcon className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </GlassCard>

            {/* Total Polls Created */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Polls Created</p>
                  <h3 className="text-3xl font-bold text-white">{hostStats.totalPolls}</h3>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-3 rounded-lg">
                  <Target className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </GlassCard>

            {/* Average Accuracy */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Avg. Student Accuracy</p>
                  <h3 className="text-3xl font-bold text-white">{hostStats.averageAccuracy.toFixed(1)}%</h3>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 p-3 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
            </GlassCard>

            {/* Total Points Awarded */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Points Awarded</p>
                  <h3 className="text-3xl font-bold text-white">{hostStats.totalPointsAwarded.toLocaleString()}</h3>
                </div>
                <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 p-3 rounded-lg">
                  <Award className="w-8 h-8 text-pink-400" />
                </div>
              </div>
            </GlassCard>

            {/* Avg Participants per Session */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Avg. Participants/Session</p>
                  <h3 className="text-3xl font-bold text-white">{hostStats.averageParticipantsPerSession.toFixed(1)}</h3>
                </div>
                <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/20 p-3 rounded-lg">
                  <UsersIcon className="w-8 h-8 text-teal-400" />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Recent Sessions */}
          {sessionReports.length > 0 ? (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-400" />
                  Recent Sessions
                </h3>
                <button
                  onClick={fetchSessionReports}
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              <div className="space-y-4">
                {sessionReports.slice(0, 5).map((report: any) => (
                  <div
                    key={report._id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-lg mb-1">{report.sessionName}</h4>
                        <p className="text-gray-400 text-sm">
                          {new Date(report.sessionEndedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Participants</p>
                        <p className="text-white font-bold">{report.studentResults?.length || 0}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Total Polls</p>
                        <p className="text-white font-bold">
                          {report.studentResults?.reduce((sum: number, s: any) => sum + (s.totalPolls || 0), 0) || 0}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Avg. Accuracy</p>
                        <p className="text-white font-bold">
                          {report.studentResults?.length > 0
                            ? (
                                report.studentResults.reduce((sum: number, s: any) => sum + (s.accuracy || 0), 0) /
                                report.studentResults.length
                              ).toFixed(1)
                            : 0}%
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Points Given</p>
                        <p className="text-white font-bold">
                          {report.studentResults?.reduce((sum: number, s: any) => sum + (s.totalPoints || 0), 0) || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {sessionReports.length > 5 && (
                <div className="mt-4 text-center">
                  <p className="text-gray-400 text-sm">Showing 5 of {sessionReports.length} sessions</p>
                </div>
              )}
            </GlassCard>
          ) : (
            <GlassCard className="p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Sessions Yet</h3>
              <p className="text-gray-400 mb-4">Start creating sessions to see your insights here!</p>
            </GlassCard>
          )}
        </>
      )}
    </div>
  )

  const renderSecurity = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <form onSubmit={handlePasswordChangeSubmit}>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5" /> 
            Change Password
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
              <input 
                type="password" 
                required 
                value={passwordData.currentPassword} 
                onChange={(e) => setPasswordData(p => ({...p, currentPassword: e.target.value}))} 
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
              <input 
                type="password" 
                required 
                value={passwordData.newPassword} 
                onChange={(e) => setPasswordData(p => ({...p, newPassword: e.target.value}))} 
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
              <input 
                type="password" 
                required 
                value={passwordData.confirmNewPassword} 
                onChange={(e) => setPasswordData(p => ({...p, confirmNewPassword: e.target.value}))} 
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
            </div>
            <div className="text-right">
              <button 
                type="submit" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-2 rounded-lg text-white font-medium transition-all duration-200"
              >
                Update Password
              </button>
            </div>
          </div>
        </form>
      </GlassCard>
      
      <GlassCard className="p-6 border-t-2 border-red-500/30">
        <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5" /> 
          Delete Account
        </h3>
        <p className="text-gray-400 text-sm mb-4">This action is permanent and cannot be undone.</p>
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder='Type "DELETE" to confirm' 
            value={deleteConfirmText} 
            onChange={e => setDeleteConfirmText(e.target.value)} 
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
          />
          <input 
            type="password" 
            placeholder="Enter current password to confirm" 
            value={deletePassword} 
            onChange={e => setDeletePassword(e.target.value)} 
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
          />
          <button 
            onClick={handleDeleteAccount} 
            className="w-full md:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-2 rounded-lg text-white font-medium transition-all duration-200"
          >
            Delete My Account
          </button>
        </div>
      </GlassCard>
    </div>
  )

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "insights", label: "Insights", icon: TrendingUp },
    { id: "security", label: "Security", icon: Lock },
  ]

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Please log in to view your profile.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Host Profile</h1>
          <button
            onClick={() => window.location.reload()}
            disabled={isLoading}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Tab Navigation */}
        <GlassCard className="p-2">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" && renderOverview()}
          {activeTab === "insights" && renderInsights()}
          {activeTab === "security" && renderSecurity()}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

export default HostProfilePage