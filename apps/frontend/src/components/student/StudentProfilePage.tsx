// / apps/frontend/src/components/student/StudentProfilePage.tsx
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  User,
  Star,
  Trophy,
  Target,
  Users,
  Crown,
  School,
  GraduationCap,
  MapPin,
  Edit3,
  Camera,
  Save,
  X,
  Award,
  TrendingUp,
  Clock,
  Settings,
  Bell,
  Palette,
  Shield,
} from "lucide-react"
import GlassCard from "../GlassCard"

const StudentProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [profileData, setProfileData] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@student.edu",
    phone: "+1 (555) 123-4567",
    school: "Tech University",
    grade: "Junior",
    major: "Computer Science",
    graduationYear: "2025",
    location: "San Francisco, CA",
    bio: "Passionate about technology and learning. Love participating in interactive polls and quizzes!",
  })

  const stats = [
    { label: "Total Points", value: "2,847", icon: Star, color: "from-yellow-500 to-orange-500" },
    { label: "Current Rank", value: "#7", icon: Trophy, color: "from-purple-500 to-pink-500" },
    { label: "Accuracy Rate", value: "87.3%", icon: Target, color: "from-green-500 to-teal-500" },
    { label: "Polls Joined", value: "47", icon: Users, color: "from-blue-500 to-cyan-500" },
  ]

  const achievements = [
    { name: "Speed Demon", icon: "⚡", rarity: "legendary", description: "Answer 10 questions in under 5 seconds" },
    { name: "Perfect Score", icon: "🎯", rarity: "epic", description: "Get 100% on 5 consecutive polls" },
    { name: "Early Bird", icon: "🌅", rarity: "rare", description: "Join 10 polls within first minute" },
    { name: "Streak Master", icon: "🔥", rarity: "epic", description: "Maintain 15-day participation streak" },
    { name: "Knowledge Seeker", icon: "📚", rarity: "rare", description: "Participate in 25+ polls" },
    { name: "Team Player", icon: "🤝", rarity: "common", description: "Help 5 classmates in study groups" },
  ]

  const recentActivities = [
    { action: "Completed JavaScript Fundamentals Poll", time: "2 minutes ago", points: "+50", type: "success" },
    { action: "Achieved Speed Demon badge", time: "1 hour ago", points: "+100", type: "achievement" },
    { action: "Joined React Hooks Quiz", time: "3 hours ago", points: "+25", type: "participation" },
    { action: "Ranked up to #7 position", time: "1 day ago", points: "Rank ↗️", type: "rank" },
    { action: "Completed Data Structures Poll", time: "2 days ago", points: "+75", type: "success" },
  ]

  const subjectPerformance = [
    { subject: "Programming", score: 92, icon: "💻", color: "from-blue-500 to-purple-500" },
    { subject: "Mathematics", score: 85, icon: "🔢", color: "from-green-500 to-teal-500" },
    { subject: "Science", score: 78, icon: "🧪", color: "from-red-500 to-pink-500" },
    { subject: "History", score: 88, icon: "📜", color: "from-yellow-500 to-orange-500" },
    { subject: "Literature", score: 82, icon: "📖", color: "from-purple-500 to-indigo-500" },
  ]

  const handleSave = () => {
    setIsEditing(false)
    // Here you would typically save to backend
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅"
      case "achievement":
        return "🏆"
      case "participation":
        return "📝"
      case "rank":
        return "📈"
      default:
        return "📌"
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
              <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center">
                <User className="w-16 h-16 text-white" />
              </div>
            </div>
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-dark-800 animate-pulse"></div>
            <button className="absolute bottom-0 right-4 bg-white/10 backdrop-blur-xl rounded-full p-2 hover:bg-white/20 transition-all duration-200">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{profileData.name}</h1>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-full">
                <span className="text-white text-sm font-bold">Level 15</span>
              </div>
            </div>
            <p className="text-gray-400 mb-4">{profileData.bio}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4" />
                <span>{profileData.school}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                <span>{profileData.major}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{profileData.location}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
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
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Subject Performance */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Subject Performance
        </h3>
        <div className="space-y-4">
          {subjectPerformance.map((subject, index) => (
            <motion.div
              key={subject.subject}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-r ${subject.color} flex items-center justify-center text-lg`}
              >
                {subject.icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-medium">{subject.subject}</span>
                  <span className="text-gray-400">{subject.score}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full bg-gradient-to-r ${subject.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.score}%` }}
                    transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  )

  const renderAchievements = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Award className="w-6 h-6" />
          Achievement Collection
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => (
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
                <h4 className="text-white font-bold text-center mb-2">{achievement.name}</h4>
                <p className="text-gray-400 text-sm text-center">{achievement.description}</p>
                <div className="mt-3 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white capitalize`}
                  >
                    {achievement.rarity}
                  </span>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  )

  const renderActivity = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Recent Activity
        </h3>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200"
            >
              <div className="text-2xl">{getActivityIcon(activity.type)}</div>
              <div className="flex-1">
                <p className="text-white font-medium">{activity.action}</p>
                <p className="text-gray-400 text-sm">{activity.time}</p>
              </div>
              <div className="text-green-400 font-medium">{activity.points}</div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      {isEditing ? (
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Edit3 className="w-6 h-6" />
              Edit Profile
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">School</label>
              <input
                type="text"
                value={profileData.school}
                onChange={(e) => setProfileData({ ...profileData, school: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Major</label>
              <input
                type="text"
                value={profileData.major}
                onChange={(e) => setProfileData({ ...profileData, major: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Location</label>
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2">Bio</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Account Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Notifications</p>
                  <p className="text-gray-400 text-sm">Manage your notification preferences</p>
                </div>
              </div>
              <button className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 px-4 py-2 rounded-lg text-white text-sm transition-all duration-200">
                Configure
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Privacy</p>
                  <p className="text-gray-400 text-sm">Control your privacy settings</p>
                </div>
              </div>
              <button className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 px-4 py-2 rounded-lg text-white text-sm transition-all duration-200">
                Manage
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Theme</p>
                  <p className="text-gray-400 text-sm">Customize your appearance</p>
                </div>
              </div>
              <button className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 px-4 py-2 rounded-lg text-white text-sm transition-all duration-200">
                Change
              </button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "activity", label: "Activity", icon: Clock },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Student Profile</h1>
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
        {activeTab === "activity" && renderActivity()}
        {activeTab === "settings" && renderSettings()}
      </motion.div>
    </div>
  )
}

export default StudentProfilePage
