// // POLL_GENERATION_FRONTEND/src/pages/Settings.tsx
// import React, { useState,useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { 
//   Settings as SettingsIcon, 
//   Moon, 
//   Sun, 
//   Clock, 
//   Volume2, 
//   Shield, 
//   Palette,
//   Mic,
//   User,
//   Bell,
//   Save,
//   RotateCcw,
//   Camera
// } from 'lucide-react';
// import DashboardLayout from '../components/DashboardLayout';
// import GlassCard from '../components/GlassCard';
// import { useTheme } from '../contexts/ThemeContext';

// const Settings = () => {
//   const { isDarkMode, toggleDarkMode, accentColor, setAccentColor } = useTheme();
//   const api= import.meta.env.VITE_API_URL || "http://localhost:5000/api";
//    // Profile Settings
//     const [profileData, setProfileData] = useState({
//       firstName: "John",
//       lastName: "Doe",
//       email: "john.doe@student.edu",
//       bio: "Computer Science student passionate about learning",
//       avatar: "https://imgs.search.brave.com/x5_5ivfXsbQ-qwitDVJyk-aJx6KxpIIi0BgyHXDu8Jg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/ZnJlZS1wc2QvM2Qt/aWxsdXN0cmF0aW9u/LWh1bWFuLWF2YXRh/ci1wcm9maWxlXzIz/LTIxNTA2NzExNDIu/anBnP3NlbXQ9YWlz/X2h5YnJpZCZ3PTc0/MA?height=100&width=100",
//     })
//   useEffect(() => {
//     const fetchProfileData = async () => {
//       const response = await fetch(`${api}/users/profile`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${localStorage.getItem('token')}`,
//         },
//         });
//       const data = await response.json();
//       const newLocal = data.fullName.split(' ');
//       const lastName = newLocal.pop() || '';
//       const firstName = newLocal.join(' ') || '';
//       setProfileData({...profileData, firstName, lastName, email:data.email, avatar:data.avatar || profileData.avatar, bio:data.bio || profileData.bio });
//     };
//     fetchProfileData();
//   }, [api]);
//   // Settings state
//   const [settings, setSettings] = useState({
//     // General Settings
//     defaultTimer: 30,
//     autoLaunch: false,
//     enableNotifications: true,
    
//     // Audio Settings
//     selectedMicrophone: 'default',
//     microphoneVolume: 75,
//     enableAudioFeedback: true,
    
//     // Security Settings
//     enableScreenshotDetection: true,
//     enableCopyProtection: true,
//     enableBlurOnFocusLoss: true,
//     sessionTimeout: 60,
    
//     // Theme Settings
//     primaryColor: '#8B5CF6',
//     secondaryColor: '#3B82F6',
//     accentColor: '#14B8A6',
//     fontSize: 'medium',
    
//     // AI Settings
//     aiConfidenceThreshold: 80,
//     autoApproveHighConfidence: false,
//     enableSmartFiltering: true,
//   });

//   const microphoneOptions = [
//     { id: 'default', name: 'Default Microphone' },
//     { id: 'external', name: 'External USB Microphone' },
//     { id: 'headset', name: 'Bluetooth Headset' },
//     { id: 'webcam', name: 'Webcam Microphone' },
//   ];

//   const colorPresets = [
//     { name: 'Purple', primary: '#8B5CF6', secondary: '#3B82F6', accent: '#14B8A6' },
//     { name: 'Blue', primary: '#3B82F6', secondary: '#1D4ED8', accent: '#06B6D4' },
//     { name: 'Green', primary: '#10B981', secondary: '#059669', accent: '#8B5CF6' },
//     { name: 'Orange', primary: '#F59E0B', secondary: '#D97706', accent: '#EF4444' },
//   ];

//   const handleSettingChange = (key: string, value: unknown) => {
//     setSettings(prev => ({ ...prev, [key]: value }));
//   };

//   const handleSaveSettings = () => {
//     console.log('Saving settings:', settings);
//     // Implementation for saving settings
//   };

