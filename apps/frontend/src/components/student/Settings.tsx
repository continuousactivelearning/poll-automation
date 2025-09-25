"use client"

import type React from "react";
import { useState } from "react";
import { useAuth } from "../../contexts/useAuth";
import { useEffect } from "react";

import {
  User,
  Bell,
  Shield,
  Palette,
  Smartphone,
  Lock,
  Camera,
  Save,
  RefreshCw,
  Moon,
  Sun,
  Monitor,
  BookOpen,
  Target,
} from "lucide-react"
import GlassCard from "../GlassCard"


const Settings: React.FC = () => {
  // Profile Settings
  const { user, updateUser } = useAuth();

const [profileData, setProfileData] = useState({
  firstName: "",
  lastName: "",
  email: "",
  bio: "",
  avatar: "",
});

useEffect(() => {
  if (user) {
    const [first, ...rest] = user.fullName?.split(" ") || ["", ""];
    setProfileData({
      firstName: user.firstName || first || "",
      lastName: user.lastName || rest.join(" ") || "",
      email: user.email || "",
      bio: user.bio || profileData.bio,
      avatar: user.avatar || "https://via.placeholder.com/100",
    });
  }
}, [user]);

  

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    pollReminders: true,
    achievementAlerts: true,
    leaderboardUpdates: false,
    weeklyReports: true,
    soundEnabled: true,
  })

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showInLeaderboard: true,
    shareProgress: true,
    allowDirectMessages: true,
  })

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "dark",
    language: "en",
    fontSize: "medium",
    reducedMotion: false,
    highContrast: false,
  })

  // Learning Preferences
  const [learningSettings, setLearningSettings] = useState({
    difficultyLevel: "intermediate",
    studyReminders: true,
    goalTracking: true,
    progressSharing: true,
    preferredSubjects: ["Computer Science", "Mathematics"],
  })

  const [activeTab, setActiveTab] = useState("profile")
  const [isSaving, setIsSaving] = useState(false)

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "learning", label: "Learning", icon: BookOpen },
    { id: "security", label: "Security", icon: Lock },
  ]

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append("avatar", file);
  
    try {
      const res = await fetch(`${API_URL}/users/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
  
      if (!res.ok) {
        throw new Error("Failed to upload avatar");
      }
  
      const data = await res.json();
      setProfileData((prev) => ({ ...prev, avatar: data.avatar }));
    } catch (error) {
      console.error("Avatar upload failed", error);
    }
  };
  

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
      await updateUser({
        fullName,
        email: profileData.email,
        bio: profileData.bio,
        avatar: profileData.avatar,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
    setIsSaving(false);
  };
  


  const renderProfileSettings = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Personal Information</h3>
        </div>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
  <div className="relative w-20 h-20">
    <img
      src={profileData.avatar || "/placeholder.svg"}
      alt="Profile"
      className="w-20 h-20 rounded-full border-2 border-purple-500/30 object-cover"
    />
    <label className="absolute -bottom-1 -right-1 p-2 bg-purple-600 rounded-full hover:bg-purple-700 transition-colors cursor-pointer">
      <Camera className="w-4 h-4 text-white" />
      <input
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </label>
  </div>
  <div>
    <h4 className="text-white font-medium">Profile Picture</h4>
    <p className="text-gray-400 text-sm">Upload a new profile picture</p>
  </div>
</div>


          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>
      </GlassCard>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
        </div>

        <div className="space-y-4">
          {[
            { key: "emailNotifications", label: "Email Notifications", desc: "Receive notifications via email" },
            { key: "pushNotifications", label: "Push Notifications", desc: "Browser push notifications" },
            { key: "pollReminders", label: "Poll Reminders", desc: "Get reminded about active polls" },
            { key: "achievementAlerts", label: "Achievement Alerts", desc: "Notifications for new achievements" },
            { key: "leaderboardUpdates", label: "Leaderboard Updates", desc: "Updates when your ranking changes" },
            { key: "weeklyReports", label: "Weekly Reports", desc: "Weekly progress summaries" },
            { key: "soundEnabled", label: "Sound Effects", desc: "Play sounds for notifications" },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <h4 className="text-white font-medium">{setting.label}</h4>
                <p className="text-gray-400 text-sm">{setting.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings[setting.key as keyof typeof notificationSettings]}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      [setting.key]: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Privacy Settings</h3>
        </div>

        <div className="space-y-6">
          {/* Profile Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Profile Visibility</label>
            <select
              value={privacySettings.profileVisibility}
              onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
            >
              <option value="public" className="bg-gray-800">
                Public
              </option>
              <option value="friends" className="bg-gray-800">
                Friends Only
              </option>
              <option value="private" className="bg-gray-800">
                Private
              </option>
            </select>
          </div>

          {/* Privacy Toggles */}
          {[
            {
              key: "showInLeaderboard",
              label: "Show in Leaderboard",
              desc: "Display your name on public leaderboards",
            },
            { key: "shareProgress", label: "Share Progress", desc: "Allow others to see your learning progress" },
            { key: "allowDirectMessages", label: "Allow Direct Messages", desc: "Let other students message you" },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <h4 className="text-white font-medium">{setting.label}</h4>
                <p className="text-gray-400 text-sm">{setting.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeof privacySettings[setting.key as keyof typeof privacySettings] === "boolean" ? privacySettings[setting.key as keyof typeof privacySettings] as boolean : false}
                  onChange={(e) =>
                    setPrivacySettings({
                      ...privacySettings,
                      [setting.key]: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Palette className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Appearance & Accessibility</h3>
        </div>

        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "dark", label: "Dark", icon: Moon },
                { value: "light", label: "Light", icon: Sun },
                { value: "auto", label: "Auto", icon: Monitor },
              ].map((theme) => {
                const Icon = theme.icon
                return (
                  <button
                    key={theme.value}
                    onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: theme.value })}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      appearanceSettings.theme === theme.value
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-6 h-6 text-white mx-auto mb-2" />
                    <span className="text-white text-sm">{theme.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
            <select
              value={appearanceSettings.language}
              onChange={(e) => setAppearanceSettings({ ...appearanceSettings, language: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
            >
              <option value="en" className="bg-gray-800">
                English
              </option>
              <option value="es" className="bg-gray-800">
                Spanish
              </option>
              <option value="fr" className="bg-gray-800">
                French
              </option>
              <option value="de" className="bg-gray-800">
                German
              </option>
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Font Size</label>
            <select
              value={appearanceSettings.fontSize}
              onChange={(e) => setAppearanceSettings({ ...appearanceSettings, fontSize: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
            >
              <option value="small" className="bg-gray-800">
                Small
              </option>
              <option value="medium" className="bg-gray-800">
                Medium
              </option>
              <option value="large" className="bg-gray-800">
                Large
              </option>
            </select>
          </div>

          {/* Accessibility Options */}
          {[
            { key: "reducedMotion", label: "Reduced Motion", desc: "Minimize animations and transitions" },
            { key: "highContrast", label: "High Contrast", desc: "Increase contrast for better visibility" },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <h4 className="text-white font-medium">{setting.label}</h4>
                <p className="text-gray-400 text-sm">{setting.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeof appearanceSettings[setting.key as keyof typeof appearanceSettings] === "boolean" ? appearanceSettings[setting.key as keyof typeof appearanceSettings] as boolean : false}
                  onChange={(e) =>
                    setAppearanceSettings({
                      ...appearanceSettings,
                      [setting.key]: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )

  const renderLearningSettings = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Learning Preferences</h3>
        </div>

        <div className="space-y-6">
          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Preferred Difficulty Level</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "beginner", label: "Beginner", color: "green" },
                { value: "intermediate", label: "Intermediate", color: "yellow" },
                { value: "advanced", label: "Advanced", color: "red" },
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => setLearningSettings({ ...learningSettings, difficultyLevel: level.value })}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    learningSettings.difficultyLevel === level.value
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <Target className="w-5 h-5 text-white mx-auto mb-1" />
                  <span className="text-white text-sm">{level.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Learning Toggles */}
          {[
            { key: "studyReminders", label: "Study Reminders", desc: "Get reminded to participate in polls" },
            { key: "goalTracking", label: "Goal Tracking", desc: "Track your learning goals and progress" },
            { key: "progressSharing", label: "Progress Sharing", desc: "Share achievements with classmates" },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <h4 className="text-white font-medium">{setting.label}</h4>
                <p className="text-gray-400 text-sm">{setting.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeof learningSettings[setting.key as keyof typeof learningSettings] === "boolean" ? learningSettings[setting.key as keyof typeof learningSettings] as boolean : false}
                  onChange={(e) =>
                    setLearningSettings({
                      ...learningSettings,
                      [setting.key]: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Account Security</h3>
        </div>

        <div className="space-y-4">
          <button className="w-full p-4 bg-white/5 rounded-lg text-left hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Change Password</h4>
                <p className="text-gray-400 text-sm">Update your account password</p>
              </div>
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          <button className="w-full p-4 bg-white/5 rounded-lg text-left hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Two-Factor Authentication</h4>
                <p className="text-gray-400 text-sm">Add an extra layer of security</p>
              </div>
              <Shield className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          <button className="w-full p-4 bg-white/5 rounded-lg text-left hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Active Sessions</h4>
                <p className="text-gray-400 text-sm">Manage your active login sessions</p>
              </div>
              <Smartphone className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          <button className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left hover:bg-red-500/20 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-red-400 font-medium">Delete Account</h4>
                <p className="text-gray-400 text-sm">Permanently delete your account and data</p>
              </div>
              <RefreshCw className="w-5 h-5 text-red-400" />
            </div>
          </button>
        </div>
      </GlassCard>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileSettings()
      case "notifications":
        return renderNotificationSettings()
      case "privacy":
        return renderPrivacySettings()
      case "appearance":
        return renderAppearanceSettings()
      case "learning":
        return renderLearningSettings()
      case "security":
        return renderSecuritySettings()
      default:
        return renderProfileSettings()
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <User className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>
        <p className="text-gray-400">Customize your learning experience and account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto">{renderTabContent()}</div>

      {/* Save Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default Settings