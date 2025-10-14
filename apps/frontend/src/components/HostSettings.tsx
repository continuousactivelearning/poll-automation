import React, { useState } from "react";
import "./HostSettings.css";
import { apiService } from "../utils/api"; 

type HostSettingsType = {
  meeting_id: string;
  questionSource: "gemini" | "llama";
  numQuestions: number;
  type: "MCQ" | "True/False" | "Opinion Poll";
  difficulty: "easy" | "medium" | "hard";
};

const defaultSettings: HostSettingsType = {
  meeting_id: "",
  questionSource: "gemini",
  numQuestions: 3,
  type: "MCQ",
  difficulty: "medium",
};

export const HostSettings = () => {
  const [settings, setSettings] = useState<HostSettingsType>(defaultSettings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const saveSettings = async () => {
    try {
      await apiService.updateSettings(settings);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings.");
    }
  };

  return (
    <div className="host-settings-container">
      <h2>Host Question Settings</h2>

      <input
        type="text"
        name="meeting_id"
        value={settings.meeting_id}
        onChange={handleChange}
        placeholder="Meeting ID"
      />

      <select name="questionSource" value={settings.questionSource} onChange={handleChange}>
        <option value="gemini">Gemini API</option>
        <option value="llama">LLaMA 3.2</option>
      </select>

      <input
        type="number"
        name="numQuestions"
        value={settings.numQuestions}
        onChange={handleChange}
        placeholder="Number of Questions"
        min={1}
      />

      <select name="type" value={settings.type} onChange={handleChange}>
        <option value="MCQ">MCQ</option>
        <option value="True/False">True/False</option>
        <option value="Opinion Poll">Opinion Poll</option>
      </select>

      <select name="difficulty" value={settings.difficulty} onChange={handleChange}>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

    <button onClick={saveSettings}>Save Settings</button>
    </div>
  );
};