//   const handleResetSettings = () => {
//     setSettings({
//       defaultTimer: 30,
//       autoLaunch: false,
//       enableNotifications: true,
//       selectedMicrophone: 'default',
//       microphoneVolume: 75,
//       enableAudioFeedback: true,
//       enableScreenshotDetection: true,
//       enableCopyProtection: true,
//       enableBlurOnFocusLoss: true,
//       sessionTimeout: 60,
//       primaryColor: '#8B5CF6',
//       secondaryColor: '#3B82F6',
//       accentColor: '#14B8A6',
//       fontSize: 'medium',
//       aiConfidenceThreshold: 80,
//       autoApproveHighConfidence: false,
//       enableSmartFiltering: true,
//     });
//   };

//   const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) => (
//     <button
//       onClick={() => onChange(!enabled)}
//       className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ${
//         enabled ? 'bg-primary-500' : 'bg-gray-600'
//       }`}
//     >
//       <span
//         className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${
//           enabled ? 'translate-x-6' : 'translate-x-1'
//         }`}
//       />
//     </button>
//   );

//   return (
//     <DashboardLayout>
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="space-y-6"
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
//             <p className="text-gray-400">Customize your polling system preferences</p>
//           </div>
//           <div className="flex items-center space-x-4">
//             <motion.button
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               onClick={handleResetSettings}
//               className="flex items-center space-x-2 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors duration-200"
//             >
//               <RotateCcw className="w-4 h-4" />
//               <span>Reset</span>
//             </motion.button>
//             <motion.button
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               onClick={handleSaveSettings}
//               className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
//             >
//               <Save className="w-4 h-4" />
//               <span>Save Changes</span>
//             </motion.button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Profile Information */}
// <GlassCard className="p-6 lg:col-span-2">
//   <div className="flex items-center gap-2 mb-6">
//     <User className="w-5 h-5 text-purple-400" />
//     <h3 className="text-lg font-semibold text-white">Personal Information</h3>
//   </div>

//   <div className="space-y-6">
//     {/* Avatar Section */}
//     <div className="flex items-center gap-6">
//       <div className="relative">
//         <img
//           src={profileData.avatar || "/placeholder.svg"}
//           alt="Profile"
//           className="w-20 h-20 rounded-full border-2 border-purple-500/30"
//         />
//         <button className="absolute -bottom-1 -right-1 p-2 bg-purple-600 rounded-full hover:bg-purple-700 transition-colors">
//           <Camera className="w-4 h-4 text-white" />
//         </button>
//       </div>
//       <div>
//         <h4 className="text-white font-medium">Profile Picture</h4>
//         <p className="text-gray-400 text-sm">Upload a new profile picture</p>
//       </div>
//     </div>

//     {/* Name Fields */}
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//       <div>
//         <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
//         <input
//           type="text"
//           value={profileData.firstName}
//           onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
//           className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
//         />
//       </div>
//       <div>
//         <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
//         <input
//           type="text"
//           value={profileData.lastName}
//           onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
//           className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
//         />
//       </div>
//     </div>

//     {/* Email */}
//     <div>
//       <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
//       <input
//         type="email"
//         value={profileData.email}
//         onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
//         className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
//       />
//     </div>

//     {/* Bio */}
//     <div>
//       <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
//       <textarea
//         value={profileData.bio}
//         onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
//         rows={3}
//         className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none"
//         placeholder="Tell us about yourself..."
//       />
//     </div>
//   </div>
// </GlassCard>

//           {/* General Settings */}
//           <GlassCard className="p-6">
//             <h3 className="text-xl font-bold text-white mb-6 flex items-center">
//               <SettingsIcon className="w-5 h-5 mr-2" />
//               General Settings
//             </h3>
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   Default Timer Duration
//                 </label>
//                 <div className="flex items-center space-x-4">
//                   <input
//                     type="range"
//                     min="10"
//                     max="120"
//                     value={settings.defaultTimer}
//                     onChange={(e) => handleSettingChange('defaultTimer', parseInt(e.target.value))}
//                     className="flex-1"
//                   />
//                   <span className="text-white font-medium w-12">{settings.defaultTimer}s</span>
//                 </div>
//               </div>

