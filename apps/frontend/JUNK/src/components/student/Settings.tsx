// // POLL_GENERATION_FRONTEND/src/components/student/Settings.tsx
// "use client"

// import type React from "react"
// import { useState } from "react"
// import {
//   User,
//   Bell,
//   Shield,
//   Palette,
//   Smartphone,
//   Lock,
//   Camera,
//   Save,
//   RefreshCw,
//   Moon,
//   Sun,
//   Monitor,
//   BookOpen,
//   Target,
// } from "lucide-react"
// import GlassCard from "../GlassCard"


// const Settings: React.FC = () => {
//   // Profile Settings
//   const [profileData, setProfileData] = useState({
//     firstName: "John",
//     lastName: "Doe",
//     email: "john.doe@student.edu",
//     bio: "Computer Science student passionate about learning",
//     avatar: "https://imgs.search.brave.com/x5_5ivfXsbQ-qwitDVJyk-aJx6KxpIIi0BgyHXDu8Jg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/ZnJlZS1wc2QvM2Qt/aWxsdXN0cmF0aW9u/LWh1bWFuLWF2YXRh/ci1wcm9maWxlXzIz/LTIxNTA2NzExNDIu/anBnP3NlbXQ9YWlz/X2h5YnJpZCZ3PTc0/MA?height=100&width=100",
//   })

//   // Notification Settings
//   const [notificationSettings, setNotificationSettings] = useState({
//     emailNotifications: true,
//     pushNotifications: true,
//     pollReminders: true,
//     achievementAlerts: true,
//     leaderboardUpdates: false,
//     weeklyReports: true,
//     soundEnabled: true,
//   })

//   // Privacy Settings
//   const [privacySettings, setPrivacySettings] = useState({
//     profileVisibility: "public",
//     showInLeaderboard: true,
//     shareProgress: true,
//     allowDirectMessages: true,
//   })

//   // Appearance Settings
//   const [appearanceSettings, setAppearanceSettings] = useState({
//     theme: "dark",
//     language: "en",
//     fontSize: "medium",
//     reducedMotion: false,
//     highContrast: false,
//   })

//   // Learning Preferences
//   const [learningSettings, setLearningSettings] = useState({
//     difficultyLevel: "intermediate",
//     studyReminders: true,
//     goalTracking: true,
//     progressSharing: true,
//     preferredSubjects: ["Computer Science", "Mathematics"],
//   })

//   const [activeTab, setActiveTab] = useState("profile")
//   const [isSaving, setIsSaving] = useState(false)

//   const tabs = [
//     { id: "profile", label: "Profile", icon: User },
//     { id: "notifications", label: "Notifications", icon: Bell },
//     { id: "privacy", label: "Privacy", icon: Shield },
//     { id: "appearance", label: "Appearance", icon: Palette },
//     { id: "learning", label: "Learning", icon: BookOpen },
//     { id: "security", label: "Security", icon: Lock },
//   ]

//   const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
//   const handleSave = async () => {
//     setIsSaving(true);
//     const token = localStorage.getItem("token");
//     await fetch(`${API_URL}/users/profile`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(profileData),
//     });
//     setIsSaving(false);
//   }

//   const renderProfileSettings = () => (
//     <div className="space-y-6">
//       <GlassCard className="p-6">
//         <div className="flex items-center gap-2 mb-6">
//           <User className="w-5 h-5 text-purple-400" />
//           <h3 className="text-lg font-semibold text-white">Personal Information</h3>
//         </div>

//         <div className="space-y-6">
//           {/* Avatar Section */}
//           <div className="flex items-center gap-6">
//             <div className="relative">
//               <img
//                 src={profileData.avatar || "/placeholder.svg"}
//                 alt="Profile"
//                 className="w-20 h-20 rounded-full border-2 border-purple-500/30"
//               />
//               <button className="absolute -bottom-1 -right-1 p-2 bg-purple-600 rounded-full hover:bg-purple-700 transition-colors">
//                 <Camera className="w-4 h-4 text-white" />
//               </button>
//             </div>
//             <div>
//               <h4 className="text-white font-medium">Profile Picture</h4>
//               <p className="text-gray-400 text-sm">Upload a new profile picture</p>
//             </div>
//           </div>

