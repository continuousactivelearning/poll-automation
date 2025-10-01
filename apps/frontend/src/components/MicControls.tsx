/*
This component will:
>   List all available mic devices in a dropdown
>   Include a volume slider
>   Emit selected values back to parent via props
*/

// apps/frontend/src/components/MicControls.tsx
import { useEffect, useState } from "react";
import { getAvailableMicrophones } from "../utils/micDeviceManager";
import "../components/HostSettings.css"; // Reuse existing styling

type MicControlsProps = {
  selectedDeviceId?: string;
  volume?: number;
  onChange: (deviceId: string, volume: number) => void;
};

const MicControls: React.FC<MicControlsProps> = ({ selectedDeviceId, volume = 1, onChange }) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>(selectedDeviceId ?? "");
  const [currentVolume, setCurrentVolume] = useState<number>(volume);

  // Fetch mic list
  useEffect(() => {
    const loadDevices = async () => {
      const mics = await getAvailableMicrophones();
      setDevices(mics);
      if (!currentDeviceId && mics.length > 0) {
        const defaultId = mics[0].deviceId;
        setCurrentDeviceId(defaultId);
        onChange(defaultId, currentVolume);
      }
    };
    loadDevices();
  }, []);

  // Handle device change
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setCurrentDeviceId(newId);
    onChange(newId, currentVolume);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setCurrentVolume(newVolume);
    onChange(currentDeviceId, newVolume);
  };

  return (
    <div className="host-settings-container">
      <h2>Microphone Settings</h2>

      <label>Input Device</label>
      <select value={currentDeviceId} onChange={handleDeviceChange}>
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Microphone ${device.deviceId}`}
          </option>
        ))}
      </select>

      <label>Mic Volume: {Math.round(currentVolume * 100)}%</label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={currentVolume}
        onChange={handleVolumeChange}
      />
    </div>
  );
};

export default MicControls;