//               <div className="flex items-center justify-between">
//                 <div>
//                   <label className="text-sm font-medium text-gray-300">Enable Auto-Launch</label>
//                   <p className="text-xs text-gray-400">Automatically launch approved questions</p>
//                 </div>
//                 <ToggleSwitch
//                   enabled={settings.autoLaunch}
//                   onChange={(value) => handleSettingChange('autoLaunch', value)}
//                 />
//               </div>

//               <div className="flex items-center justify-between">
//                 <div>
//                   <label className="text-sm font-medium text-gray-300">Enable Notifications</label>
//                   <p className="text-xs text-gray-400">Receive system notifications</p>
//                 </div>
//                 <ToggleSwitch
//                   enabled={settings.enableNotifications}
//                   onChange={(value) => handleSettingChange('enableNotifications', value)}
//                 />
//               </div>
//             </div>
//           </GlassCard>

//           {/* Audio Settings */}
//           <GlassCard className="p-6">
//             <h3 className="text-xl font-bold text-white mb-6 flex items-center">
//               <Mic className="w-5 h-5 mr-2" />
//               Audio Settings
//             </h3>
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   Microphone Device
//                 </label>
//                 <select
//                   value={settings.selectedMicrophone}
//                   onChange={(e) => handleSettingChange('selectedMicrophone', e.target.value)}
//                   className="w-full bg-white/10 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
//                 >
//                   {microphoneOptions.map(option => (
//                     <option key={option.id} value={option.id} className="bg-gray-800">
//                       {option.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   Microphone Volume
//                 </label>
//                 <div className="flex items-center space-x-4">
//                   <Volume2 className="w-4 h-4 text-gray-400" />
//                   <input
//                     type="range"
//                     min="0"
//                     max="100"
//                     value={settings.microphoneVolume}
//                     onChange={(e) => handleSettingChange('microphoneVolume', parseInt(e.target.value))}
//                     className="flex-1"
//                   />
//                   <span className="text-white font-medium w-12">{settings.microphoneVolume}%</span>
//                 </div>
//               </div>

//               <div className="flex items-center justify-between">
//                 <div>
//                   <label className="text-sm font-medium text-gray-300">Audio Feedback</label>
//                   <p className="text-xs text-gray-400">Play sounds for interactions</p>
//                 </div>
//                 <ToggleSwitch
//                   enabled={settings.enableAudioFeedback}
//                   onChange={(value) => handleSettingChange('enableAudioFeedback', value)}
//                 />
//               </div>
//             </div>
//           </GlassCard>

//           {/* Security Settings */}
//           <GlassCard className="p-6">
//             <h3 className="text-xl font-bold text-white mb-6 flex items-center">
//               <Shield className="w-5 h-5 mr-2" />
//               Security Settings
//             </h3>
//             <div className="space-y-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <label className="text-sm font-medium text-gray-300">Screenshot Detection</label>
//                   <p className="text-xs text-gray-400">Detect screenshot attempts</p>
//                 </div>
//                 <ToggleSwitch
//                   enabled={settings.enableScreenshotDetection}
//                   onChange={(value) => handleSettingChange('enableScreenshotDetection', value)}
//                 />
//               </div>

//               <div className="flex items-center justify-between">
//                 <div>
//                   <label className="text-sm font-medium text-gray-300">Copy Protection</label>
//                   <p className="text-xs text-gray-400">Prevent text copying</p>
//                 </div>
//                 <ToggleSwitch
//                   enabled={settings.enableCopyProtection}
//                   onChange={(value) => handleSettingChange('enableCopyProtection', value)}
//                 />
//               </div>