//           {/* Name Fields */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
//               <input
//                 type="text"
//                 value={profileData.firstName}
//                 onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
//                 className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
//               <input
//                 type="text"
//                 value={profileData.lastName}
//                 onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
//                 className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
//               />
//             </div>
//           </div>

//           {/* Email */}
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
//             <input
//               type="email"
//               value={profileData.email}
//               onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
//               className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
//             />
//           </div>

//           {/* Bio */}
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
//             <textarea
//               value={profileData.bio}
//               onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
//               rows={3}
//               className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none"
//               placeholder="Tell us about yourself..."
//             />
//           </div>
//         </div>
//       </GlassCard>
//     </div>
//   )

//   const renderNotificationSettings = () => (
//     <div className="space-y-6">
//       <GlassCard className="p-6">
//         <div className="flex items-center gap-2 mb-6">
//           <Bell className="w-5 h-5 text-purple-400" />
//           <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
//         </div>

//         <div className="space-y-4">
//           {[
//             { key: "emailNotifications", label: "Email Notifications", desc: "Receive notifications via email" },
//             { key: "pushNotifications", label: "Push Notifications", desc: "Browser push notifications" },
//             { key: "pollReminders", label: "Poll Reminders", desc: "Get reminded about active polls" },
//             { key: "achievementAlerts", label: "Achievement Alerts", desc: "Notifications for new achievements" },
//             { key: "leaderboardUpdates", label: "Leaderboard Updates", desc: "Updates when your ranking changes" },
//             { key: "weeklyReports", label: "Weekly Reports", desc: "Weekly progress summaries" },
//             { key: "soundEnabled", label: "Sound Effects", desc: "Play sounds for notifications" },
//           ].map((setting) => (
//             <div key={setting.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
//               <div>
//                 <h4 className="text-white font-medium">{setting.label}</h4>
//                 <p className="text-gray-400 text-sm">{setting.desc}</p>
//               </div>
//               <label className="relative inline-flex items-center cursor-pointer">
//                 <input
//                   type="checkbox"
//                   checked={notificationSettings[setting.key as keyof typeof notificationSettings]}
//                   onChange={(e) =>
//                     setNotificationSettings({
//                       ...notificationSettings,
//                       [setting.key]: e.target.checked,
//                     })
//                   }
//                   className="sr-only peer"
//                 />
//                 <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
//               </label>
//             </div>
//           ))}
//         </div>
//       </GlassCard>
//     </div>
//   )

//   const renderPrivacySettings = () => (
//     <div className="space-y-6">
//       <GlassCard className="p-6">
//         <div className="flex items-center gap-2 mb-6">
//           <Shield className="w-5 h-5 text-purple-400" />
//           <h3 className="text-lg font-semibold text-white">Privacy Settings</h3>
//         </div>

//         <div className="space-y-6">
//           {/* Profile Visibility */}
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">Profile Visibility</label>
//             <select
//               value={privacySettings.profileVisibility}
//               onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
//               className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
//             >
//               <option value="public" className="bg-gray-800">
//                 Public
//               </option>
//               <option value="friends" className="bg-gray-800">
//                 Friends Only
//               </option>
//               <option value="private" className="bg-gray-800">
//                 Private
//               </option>
//             </select>
//           </div>

