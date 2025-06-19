import { useState, useEffect } from 'react';
import { HostSettingsForm } from './Form';
import { HostSettingsView } from './View';
import type { HostSettings } from '../../../../../shared/types/src/HostSettings';

export const HostSettingsComponent = () => {
  const [settings, setSettings] = useState<HostSettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/host-settings');
      const data = await response.json();
      if (Object.keys(data).length > 0) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
    }
  };

  const handleSubmit = async (newSettings: HostSettings) => {
    try {
      const response = await fetch('/api/host-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      if (response.ok) {
        setSettings(newSettings);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save settings', error);
    }
  };

  if (!settings && !isEditing) {
    return (
      <div className="host-settings-container">
        <h3>No settings configured</h3>
        <button onClick={() => setIsEditing(true)}>Configure Settings</button>
      </div>
    );
  }

  return (
    <div className="host-settings-container">
      {isEditing ? (
        <HostSettingsForm
          initialSettings={settings || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <HostSettingsView
          settings={settings!}
          onEdit={() => setIsEditing(true)}
        />
      )}
    </div>
  );
};