//               <div className="flex items-center justify-between">
//                 <div>
//                   <label className="text-sm font-medium text-gray-300">Blur on Focus Loss</label>
//                   <p className="text-xs text-gray-400">Blur screen when window loses focus</p>
//                 </div>
//                 <ToggleSwitch
//                   enabled={settings.enableBlurOnFocusLoss}
//                   onChange={(value) => handleSettingChange('enableBlurOnFocusLoss', value)}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   Session Timeout (minutes)
//                 </label>
//                 <div className="flex items-center space-x-4">
//                   <Clock className="w-4 h-4 text-gray-400" />
//                   <input
//                     type="range"
//                     min="15"
//                     max="180"
//                     value={settings.sessionTimeout}
//                     onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
//                     className="flex-1"
//                   />
//                   <span className="text-white font-medium w-12">{settings.sessionTimeout}m</span>
//                 </div>
//               </div>
//             </div>
//           </GlassCard>

//           {/* Theme Settings */}
//           <GlassCard className="p-6">
//             <h3 className="text-xl font-bold text-white mb-6 flex items-center">
//               <Palette className="w-5 h-5 mr-2" />
//               Theme Settings
//             </h3>
//             <div className="space-y-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <label className="text-sm font-medium text-gray-300">Dark Mode</label>
//                   <p className="text-xs text-gray-400">Toggle between light and dark themes</p>
//                 </div>
//                 <button
//                   onClick={toggleDarkMode}
//                   className="p-2 bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors duration-200"
//                 >
//                   {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
//                 </button>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-3">
//                   Color Presets
//                 </label>
//                 <div className="grid grid-cols-2 gap-3">
//                   {colorPresets.map((preset, index) => (
//                     <button
//                       key={index}
//                       onClick={() => {
//                         handleSettingChange('primaryColor', preset.primary);
//                         handleSettingChange('secondaryColor', preset.secondary);
//                         handleSettingChange('accentColor', preset.accent);
//                       }}
//                       className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-200"
//                     >
//                       <div className="flex space-x-1">
//                         <div 
//                           className="w-4 h-4 rounded-full" 
//                           style={{ backgroundColor: preset.primary }}
//                         />
//                         <div 
//                           className="w-4 h-4 rounded-full" 
//                           style={{ backgroundColor: preset.secondary }}
//                         />
//                         <div 
//                           className="w-4 h-4 rounded-full" 
//                           style={{ backgroundColor: preset.accent }}
//                         />
//                       </div>
//                       <span className="text-white text-sm">{preset.name}</span>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   Font Size
//                 </label>
//                 <select
//                   value={settings.fontSize}
//                   onChange={(e) => handleSettingChange('fontSize', e.target.value)}
//                   className="w-full bg-white/10 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
//                 >
//                   <option value="small" className="bg-gray-800">Small</option>
//                   <option value="medium" className="bg-gray-800">Medium</option>
//                   <option value="large" className="bg-gray-800">Large</option>
//                 </select>
//               </div>
//             </div>
//           </GlassCard>

//           {/* AI Settings */}
//           <GlassCard className="p-6 lg:col-span-2">
//             <h3 className="text-xl font-bold text-white mb-6 flex items-center">
//               <Bell className="w-5 h-5 mr-2" />
//               AI & Automation Settings
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   AI Confidence Threshold
//                 </label>
//                 <div className="flex items-center space-x-4">
//                   <input
//                     type="range"
//                     min="50"
//                     max="100"
//                     value={settings.aiConfidenceThreshold}
//                     onChange={(e) => handleSettingChange('aiConfidenceThreshold', parseInt(e.target.value))}
//                     className="flex-1"
//                   />
//                   <span className="text-white font-medium w-12">{settings.aiConfidenceThreshold}%</span>
//                 </div>
//                 <p className="text-xs text-gray-400 mt-1">Minimum confidence for AI-generated questions</p>
//               </div>