//           {/* Privacy Toggles */}
//           {[
//             {
//               key: "showInLeaderboard",
//               label: "Show in Leaderboard",
//               desc: "Display your name on public leaderboards",
//             },
//             { key: "shareProgress", label: "Share Progress", desc: "Allow others to see your learning progress" },
//             { key: "allowDirectMessages", label: "Allow Direct Messages", desc: "Let other students message you" },
//           ].map((setting) => (
//             <div key={setting.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
//               <div>
//                 <h4 className="text-white font-medium">{setting.label}</h4>
//                 <p className="text-gray-400 text-sm">{setting.desc}</p>
//               </div>
//               <label className="relative inline-flex items-center cursor-pointer">
//                 <input
//                   type="checkbox"
//                   checked={privacySettings[setting.key as keyof typeof privacySettings]}
//                   onChange={(e) =>
//                     setPrivacySettings({
//                       ...privacySettings,
//                       [setting.key]: e.target.checked,
//                     })
//                   }
//                   className="sr-only peer"
//                 />
//                 <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
//               </label>
//             </div>
//           ))}
//         </div>
//       </GlassCard>
//     </div>
//   )

//   const renderAppearanceSettings = () => (
//     <div className="space-y-6">
//       <GlassCard className="p-6">
//         <div className="flex items-center gap-2 mb-6">
//           <Palette className="w-5 h-5 text-purple-400" />
//           <h3 className="text-lg font-semibold text-white">Appearance & Accessibility</h3>
//         </div>

//         <div className="space-y-6">
//           {/* Theme Selection */}
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-3">Theme</label>
//             <div className="grid grid-cols-3 gap-3">
//               {[
//                 { value: "dark", label: "Dark", icon: Moon },
//                 { value: "light", label: "Light", icon: Sun },
//                 { value: "auto", label: "Auto", icon: Monitor },
//               ].map((theme) => {
//                 const Icon = theme.icon
//                 return (
//                   <button
//                     key={theme.value}
//                     onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: theme.value })}
//                     className={`p-4 rounded-lg border-2 transition-all duration-200 ${
//                       appearanceSettings.theme === theme.value
//                         ? "border-purple-500 bg-purple-500/20"
//                         : "border-white/10 bg-white/5 hover:bg-white/10"
//                     }`}
//                   >
//                     <Icon className="w-6 h-6 text-white mx-auto mb-2" />
//                     <span className="text-white text-sm">{theme.label}</span>
//                   </button>
//                 )
//               })}
//             </div>
//           </div>

//           {/* Language */}
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
//             <select
//               value={appearanceSettings.language}
//               onChange={(e) => setAppearanceSettings({ ...appearanceSettings, language: e.target.value })}
//               className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
//             >
//               <option value="en" className="bg-gray-800">
//                 English
//               </option>
//               <option value="es" className="bg-gray-800">
//                 Spanish
//               </option>
//               <option value="fr" className="bg-gray-800">
//                 French
//               </option>
//               <option value="de" className="bg-gray-800">
//                 German
//               </option>
//             </select>
//           </div>

//           {/* Font Size */}
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">Font Size</label>
//             <select
//               value={appearanceSettings.fontSize}
//               onChange={(e) => setAppearanceSettings({ ...appearanceSettings, fontSize: e.target.value })}
//               className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
//             >
//               <option value="small" className="bg-gray-800">
//                 Small
//               </option>
//               <option value="medium" className="bg-gray-800">
//                 Medium
//               </option>
//               <option value="large" className="bg-gray-800">
//                 Large
//               </option>
//             </select>
//           </div>

//           {/* Accessibility Options */}
//           {[
//             { key: "reducedMotion", label: "Reduced Motion", desc: "Minimize animations and transitions" },
//             { key: "highContrast", label: "High Contrast", desc: "Increase contrast for better visibility" },
//           ].map((setting) => (
//             <div key={setting.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
//               <div>
//                 <h4 className="text-white font-medium">{setting.label}</h4>
//                 <p className="text-gray-400 text-sm">{setting.desc}</p>
//               </div>
//               <label className="relative inline-flex items-center cursor-pointer">
//                 <input
//                   type="checkbox"
//                   checked={appearanceSettings[setting.key as keyof typeof appearanceSettings]}
//                   onChange={(e) =>
//                     setAppearanceSettings({
//                       ...appearanceSettings,
//                       [setting.key]: e.target.checked,
//                     })
//                   }
//                   className="sr-only peer"
//                 />
//                 <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
//               </label>
//             </div>
//           ))}
//         </div>
//       </GlassCard>
//     </div>
//   )

