import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Mic, Shield, Bell, Palette, Monitor } from 'lucide-react';
import GlassCard from '../GlassCard';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      name: 'Dr. Sarah Wilson',
      email: 'sarah.wilson@university.edu',
      institution: 'State University',
      department: 'Mathematics',
      autoSave: true,
      notifications: true,
    },
    audio: {
      microphone: 'default',
      quality: 'high',
      noiseReduction: true,
      autoTranscribe: true,
      language: 'en-US',
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      dataRetention: 90,
      allowRecording: true,
    },
    appearance: {
      theme: 'dark',
      accentColor: 'cyan',
      animations: true,
      compactMode: false,
    },
    notifications: {
      emailNotifications: true,
      pollAlerts: true,
      participantJoin: false,
      systemUpdates: true,
    },
  });

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'audio', label: 'Audio', icon: Mic },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    toast.success('Settings updated');
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={settings.general.name}
            onChange={(e) => updateSetting('general', 'name', e.target.value)}
            className="glass-input w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={settings.general.email}
            onChange={(e) => updateSetting('general', 'email', e.target.value)}
            className="glass-input w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Institution
          </label>
          <input
            type="text"
            value={settings.general.institution}
            onChange={(e) => updateSetting('general', 'institution', e.target.value)}
            className="glass-input w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Department
          </label>
          <input
            type="text"
            value={settings.general.department}
            onChange={(e) => updateSetting('general', 'department', e.target.value)}
            className="glass-input w-full"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Auto-save session data</div>
            <div className="text-gray-400 text-sm">Automatically save your session progress</div>
          </div>
          <motion.button
            onClick={() => updateSetting('general', 'autoSave', !settings.general.autoSave)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.general.autoSave ? 'bg-electric-cyan' : 'bg-gray-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              animate={{ x: settings.general.autoSave ? 24 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Enable notifications</div>
            <div className="text-gray-400 text-sm">Receive alerts and updates</div>
          </div>
          <motion.button
            onClick={() => updateSetting('general', 'notifications', !settings.general.notifications)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.general.notifications ? 'bg-electric-cyan' : 'bg-gray-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              animate={{ x: settings.general.notifications ? 24 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
      </div>
    </div>
  );

  const renderAudioTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Microphone Device
          </label>
          <select
            value={settings.audio.microphone}
            onChange={(e) => updateSetting('audio', 'microphone', e.target.value)}
            className="glass-input w-full"
          >
            <option value="default">Default Microphone</option>
            <option value="built-in">Built-in Microphone</option>
            <option value="usb">USB Microphone</option>
            <option value="bluetooth">Bluetooth Headset</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Audio Quality
          </label>
          <select
            value={settings.audio.quality}
            onChange={(e) => updateSetting('audio', 'quality', e.target.value)}
            className="glass-input w-full"
          >
            <option value="low">Low (16 kHz)</option>
            <option value="medium">Medium (22 kHz)</option>
            <option value="high">High (44 kHz)</option>
            <option value="studio">Studio (48 kHz)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Transcription Language
          </label>
          <select
            value={settings.audio.language}
            onChange={(e) => updateSetting('audio', 'language', e.target.value)}
            className="glass-input w-full"
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Noise Reduction</div>
            <div className="text-gray-400 text-sm">Filter background noise during recording</div>
          </div>
          <motion.button
            onClick={() => updateSetting('audio', 'noiseReduction', !settings.audio.noiseReduction)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.audio.noiseReduction ? 'bg-electric-cyan' : 'bg-gray-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              animate={{ x: settings.audio.noiseReduction ? 24 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Auto-transcribe</div>
            <div className="text-gray-400 text-sm">Automatically transcribe audio to text</div>
          </div>
          <motion.button
            onClick={() => updateSetting('audio', 'autoTranscribe', !settings.audio.autoTranscribe)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.audio.autoTranscribe ? 'bg-electric-cyan' : 'bg-gray-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              animate={{ x: settings.audio.autoTranscribe ? 24 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Session Timeout (minutes)
          </label>
          <select
            value={settings.security.sessionTimeout}
            onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
            className="glass-input w-full"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={0}>Never</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Data Retention (days)
          </label>
          <select
            value={settings.security.dataRetention}
            onChange={(e) => updateSetting('security', 'dataRetention', parseInt(e.target.value))}
            className="glass-input w-full"
          >
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={180}>6 months</option>
            <option value={365}>1 year</option>
            <option value={0}>Forever</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Two-Factor Authentication</div>
            <div className="text-gray-400 text-sm">Add an extra layer of security to your account</div>
          </div>
          <motion.button
            onClick={() => updateSetting('security', 'twoFactorAuth', !settings.security.twoFactorAuth)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.security.twoFactorAuth ? 'bg-electric-cyan' : 'bg-gray-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              animate={{ x: settings.security.twoFactorAuth ? 24 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Allow Session Recording</div>
            <div className="text-gray-400 text-sm">Enable recording of audio and interactions</div>
          </div>
          <motion.button
            onClick={() => updateSetting('security', 'allowRecording', !settings.security.allowRecording)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.security.allowRecording ? 'bg-electric-cyan' : 'bg-gray-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              animate={{ x: settings.security.allowRecording ? 24 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Theme
          </label>
          <select
            value={settings.appearance.theme}
            onChange={(e) => updateSetting('appearance',  'theme', e.target.value)}
            className="glass-input w-full"
          >
            <option value="dark">Dark Theme</option>
            <option value="light">Light Theme</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Accent Color
          </label>
          <select
            value={settings.appearance.accentColor}
            onChange={(e) => updateSetting('appearance', 'accentColor', e.target.value)}
            className="glass-input w-full"
          >
            <option value="cyan">Electric Cyan</option>
            <option value="magenta">Vibrant Magenta</option>
            <option value="yellow">Vibrant Yellow</option>
            <option value="green">Emerald Green</option>
            <option value="purple">Royal Purple</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Enable Animations</div>
            <div className="text-gray-400 text-sm">Show smooth transitions and effects</div>
          </div>
          <motion.button
            onClick={() => updateSetting('appearance', 'animations', !settings.appearance.animations)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.appearance.animations ? 'bg-electric-cyan' : 'bg-gray-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              animate={{ x: settings.appearance.animations ? 24 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Compact Mode</div>
            <div className="text-gray-400 text-sm">Use smaller spacing and elements</div>
          </div>
          <motion.button
            onClick={() => updateSetting('appearance', 'compactMode', !settings.appearance.compactMode)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.appearance.compactMode ? 'bg-electric-cyan' : 'bg-gray-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              animate={{ x: settings.appearance.compactMode ? 24 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Email Notifications</div>
            <div className="text-gray-400 text-sm">Receive updates via email</div>
          </div>
          <motion.button
            onClick={() => updateSetting('notifications', 'emailNotifications', !settings.notifications.emailNotifications)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.notifications.emailNotifications ? 'bg-electric-cyan' : 'bg-gray-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              animate={{ x: settings.notifications.emailNotifications ? 24 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Poll Alerts</div>
            <div className="text-gray-400 text-sm">Get notified when polls are completed</div>
          </div>
          <motion.button
            onClick={() => updateSetting('notifications', 'pollAlerts', !settings.notifications.pollAlerts)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.notifications.pollAlerts ? 'bg-electric-cyan' : 'bg-gray-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              animate={{ x: settings.notifications.pollAlerts ? 24 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Participant Join/Leave</div>
            <div className="text-gray-400 text-sm">Alert when students join or leave</div>
          </div>
          <motion.button
            onClick={() => updateSetting('notifications', 'participantJoin', !settings.notifications.participantJoin)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.notifications.participantJoin ? 'bg-electric-cyan' : 'bg-gray-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              animate={{ x: settings.notifications.participantJoin ? 24 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">System Updates</div>
            <div className="text-gray-400 text-sm">Notifications about app updates and maintenance</div>
          </div>
          <motion.button
            onClick={() => updateSetting('notifications', 'systemUpdates', !settings.notifications.systemUpdates)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.notifications.systemUpdates ? 'bg-electric-cyan' : 'bg-gray-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              animate={{ x: settings.notifications.systemUpdates ? 24 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralTab();
      case 'audio': return renderAudioTab();
      case 'security': return renderSecurityTab();
      case 'appearance': return renderAppearanceTab();
      case 'notifications': return renderNotificationsTab();
      default: return renderGeneralTab();
    }
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-300">Customize your EngageSphere experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <GlassCard className="p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-electric-cyan/20 text-electric-cyan border-r-2 border-electric-cyan'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon className={`w-5 h-5 mr-3 ${activeTab === tab.id ? 'text-electric-cyan' : ''}`} />
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              ))}
            </nav>
          </GlassCard>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <GlassCard className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-electric-cyan/20 rounded-lg flex items-center justify-center mr-4">
                {(() => {
                  const currentTab = tabs.find(tab => tab.id === activeTab);
                  if (currentTab) {
                    const CurrentIcon = currentTab.icon;
                    return <CurrentIcon className="w-5 h-5 text-electric-cyan" />;
                  }
                  return null;
                })()}
              </div>
              <h2 className="text-2xl font-semibold text-white">
                {tabs.find(tab => tab.id === activeTab)?.label} Settings
              </h2>
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>

            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end space-x-4">
              <button className="btn-secondary">
                Reset to Defaults
              </button>
              <button className="btn-primary">
                Save Changes
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Settings;