//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <label className="text-sm font-medium text-gray-300">Auto-approve High Confidence</label>
//                     <p className="text-xs text-gray-400">Automatically approve questions above threshold</p>
//                   </div>
//                   <ToggleSwitch
//                     enabled={settings.autoApproveHighConfidence}
//                     onChange={(value) => handleSettingChange('autoApproveHighConfidence', value)}
//                   />
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <div>
//                     <label className="text-sm font-medium text-gray-300">Smart Filtering</label>
//                     <p className="text-xs text-gray-400">Use AI to filter duplicate questions</p>
//                   </div>
//                   <ToggleSwitch
//                     enabled={settings.enableSmartFiltering}
//                     onChange={(value) => handleSettingChange('enableSmartFiltering', value)}
//                   />
//                 </div>
//               </div>
//             </div>
//           </GlassCard>
//         </div>
//       </motion.div>
//     </DashboardLayout>
//   );
// };

// export default Settings;


// src/pages/Settings.tsx

import React, { useState, useEffect,  useRef } from 'react';
import type { ChangeEvent } from "react"
import { motion } from 'framer-motion';
import { User, Lock, Trash2, Camera, Edit, X, Save, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import GlassCard from "../components/GlassCard"; // Assuming you have these components
import { apiService } from '../utils/api'; // Make sure this is correctly imported

import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import 'sweetalert2/dist/sweetalert2.min.css';
import Swal from 'sweetalert2';
interface ProfileData {
  fullName: string;
  email: string;
  bio: string;
  avatar: string;
}
interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

const Settings = () => {
  const { logout, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const api = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    email: '',
    bio: '',
    avatar: '',
  });
  const [originalProfile, setOriginalProfile] = useState<ProfileData>({
    fullName: '',
    email: '',
    bio: '',
    avatar: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  
    // --- NEW STATE for the separate delete password field ---

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${api}/users/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch');

        const formatted = {
          fullName: data.fullName || '',
          email: data.email || '',
          bio: data.bio || '',
          avatar: data.avatar || 'https://www.gravatar.com/avatar/?d=mp',
        };

        setProfileData(formatted);
        setOriginalProfile(formatted);
      } catch (err) {
        toast.error('Could not load profile.');
      }
    };
    if (user) fetchProfile();
  }, [user, api]);

  const handleProfileChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleCancelEdit = () => {
    setProfileData(originalProfile);
    setIsEditing(false);
  };