//   const renderLearningSettings = () => (
//     <div className="space-y-6">
//       <GlassCard className="p-6">
//         <div className="flex items-center gap-2 mb-6">
//           <BookOpen className="w-5 h-5 text-purple-400" />
//           <h3 className="text-lg font-semibold text-white">Learning Preferences</h3>
//         </div>

//         <div className="space-y-6">
//           {/* Difficulty Level */}
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-3">Preferred Difficulty Level</label>
//             <div className="grid grid-cols-3 gap-3">
//               {[
//                 { value: "beginner", label: "Beginner", color: "green" },
//                 { value: "intermediate", label: "Intermediate", color: "yellow" },
//                 { value: "advanced", label: "Advanced", color: "red" },
//               ].map((level) => (
//                 <button
//                   key={level.value}
//                   onClick={() => setLearningSettings({ ...learningSettings, difficultyLevel: level.value })}
//                   className={`p-3 rounded-lg border-2 transition-all duration-200 ${
//                     learningSettings.difficultyLevel === level.value
//                       ? "border-purple-500 bg-purple-500/20"
//                       : "border-white/10 bg-white/5 hover:bg-white/10"
//                   }`}
//                 >
//                   <Target className="w-5 h-5 text-white mx-auto mb-1" />
//                   <span className="text-white text-sm">{level.label}</span>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Learning Toggles */}
//           {[
//             { key: "studyReminders", label: "Study Reminders", desc: "Get reminded to participate in polls" },
//             { key: "goalTracking", label: "Goal Tracking", desc: "Track your learning goals and progress" },
//             { key: "progressSharing", label: "Progress Sharing", desc: "Share achievements with classmates" },
//           ].map((setting) => (
//             <div key={setting.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
//               <div>
//                 <h4 className="text-white font-medium">{setting.label}</h4>
//                 <p className="text-gray-400 text-sm">{setting.desc}</p>
//               </div>
//               <label className="relative inline-flex items-center cursor-pointer">
//                 <input
//                   type="checkbox"
//                   checked={learningSettings[setting.key as keyof typeof learningSettings]}
//                   onChange={(e) =>
//                     setLearningSettings({
//                       ...learningSettings,
//                       [setting.key]: e.target.checked,
//                     })
//                   }
//                   className="sr-only peer"
//                 />
//                 <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
//               </label>
//             </div>
//           ))}
//         </div>
//       </GlassCard>
//     </div>
//   )

//   const renderSecuritySettings = () => (
//     <div className="space-y-6">
//       <GlassCard className="p-6">
//         <div className="flex items-center gap-2 mb-6">
//           <Lock className="w-5 h-5 text-purple-400" />
//           <h3 className="text-lg font-semibold text-white">Account Security</h3>
//         </div>

//         <div className="space-y-4">
//           <button className="w-full p-4 bg-white/5 rounded-lg text-left hover:bg-white/10 transition-colors">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h4 className="text-white font-medium">Change Password</h4>
//                 <p className="text-gray-400 text-sm">Update your account password</p>
//               </div>
//               <Lock className="w-5 h-5 text-gray-400" />
//             </div>
//           </button>

//           <button className="w-full p-4 bg-white/5 rounded-lg text-left hover:bg-white/10 transition-colors">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h4 className="text-white font-medium">Two-Factor Authentication</h4>
//                 <p className="text-gray-400 text-sm">Add an extra layer of security</p>
//               </div>
//               <Shield className="w-5 h-5 text-gray-400" />
//             </div>
//           </button>

