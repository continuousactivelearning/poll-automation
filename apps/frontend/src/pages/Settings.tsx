import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/useAuth";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Clock,
  Volume2,
  Shield,
  Palette,
  Mic,
  User,
  Bell,
  Save,
  RotateCcw,
  Camera,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import GlassCard from "../components/GlassCard";
import { useTheme } from "../contexts/ThemeContext";

const Settings = () => {
  const { isDarkMode, toggleDarkMode, accentColor, setAccentColor } =
    useTheme();
  const api = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  // Profile Settings
  const [profileData, setProfileData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@student.edu",
    bio: "Computer Science student passionate about learning",
    avatar:
      "https://imgs.search.brave.com/x5_5ivfXsbQ-qwitDVJyk-aJx6KxpIIi0BgyHXDu8Jg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/ZnJlZS1wc2QvM2Qt/aWxsdXN0cmF0aW9u/LWh1bWFuLWF2YXRh/ci1wcm9maWxlXzIz/LTIxNTA2NzExNDIu/anBnP3NlbXQ9YWlz/X2h5YnJpZCZ3PTc0/MA?height=100&width=100",
  });
  useEffect(() => {
    const fetchProfileData = async () => {
      const response = await fetch(`${api}/users/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      const newLocal = data.fullName.split(" ");
      const lastName = newLocal.pop() || "";
      const firstName = newLocal.join(" ") || "";
      setProfileData({
        ...profileData,
        firstName,
        lastName,
        email: data.email,
        avatar: data.avatar || profileData.avatar,
        bio: data.bio || profileData.bio,
      });
    };
    fetchProfileData();
  }, [api]);
  // Settings state
  const [settings, setSettings] = useState({
    // General Settings
    defaultTimer: 30,
    autoLaunch: false,
    enableNotifications: true,

    // Audio Settings
    selectedMicrophone: 'default',
    microphoneVolume: 100,
    enableAudioFeedback: true,

    // Security Settings
    enableScreenshotDetection: true,
    enableCopyProtection: true,
    enableBlurOnFocusLoss: true,
    sessionTimeout: 60,

    // Theme Settings
    primaryColor: "#8B5CF6",
    secondaryColor: "#3B82F6",
    accentColor: "#14B8A6",
    fontSize: "medium",

    // AI Settings
    aiConfidenceThreshold: 80,
    autoApproveHighConfidence: false,
    enableSmartFiltering: true,
  });

  const microphoneOptions = [
    { id: "default", name: "Default Microphone" },
    { id: "external", name: "External USB Microphone" },
    { id: "headset", name: "Bluetooth Headset" },
    { id: "webcam", name: "Webcam Microphone" },
  ];

  const colorPresets = [
    {
      name: "Purple",
      primary: "#8B5CF6",
      secondary: "#3B82F6",
      accent: "#14B8A6",
    },
    {
      name: "Blue",
      primary: "#3B82F6",
      secondary: "#1D4ED8",
      accent: "#06B6D4",
    },
    {
      name: "Green",
      primary: "#10B981",
      secondary: "#059669",
      accent: "#8B5CF6",
    },
    {
      name: "Orange",
      primary: "#F59E0B",
      secondary: "#D97706",
      accent: "#EF4444",
    },
  ];

  const handleSettingChange = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch(`${api}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const updatedUser = await response.json();
      console.log("Profile updated:", updatedUser);
      alert("Profile updated successfully!");
    } catch (error: unknown) {
      console.error("Error updating profile:", (error as Error).message);
      alert("Failed to update profile");
    }
  };

  const handleResetSettings = () => {
    setSettings({
      defaultTimer: 30,
      autoLaunch: false,
      enableNotifications: true,
      selectedMicrophone: "default",
      microphoneVolume: 75,
      enableAudioFeedback: true,
      enableScreenshotDetection: true,
      enableCopyProtection: true,
      enableBlurOnFocusLoss: true,
      sessionTimeout: 60,
      primaryColor: "#8B5CF6",
      secondaryColor: "#3B82F6",
      accentColor: "#14B8A6",
      fontSize: "medium",
      aiConfidenceThreshold: 80,
      autoApproveHighConfidence: false,
      enableSmartFiltering: true,
    });
  };

  const ToggleSwitch = ({
    enabled,
    onChange,
  }: {
    enabled: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ${
        enabled ? "bg-primary-500" : "bg-gray-600"
      }`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("http://localhost:3000/users/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload avatar");

      const data = await res.json();
      setProfileData((prev) => ({
        ...prev,
        avatar: `http://localhost:3000${data.avatar}`,
      }));
    } catch (err) {
      console.error("Error uploading avatar:", err);
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">
              Customize your polling system preferences
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResetSettings}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveSettings}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <GlassCard className="p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">
                Personal Information
              </h3>
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
                  <p className="text-gray-400 text-sm">
                    Upload a new profile picture
                  </p>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        firstName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        lastName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </GlassCard>

          {/* General Settings */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2" />
              General Settings
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default Timer Duration
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="10"
                    max="120"
                    value={settings.defaultTimer}
                    onChange={(e) =>
                      handleSettingChange(
                        "defaultTimer",
                        parseInt(e.target.value)
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-white font-medium w-12">
                    {settings.defaultTimer}s
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Enable Auto-Launch
                  </label>
                  <p className="text-xs text-gray-400">
                    Automatically launch approved questions
                  </p>
                </div>
                <ToggleSwitch
                  enabled={settings.autoLaunch}
                  onChange={(value) => handleSettingChange("autoLaunch", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Enable Notifications
                  </label>
                  <p className="text-xs text-gray-400">
                    Receive system notifications
                  </p>
                </div>
                <ToggleSwitch
                  enabled={settings.enableNotifications}
                  onChange={(value) =>
                    handleSettingChange("enableNotifications", value)
                  }
                />
              </div>
            </div>
          </GlassCard>

          {/* Audio Settings */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Mic className="w-5 h-5 mr-2" />
              Audio Settings
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Microphone Device
                </label>
                <select
                  value={settings.selectedMicrophone}
                  onChange={(e) =>
                    handleSettingChange("selectedMicrophone", e.target.value)
                  }
                  className="w-full bg-white/10 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {microphoneOptions.map((option) => (
                    <option
                      key={option.id}
                      value={option.id}
                      className="bg-gray-800"
                    >
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Microphone Volume
                </label>
                <div className="flex items-center space-x-4">
                  <Volume2 className="w-4 h-4 text-gray-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.microphoneVolume}
                    onChange={(e) =>
                      handleSettingChange(
                        "microphoneVolume",
                        parseInt(e.target.value)
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-white font-medium w-12">
                    {settings.microphoneVolume}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Audio Feedback
                  </label>
                  <p className="text-xs text-gray-400">
                    Play sounds for interactions
                  </p>
                </div>
                <ToggleSwitch
                  enabled={settings.enableAudioFeedback}
                  onChange={(value) =>
                    handleSettingChange("enableAudioFeedback", value)
                  }
                />
              </div>
            </div>
          </GlassCard>

          {/* Security Settings */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Settings
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Screenshot Detection
                  </label>
                  <p className="text-xs text-gray-400">
                    Detect screenshot attempts
                  </p>
                </div>
                <ToggleSwitch
                  enabled={settings.enableScreenshotDetection}
                  onChange={(value) =>
                    handleSettingChange("enableScreenshotDetection", value)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Copy Protection
                  </label>
                  <p className="text-xs text-gray-400">Prevent text copying</p>
                </div>
                <ToggleSwitch
                  enabled={settings.enableCopyProtection}
                  onChange={(value) =>
                    handleSettingChange("enableCopyProtection", value)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Blur on Focus Loss
                  </label>
                  <p className="text-xs text-gray-400">
                    Blur screen when window loses focus
                  </p>
                </div>
                <ToggleSwitch
                  enabled={settings.enableBlurOnFocusLoss}
                  onChange={(value) =>
                    handleSettingChange("enableBlurOnFocusLoss", value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Timeout (minutes)
                </label>
                <div className="flex items-center space-x-4">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <input
                    type="range"
                    min="15"
                    max="180"
                    value={settings.sessionTimeout}
                    onChange={(e) =>
                      handleSettingChange(
                        "sessionTimeout",
                        parseInt(e.target.value)
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-white font-medium w-12">
                    {settings.sessionTimeout}m
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Theme Settings */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Theme Settings
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Dark Mode
                  </label>
                  <p className="text-xs text-gray-400">
                    Toggle between light and dark themes
                  </p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {isDarkMode ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Color Presets
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {colorPresets.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleSettingChange("primaryColor", preset.primary);
                        handleSettingChange("secondaryColor", preset.secondary);
                        handleSettingChange("accentColor", preset.accent);
                      }}
                      className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-200"
                    >
                      <div className="flex space-x-1">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.secondary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <span className="text-white text-sm">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Font Size
                </label>
                <select
                  value={settings.fontSize}
                  onChange={(e) =>
                    handleSettingChange("fontSize", e.target.value)
                  }
                  className="w-full bg-white/10 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            </div>
          </GlassCard>

          {/* AI Settings */}
          <GlassCard className="p-6 lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              AI & Automation Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  AI Confidence Threshold
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={settings.aiConfidenceThreshold}
                    onChange={(e) =>
                      handleSettingChange(
                        "aiConfidenceThreshold",
                        parseInt(e.target.value)
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-white font-medium w-12">
                    {settings.aiConfidenceThreshold}%
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Minimum confidence for AI-generated questions
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">
                      Auto-approve High Confidence
                    </label>
                    <p className="text-xs text-gray-400">
                      Automatically approve questions above threshold
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.autoApproveHighConfidence}
                    onChange={(value) =>
                      handleSettingChange("autoApproveHighConfidence", value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">
                      Smart Filtering
                    </label>
                    <p className="text-xs text-gray-400">
                      Use AI to filter duplicate questions
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.enableSmartFiltering}
                    onChange={(value) =>
                      handleSettingChange("enableSmartFiltering", value)
                    }
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Settings;