// --- CORRECTED AVATAR UPLOAD LOGIC ---
    const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('avatar', file);
            
            const uploadToast = toast.loading('Uploading avatar...');
            try {
                // The API call is correct
                const response = await fetch(`${api}/users/profile/avatar`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    body: formData,
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                
                // This is the key: Update BOTH local state and global context
                const newAvatarUrl = data.avatar;
                setProfileData(prev => ({ ...prev, avatar: newAvatarUrl }));
                setOriginalProfile(prev => ({...prev, avatar: newAvatarUrl })); // also update original state
                updateUser({ avatar: newAvatarUrl }); // This updates localStorage and AuthContext
                
                toast.success('Avatar updated!', { id: uploadToast });
            } catch (error: any) {
                toast.error(error.message || 'Upload failed.', { id: uploadToast });
            }
        }
    };

 const handleSaveProfile = async () => {
        const saveToast = toast.loading('Saving profile...');
        try {
            const response = await fetch(`${api}/users/profile`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName: profileData.fullName, bio: profileData.bio })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            // Update global context with new details
            updateUser({ fullName: data.user.fullName, bio: data.user.bio });
            setOriginalProfile(profileData); // Update the "original" state for cancel functionality
            
            toast.success('Profile saved!', { id: saveToast });
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to save profile.', { id: saveToast });
        }
    };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      return toast.error('Passwords do not match.');
    }
    const t = toast.loading('Changing password...');
    try {
      const res = await fetch(`${api}/users/change-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
// after toast.success(...)toast.success('Password changed!', { id: t });
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
    } catch (err: any) {
      toast.error(err.message || 'Change failed.', { id: t });
    }
  };
    // --- THIS IS THE CORRECTED DELETE HANDLER ---
    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'DELETE') {
            return toast.error('To confirm, please type "DELETE" in the text box.');
        }
        // Use the new, separate state for the password.
        if (!deletePassword) {
            return toast.error('Please enter your current password to confirm deletion.');
        }

        const delToast = toast.loading('Deleting account...');
        try {
            const response = await fetch(`${api}/users/delete-account`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                // Use the dedicated 'deletePassword' from its own state
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
      <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-4xl mx-auto">
                <header className="flex justify-between items-center pb-4 border-b border-gray-700">
                    <h1 className="text-3xl font-bold text-white">Account Settings</h1>
                    <button onClick={logout} className="btn-secondary flex items-center gap-2"><LogOut size={16} />Logout</button>
                </header>

                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2"><User /> Profile</h2>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <button onClick={handleCancelEdit} className="btn-secondary text-sm"><X className="w-4 h-4 mr-1" />Cancel</button>
                                <button onClick={handleSaveProfile} className="btn-primary text-sm"><Save className="w-4 h-4 mr-1" />Save</button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm"><Edit className="w-4 h-4 mr-1" />Edit</button>
                        )}
                    </div>
                    
                    <div className="bg-dark-700 rounded-lg p-6 space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <img src={profileData.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-gray-600" />
                                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" disabled={!isEditing} />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-2 bg-purple-600 rounded-full hover:bg-purple-700 transition"
                                >
                                    <Camera size={16} className="text-white" />
                                </button>
                            </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                  <input type="text" name="fullName" value={profileData.fullName} onChange={handleProfileChange} disabled={!isEditing} className={isEditing ? 'settings-input' : 'settings-input-disabled'} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <input type="email" value={profileData.email} disabled className="settings-input-disabled" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Bio</label>
              <textarea name="bio" value={profileData.bio} onChange={handleProfileChange} disabled={!isEditing} rows={3} placeholder="Tell us a bit about yourself..." className={`${isEditing ? 'settings-input' : 'settings-input-disabled'} resize-none`} />
            </div>
          </div>
        </section>

        {/* Password Section */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Lock /> Change Password</h2>
          <form onSubmit={handlePasswordChangeSubmit} className="bg-dark-700 rounded-lg p-6 space-y-4">
            <input type="password" required placeholder="Current Password" value={passwordData.currentPassword} onChange={e => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))} className="settings-input" />
            <input type="password" required placeholder="New Password" value={passwordData.newPassword} onChange={e => setPasswordData(p => ({ ...p, newPassword: e.target.value }))} className="settings-input" />
            <input type="password" required placeholder="Confirm Password" value={passwordData.confirmNewPassword} onChange={e => setPasswordData(p => ({ ...p, confirmNewPassword: e.target.value }))} className="settings-input" />
            <div className="text-right">
              <button type="submit" className="btn-primary">Update Password</button>
            </div>
          </form>
        </section>

      {/* --- THIS IS THE CORRECTED DELETE SECTION --- */}
                <section>
                    <h2 className="text-xl font-semibold text-red-500 mb-4 flex items-center gap-2"><Trash2 /> Delete Account</h2>
                    <div className="bg-dark-700 rounded-lg p-6">
                        <p className="text-gray-400 mb-4">This action is permanent and cannot be undone. To confirm, please type "DELETE" and enter your current password below.</p>
                        <div className="flex flex-col md:flex-row gap-4">
                            <input 
                                type="text" 
                                placeholder='Type "DELETE"' 
                                value={deleteConfirm} 
                                onChange={e => setDeleteConfirm(e.target.value)} 
                                className="settings-input flex-1" 
                            />
                            {/* The separate password input has been ADDED BACK */}
                            <input 
                                type="password" 
                                placeholder="Enter current password" 
                                value={deletePassword} 
                                onChange={e => setDeletePassword(e.target.value)} 
                                className="settings-input flex-1"
                            />
                            <button onClick={handleDeleteAccount} className="btn-danger w-full md:w-auto">Delete My Account</button>
                        </div>
                    </div>
                </section>
      </motion.div>
    </DashboardLayout>
  );
};

export default Settings;