//           <button className="w-full p-4 bg-white/5 rounded-lg text-left hover:bg-white/10 transition-colors">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h4 className="text-white font-medium">Active Sessions</h4>
//                 <p className="text-gray-400 text-sm">Manage your active login sessions</p>
//               </div>
//               <Smartphone className="w-5 h-5 text-gray-400" />
//             </div>
//           </button>

//           <button className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left hover:bg-red-500/20 transition-colors">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h4 className="text-red-400 font-medium">Delete Account</h4>
//                 <p className="text-gray-400 text-sm">Permanently delete your account and data</p>
//               </div>
//               <RefreshCw className="w-5 h-5 text-red-400" />
//             </div>
//           </button>
//         </div>
//       </GlassCard>
//     </div>
//   )

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case "profile":
//         return renderProfileSettings()
//       case "notifications":
//         return renderNotificationSettings()
//       case "privacy":
//         return renderPrivacySettings()
//       case "appearance":
//         return renderAppearanceSettings()
//       case "learning":
//         return renderLearningSettings()
//       case "security":
//         return renderSecuritySettings()
//       default:
//         return renderProfileSettings()
//     }
//   }

//   return (
//     <div className="p-8 space-y-8">
//       {/* Header */}
//       <div className="text-center space-y-4">
//         <div className="flex items-center justify-center gap-3">
//           <User className="w-8 h-8 text-purple-400" />
//           <h1 className="text-3xl font-bold text-white">Settings</h1>
//         </div>
//         <p className="text-gray-400">Customize your learning experience and account preferences</p>
//       </div>

//       {/* Tabs */}
//       <div className="flex flex-wrap justify-center gap-2">
//         {tabs.map((tab) => {
//           const Icon = tab.icon
//           return (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
//                 activeTab === tab.id
//                   ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
//                   : "bg-white/10 text-gray-300 hover:bg-white/20"
//               }`}
//             >
//               <Icon className="w-4 h-4" />
//               <span className="hidden sm:inline">{tab.label}</span>
//             </button>
//           )
//         })}
//       </div>

//       {/* Tab Content */}
//       <div className="max-w-4xl mx-auto">{renderTabContent()}</div>

//       {/* Save Button */}
//       <div className="flex justify-center">
//         <button
//           onClick={handleSave}
//           disabled={isSaving}
//           className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {isSaving ? (
//             <>
//               <RefreshCw className="w-5 h-5 animate-spin" />
//               Saving...
//             </>
//           ) : (
//             <>
//               <Save className="w-5 h-5" />
//               Save Changes
//             </>
//           )}
//         </button>
//       </div>
//     </div>
//   )
// }

// export default Settings


// src/pages/Settings.tsx
"use client"
import React, { useState, useEffect,  useRef } from "react"
import type { ChangeEvent } from "react"
import { User, Bell, Shield, Palette, Lock, Camera, Save, BookOpen, Trash2, Edit, X, RefreshCw } from "lucide-react"
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import GlassCard from "../GlassCard";

