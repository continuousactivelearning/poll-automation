// / apps/frontend/src/components/student/StudentProfilePage.tsx
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import {
  User,
  Star,
  Trophy,
  Target,
  Users,
  X,
  Award,
  RefreshCw,
  Edit3,
  Camera,
  Save,
  Trash2,
  Lock,
} from "lucide-react"
import GlassCard from "../GlassCard"
import { useAuth } from "../../contexts/AuthContext"
import { apiService } from "../../utils/api"
import toast from 'react-hot-toast'

const StudentProfilePage = () => {
  const { user, updateUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)

  const [stats, setStats] = useState([
    { label: "Total Points", value: "0", icon: Star, color: "from-yellow-500 to-orange-500" },
    { label: "Current Rank", value: "-", icon: Trophy, color: "from-purple-500 to-pink-500" },
    { label: "Accuracy Rate", value: "0%", icon: Target, color: "from-green-500 to-teal-500" },
    { label: "Polls Joined", value: "0", icon: Users, color: "from-blue-500 to-cyan-500" },
  ])

  const [achievements, setAchievements] = useState<any[]>([])
  const [userLevel, setUserLevel] = useState(1)
  const [streakData, setStreakData] = useState({ bestAnswerStreak: 0, avgResponseTime: 0, participationStreak: 0, currentStreak: 0, peakTime: 'No data yet' })
  
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

  // Load user profile and all related data
  const loadProfileData = async () => {
      if (!user) return

      setIsLoading(true)
      
      try {
        // Initialize bio text
        setBioText(user?.bio || "")
        setOriginalBio(user?.bio || "")
        
        // Load achievements data
        let totalPoints = 0
        let pollPoints = 0
        try {
          const achievementsResponse = await apiService.getUserAchievements()
          
          if (achievementsResponse.data?.achievements) {
            const achievementsData = achievementsResponse.data.achievements
            
            setAchievements(achievementsData.map((ach: any) => ({
              name: ach.name,
              icon: getAchievementIcon(ach.name) || ach.icon,
              rarity: ach.rarity,
              description: ach.description,
              earned: ach.earned,
              earnedDate: ach.earnedDate,
              points: ach.points || 0
            })))

            // Calculate total points from achievements
            totalPoints = achievementsData
              .filter((ach: any) => ach.earned)
              .reduce((sum: number, ach: any) => sum + (ach.points || 0), 0)
          }
        } catch (achievementError) {
          toast.error('Failed to load achievements data')
        }

        // Load session statistics
        let userRank = "-"
        let pollHistoryData: any[] = [] // Store poll history for reuse

        // Calculate Poll Points FIRST using Poll History API (same as Poll History page)
        try {
          const pollHistoryResponse = await apiService.getStudentPollHistory()
          
          if (pollHistoryResponse.data?.data) {
            pollHistoryData = pollHistoryResponse.data.data // Store for reuse
            
            // EXACT same calculation as Poll History page's Total Points card
            const completedSessions = pollHistoryData.filter((session: any) => session.status === "completed")
            pollPoints = completedSessions.reduce((sum: number, session: any) => sum + (session.points || 0), 0)
          }
        } catch (pollPointsError) {
          // Silently handle poll points calculation error
        }

        // Get SessionReports for Peak Time calculation
        let sessionReports: any[] = []
        try {
          const sessionReportsResponse = await apiService.getMyRecentSessions()
          if (sessionReportsResponse.data?.recent) {
            sessionReports = sessionReportsResponse.data.recent
          }
        } catch (sessionReportError) {
          // Silently handle session reports error
        }

        try {
          const sessionsResponse = await apiService.getMyJoinedSessionsCount()
          
          if (sessionsResponse.data) {

          }
        } catch (sessionError) {
          toast.error('Failed to load session statistics')
        }

        // Load leaderboard to get user rank
        try {
          const leaderboardResponse = await apiService.getLeaderboard()
          
          if (leaderboardResponse.data && Array.isArray(leaderboardResponse.data)) {
            // The API returns an array directly, not nested under 'leaderboard'
            const leaderboard = leaderboardResponse.data
            
            const userEntry = leaderboard.find((entry: any) => 
              String(entry.userId) === String(user.id) || String(entry._id) === String(user.id)
            )
            
            if (userEntry) {
              const rank = leaderboard.findIndex((entry: any) => 
                String(entry.userId) === String(user.id) || String(entry._id) === String(user.id)
              ) + 1
              userRank = `#${rank}`
              
              // Note: Accuracy rate not currently displayed in stats
            }
          }
        } catch (leaderboardError) {
          toast.error('Failed to load ranking data')
        }
        
        const combinedPoints = totalPoints + pollPoints
        
        setStats([
          { 
            label: "Achievement Points", 
            value: totalPoints > 0 ? totalPoints.toLocaleString() : "0",
            icon: Award, 
            color: "from-yellow-500 to-orange-500" 
          },
          { 
            label: "Poll Points", 
            value: pollPoints > 0 ? pollPoints.toLocaleString() : "0",
            icon: Star, 
            color: "from-blue-500 to-cyan-500" 
          },
          { 
            label: "Total Points", 
            value: combinedPoints > 0 ? combinedPoints.toLocaleString() : "0",
            icon: Trophy, 
            color: "from-purple-500 to-pink-500" 
          },
          { 
            label: "Current Rank", 
            value: userRank !== "-" ? userRank : "No data", 
            icon: Trophy, 
            color: "from-green-500 to-teal-500" 
          },
        ])

        // Calculate user level based on combined points (every 500 points = 1 level)
        const calculatedLevel = Math.floor(combinedPoints / 500) + 1
        setUserLevel(calculatedLevel)

        // Load poll history for streak and performance calculations
        let bestAnswerStreak = 0
        let avgResponseTime = 0
        let participationStreak = 0
        let currentStreak = 0
        let peakTime = 'No data yet'

        // Reuse poll history data from earlier API call
        if (pollHistoryData.length > 0) {
          
          // Calculate best answer streak from all sessions
          bestAnswerStreak = pollHistoryData.reduce((maxStreak: number, session: any) => {
            const sessionBestStreak = Math.max(session.longestStreak || 0, session.currentStreak || 0)
            return Math.max(maxStreak, sessionBestStreak)
          }, 0)
          
          // Calculate average response time
          const totalResponseTime = pollHistoryData.reduce((sum: number, session: any) => sum + (session.averageTime || 0), 0)
          avgResponseTime = pollHistoryData.length > 0 ? totalResponseTime / pollHistoryData.length : 0
          
          // Calculate participation streak (consecutive days)
          if (pollHistoryData.length > 0) {
            const sessionDates = pollHistoryData
              .map((session: any) => new Date(session.endTime).toDateString())
              .sort()
            
            const uniqueDates = [...new Set(sessionDates)] as string[]
            let consecutiveDays = 1
            let maxConsecutive = 1
            
            for (let i = 1; i < uniqueDates.length; i++) {
              const prevDate = new Date(uniqueDates[i - 1])
              const currDate = new Date(uniqueDates[i])
              const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
              
              if (diffDays === 1) {
                consecutiveDays++
                maxConsecutive = Math.max(maxConsecutive, consecutiveDays)
              } else {
                consecutiveDays = 1
              }
            }
            participationStreak = maxConsecutive
          }

          // Calculate current active streak (consecutive days from most recent activity)
          if (pollHistoryData.length > 0) {
            const sessionDates = pollHistoryData
                .map((session: any) => new Date(session.endTime).toDateString())
              
              const uniqueDatesSet = [...new Set(sessionDates)] as string[]
              const uniqueDates = uniqueDatesSet.sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Sort newest first
              
              if (uniqueDates.length > 0) {
                const today = new Date().toDateString()
                const mostRecentDate = uniqueDates[0]
                
                // Check if user participated today or yesterday to start counting streak
                const daysSinceLastActivity = Math.round(
                  (new Date(today).getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
                )
                
                if (daysSinceLastActivity <= 1) { // If participated today or yesterday
                  currentStreak = 1
                  
                  // Count backwards to find consecutive days
                  for (let i = 1; i < uniqueDates.length; i++) {
                    const prevDate = new Date(uniqueDates[i - 1])
                    const currDate = new Date(uniqueDates[i])
                    const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24))
                    
                    if (diffDays === 1) {
                      currentStreak++
                    } else {
                      break // Break if not consecutive
                    }
                  }
                } else {
                  currentStreak = 0 // No current streak if last activity was more than 1 day ago
                }
              }
          }

          // Calculate peak time (average hour from SessionReport timestamps)
          if (sessionReports.length > 0) {
            const validTimestamps: Date[] = []
            
            // Collect sessionEndedAt timestamps from SessionReports where user participated
            sessionReports.forEach((report: any) => {
              // Use sessionEndedAt as the primary timestamp (when the session was completed)
              const timestamp = report.sessionEndedAt
              
              if (timestamp) {
                try {
                  const sessionDate = new Date(timestamp)
                  if (!isNaN(sessionDate.getTime())) { // Valid date check
                    validTimestamps.push(sessionDate)
                  }
                } catch (error) {
                  // Skip invalid timestamps
                }
              }
            })
            
            // Calculate average hour
            if (validTimestamps.length > 0) {
              const totalHours = validTimestamps.reduce((sum, date) => {
                // Add 5.5 hours for IST timezone conversion (UTC to IST)
                const istOffsetMs = 5.5 * 60 * 60 * 1000
                const istDate = new Date(date.getTime() + istOffsetMs)
                return sum + istDate.getUTCHours()
              }, 0)
              
              const avgHour = Math.round(totalHours / validTimestamps.length)
              
              if (avgHour >= 0 && avgHour < 24) {
                // Format hour in 12-hour format
                const hour12 = avgHour === 0 ? 12 : avgHour > 12 ? avgHour - 12 : avgHour
                const ampm = avgHour < 12 ? 'AM' : 'PM'
                peakTime = `${hour12}:00 ${ampm}`
              } else {
                peakTime = 'Invalid data'
              }
            } else {
              peakTime = 'No valid timestamps'
            }
          } else {
            peakTime = 'No data available'
          }
        }

        // Store streak data for use in Performance Insights
        setStreakData({ bestAnswerStreak, avgResponseTime, participationStreak, currentStreak, peakTime })

      } catch (error: any) {
        console.error('Error loading profile data:', error)
        
        // Show specific error messages
        if (error.response?.status === 404) {
          toast.error('No poll data found. Join some polls to see your statistics!')
        } else if (error.response?.status === 401) {
          toast.error('Please log in again to view your profile')
        } else {
          toast.error('Failed to load profile data. Please try refreshing.')
        }
      } finally {
        setIsLoading(false)
      }
    }

  useEffect(() => {
    loadProfileData()
  }, [user])

  // Helper functions
  const getAchievementIcon = (name: string) => {
    if (!name) return '🏆'
    
    const iconMap: { [key: string]: string } = {
      // Exact name matches
      'Speed Demon': '⚡',
      'Perfect Score': '🎯',
      'Early Bird': '🌅',
      'Streak Master': '🔥',
      'Knowledge Seeker': '📚',
      'Team Player': '🤝',
      'First Steps': '👶',
      'Quick Learner': '🚀',
      'Accuracy Master': '🎯',
      'Participation Champion': '🏅',
      'Consistency King': '👑',
      'Night Owl': '🦉',
      'Morning Person': '🌅',
      'Social Butterfly': '🦋',
    }
    
    // Try exact match first
    if (iconMap[name]) {
      return iconMap[name]
    }
    
    // Try partial matching for similar names
    const lowerName = name.toLowerCase()
    if (lowerName.includes('speed') || lowerName.includes('fast')) return '⚡'
    if (lowerName.includes('perfect') || lowerName.includes('score')) return '🎯'
    if (lowerName.includes('early') || lowerName.includes('bird')) return '🌅'
    if (lowerName.includes('streak') || lowerName.includes('consecutive')) return '🔥'
    if (lowerName.includes('knowledge') || lowerName.includes('learn')) return '📚'
    if (lowerName.includes('team') || lowerName.includes('social')) return '🤝'
    if (lowerName.includes('first') || lowerName.includes('beginner')) return '👶'
    if (lowerName.includes('quick') || lowerName.includes('fast')) return '🚀'
    if (lowerName.includes('accuracy') || lowerName.includes('precise')) return '🎯'
    if (lowerName.includes('participation') || lowerName.includes('active')) return '🏅'
    if (lowerName.includes('consistency') || lowerName.includes('regular')) return '👑'
    if (lowerName.includes('night') || lowerName.includes('owl')) return '🦉'
    if (lowerName.includes('morning') || lowerName.includes('dawn')) return '🌅'
    
    // Default fallback
    return '🏆'
  }



  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

    if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    if (diffInMinutes > 0) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "from-yellow-400 to-yellow-600"
      case "epic":
        return "from-purple-400 to-purple-600"
      case "rare":
        return "from-blue-400 to-blue-600"
      default:
        return "from-gray-400 to-gray-600"
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
                <span className="text-white text-sm font-bold">Level {userLevel}</span>
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
                <span>Student Profile</span>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="p-6 text-center hover:scale-105 transition-all duration-200">
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-r ${stat.color} mx-auto mb-3 flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {isLoading ? (
                <>
                  <div className="h-8 bg-gray-600 rounded mb-1 animate-pulse"></div>
                  <div className="h-4 bg-gray-600 rounded animate-pulse"></div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Performance Insights */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          Performance Insights
        </h3>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="w-8 h-8 bg-gray-600 rounded mb-3"></div>
                  <div className="h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="h-6 bg-gray-600 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Best Streak */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/30"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🔥</span>
                </div>
                <span className="text-orange-300 font-medium">Best Streak</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {streakData.participationStreak > 0 ? `${streakData.participationStreak} days` : 'No streak yet'}
              </div>
              <p className="text-sm text-gray-400 mt-1">Longest participation streak</p>
            </motion.div>

            {/* Current Streak */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg p-4 border border-emerald-500/30"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📅</span>
                </div>
                <span className="text-emerald-300 font-medium">Current Streak</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {streakData.currentStreak > 0 ? `${streakData.currentStreak} days` : 'Start today!'}
              </div>
              <p className="text-sm text-gray-400 mt-1">Active consecutive days</p>
            </motion.div>

            {/* Favorite Time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-lg">⏰</span>
                </div>
                <span className="text-purple-300 font-medium">Peak Time</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {streakData.peakTime}
              </div>
              <p className="text-sm text-gray-400 mt-1">Most active hour (IST)</p>
            </motion.div>

            {/* Total Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <span className="text-yellow-300 font-medium">Badges Earned</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {achievements.filter(a => a.earned).length} / {achievements.length}
              </div>
              <p className="text-sm text-gray-400 mt-1">Achievement progress</p>
            </motion.div>

            {/* Answer Streak */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg p-4 border border-red-500/30"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-lg">⚡</span>
                </div>
                <span className="text-red-300 font-medium">Answer Streak</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {streakData.bestAnswerStreak > 0 ? `${streakData.bestAnswerStreak} correct` : 'No streak yet'}
              </div>
              <p className="text-sm text-gray-400 mt-1">Best consecutive answers</p>
            </motion.div>

            {/* Next Goal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg p-4 border border-indigo-500/30"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🎯</span>
                </div>
                <span className="text-indigo-300 font-medium">Next Goal</span>
              </div>
              <div className="text-sm font-bold text-white">
                {achievements.find(a => !a.earned)?.name || 'All Unlocked!'}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {achievements.find(a => !a.earned)?.description.substring(0, 30) + '...' || 'Amazing work! 🎉'}
              </p>
            </motion.div>
          </div>
        )}
      </GlassCard>
    </div>
  )

  const renderAchievements = () => {
    // Filter to show only earned achievements
    const earnedAchievements = achievements.filter(achievement => achievement.earned)
    
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-6 h-6" />
              Achievement Collection
            </h3>
            <div className="text-sm text-gray-400">
              <span className="text-green-400 font-bold">{earnedAchievements.length}</span> earned
            </div>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <GlassCard className="p-4">
                    <div className="w-16 h-16 rounded-full bg-gray-600 mx-auto mb-3"></div>
                    <div className="h-4 bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded"></div>
                  </GlassCard>
                </div>
              ))}
            </div>
          ) : earnedAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <GlassCard className="p-4 hover:scale-105 transition-all duration-200 cursor-pointer">
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} mx-auto mb-3 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200`}
                    >
                      {achievement.icon}
                    </div>
                    <h4 className="font-bold text-center mb-2 text-white">
                      {achievement.name}
                    </h4>
                    <p className="text-gray-400 text-sm text-center">{achievement.description}</p>
                    <div className="mt-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white capitalize`}
                      >
                        {achievement.rarity}
                      </span>
                      {achievement.earnedDate && (
                        <p className="text-xs text-green-400 mt-2">
                          Earned {formatTimeAgo(achievement.earnedDate)}
                        </p>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No achievements earned yet.</p>
              <p className="text-gray-500 text-sm mt-2">Start participating in polls to unlock achievements!</p>
            </div>
          )}
        </GlassCard>
      </div>
    )
  }

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
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "security", label: "Security", icon: Lock },
  ]

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  // Function to refresh data without page reload
  const handleRefresh = async () => {
    if (!user) return
    
    try {
      // Call the same function that loads data on component mount
      await loadProfileData()
      toast.success('Profile data refreshed successfully!')
    } catch (error) {
      console.error('Error refreshing profile data:', error)
      toast.error('Failed to refresh data')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Student Profile</h1>
        <button
          onClick={handleRefresh}
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
        {activeTab === "achievements" && renderAchievements()}
        {activeTab === "security" && renderSecurity()}
      </motion.div>
    </div>
  )
}

export default StudentProfilePage