import { useAuth } from "../../contexts/AuthContext";
import 'sweetalert2/dist/sweetalert2.min.css';
import Swal from 'sweetalert2';
// --- Sub-component for Profile Information ---
const ProfileSettings: React.FC = () => {
    const { user, updateUser } = useAuth();
    const api = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const [profileData, setProfileData] = useState({ fullName: '', bio: '', avatar: '' });
    const [originalProfile, setOriginalProfile] = useState({ fullName: '', bio: '', avatar: '' });
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
             try {
                const response = await fetch(`${api}/users/profile`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (!response.ok) throw new Error('Failed to fetch profile');
                const data = await response.json();
                const initialData = {
                    fullName: data.fullName || '',
                    bio: data.bio || '',
                    avatar: data.avatar || 'https://res.cloudinary.com/demo/image/upload/w_100,h_100,c_thumb,g_face,r_max/face_left.png'
                };
                setProfileData(initialData);
                setOriginalProfile(initialData);
            } catch (error) {
                toast.error('Could not load profile data.');
            }
        };
        fetchProfile();
    }, [api]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCancelEdit = () => {
        setProfileData(originalProfile);
        setIsEditing(false);
    };

    const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
         if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('avatar', file);
            
            const uploadToast = toast.loading('Uploading...');
            try {
                const response = await fetch(`${api}/users/profile/avatar`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    body: formData,
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                
                const newAvatarUrl = data.avatar;
                setProfileData(prev => ({ ...prev, avatar: newAvatarUrl }));
                setOriginalProfile(prev => ({...prev, avatar: newAvatarUrl }));
                updateUser({ avatar: newAvatarUrl });
                toast.success('Avatar updated!', { id: uploadToast });
            } catch (error: any) {
                toast.error(error.message || 'Upload failed.', { id: uploadToast });
            }
        }
    };
    
    const handleSave = async () => {
        const saveToast = toast.loading('Saving profile...');
        try {
            const response = await fetch(`${api}/users/profile`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName: profileData.fullName, bio: profileData.bio })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            updateUser({ fullName: data.user.fullName, bio: data.user.bio });
            setOriginalProfile(profileData);
            toast.success('Profile saved!', { id: saveToast });
            setIsEditing(false);
        } catch (error: any) {
            toast.error(error.message || 'Save failed.', { id: saveToast });
        }
    };

    return (
        <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-semibold text-white flex items-center gap-2"><User /> Personal Information</h3>
                 {isEditing ? (
                    <div className="flex gap-2">
                        <button onClick={handleCancelEdit} className="btn-secondary text-sm"><X className="w-4 h-4 mr-1"/>Cancel</button>
                        <button onClick={handleSave} className="btn-primary text-sm"><Save className="w-4 h-4 mr-1"/>Save Profile</button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm"><Edit className="w-4 h-4 mr-1"/>Edit</button>
                )}
            </div>
            <div className="space-y-6">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <img src={profileData.avatar} alt="Profile" className="w-20 h-20 rounded-full border-2 border-purple-500/30 object-cover"/>
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*"/>
                        <button onClick={() => fileInputRef.current?.click()} disabled={!isEditing} className="absolute -bottom-1 -right-1 p-2 bg-purple-600 rounded-full hover:bg-purple-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                            <Camera className="w-4 h-4 text-white"/>
                        </button>
                    </div>
                    <div>
                        <h4 className="text-white font-medium">Profile Picture</h4>
                        <p className="text-gray-400 text-sm">Click the camera to upload</p>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <input name="fullName" value={profileData.fullName} onChange={handleChange} disabled={!isEditing} className="glass-input w-full"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <input value={user?.email || ''} disabled className="glass-input w-full opacity-60 cursor-not-allowed"/>
                </div>
                <div>
                    <label className="block text-sm text-gray-300 mb-2">Bio</label>
                    <textarea name="bio" rows={3} value={profileData.bio} onChange={handleChange} disabled={!isEditing} className="glass-input w-full resize-none" placeholder="Tell us about yourself…"/>
                </div>
            </div>
        </GlassCard>
    );
};

// --- NEWLY IMPLEMENTED Security Settings Sub-component ---
const SecuritySettings = () => {
    const api = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletePassword, setDeletePassword] = useState(''); // Separate state for delete confirmation password

    const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            return toast.error("New passwords do not match.");
        }
        
        const pwdToast = toast.loading('Changing password...');
        try {
            const response = await fetch(`${api}/users/change-password`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            // toast.success('Password changed successfully!', { id: pwdToast });
            // alert('Your password has been updated successfully.'); // Pop-up alert
            Swal.fire({
              title: 'Success!',
              text: 'Your password has been updated successfully.',
              icon: 'success',
              confirmButtonText: 'OK',
              background: '#f0f0f0',
              backdrop: `
                rgba(0,0,0,0.4)
                left top
                no-repeat
              `
            });
            
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (error: any) {
            toast.error(error.message || 'Failed to change password.', { id: pwdToast });
        }
    };
    
    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return toast.error('Please type DELETE to confirm.');
        if (!deletePassword) return toast.error('Please enter your current password to confirm deletion.');
        
        const delToast = toast.loading('Deleting account...');
        try {
            const response = await fetch(`${api}/users/delete-account`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: deletePassword }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            toast.success('Account deleted. Logging out...', { id: delToast, duration: 4000 });
            setTimeout(() => {
                logout();
                navigate('/login');
            }, 2000);
        } catch (error: any) {
             toast.error(error.message || 'Deletion failed.', { id: delToast });
        }
    };

    return (
        <div className="space-y-6">
            <GlassCard>
                <form onSubmit={handlePasswordChangeSubmit} className="p-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6"><Lock /> Change Password</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                            <input type="password" required value={passwordData.currentPassword} onChange={(e) => setPasswordData(p => ({...p, currentPassword: e.target.value}))} className="glass-input w-full"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                            <input type="password" required value={passwordData.newPassword} onChange={(e) => setPasswordData(p => ({...p, newPassword: e.target.value}))} className="glass-input w-full"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                            <input type="password" required value={passwordData.confirmNewPassword} onChange={(e) => setPasswordData(p => ({...p, confirmNewPassword: e.target.value}))} className="glass-input w-full"/>
                        </div>
                        <div className="text-right">
                           <button type="submit" className="btn-primary">Update Password</button>
                        </div>
                    </div>
                </form>
            </GlassCard>
            
            <GlassCard>
                 <div className="p-6 border-t-2 border-red-500/30">
                    <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-4"><Trash2 /> Delete Account</h3>
                    <p className="text-gray-400 text-sm mb-4">This action is permanent and cannot be undone.</p>
                    <div className="flex flex-col md:flex-row gap-4">
                        <input type="text" placeholder='Type "DELETE" to confirm' value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className="glass-input flex-1"/>
                        <input type="password" placeholder="Enter current password to confirm" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} className="glass-input flex-1"/>
                        <button onClick={handleDeleteAccount} className="btn-danger w-full md:w-auto">Delete My Account</button>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

// Main Settings Component - The "Shell"
const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false); // Can be used for other tabs

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "learning", label: "Learning", icon: BookOpen },
  ];
  
  // Dummy save function for non-profile/security tabs
  const handleGeneralSave = () => {
    setIsSaving(true);
    toast.loading("Saving settings...");
    setTimeout(() => {
        setIsSaving(false);
        toast.success("Settings saved!");
    }, 1000);
  };
  
  // Static placeholder components for other tabs
  const renderStaticTabContent = (label: string) => (
      <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white">{label} Settings</h3>
          <p className="text-gray-400 mt-2">This feature is not yet implemented.</p>
      </GlassCard>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile": return <ProfileSettings />;
      case "security": return <SecuritySettings />;
      case "notifications": return renderStaticTabContent("Notifications");
      case "privacy": return renderStaticTabContent("Privacy");
      case "appearance": return renderStaticTabContent("Appearance");
      case "learning": return renderStaticTabContent("Learning");
      default: return <ProfileSettings />;
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your account & preferences</p>
      </header>

      <nav className="flex flex-wrap justify-center gap-2 border-b border-white/10 pb-4">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-white/10"
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div className="max-w-4xl mx-auto">{renderTabContent()}</div>
      
       {/* General Save button for non-functional tabs */}
       {activeTab !== 'profile' && activeTab !== 'security' && (
           <div className="flex justify-center">
                <button
                onClick={handleGeneralSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
                </button>
            </div>
       )}
    </div>
  )
}

export default SettingsPage;