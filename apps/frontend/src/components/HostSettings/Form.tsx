import { useState } from 'react';
import type { HostSettings } from '../../../../../shared/types/src/HostSettings';

interface HostSettingsFormProps {
  initialSettings?: Partial<HostSettings>;
  onSubmit: (settings: HostSettings) => void;
  onCancel?: () => void;
}

export const HostSettingsForm = ({ 
  initialSettings = {}, 
  onSubmit,
  onCancel 
}: HostSettingsFormProps) => {
  const [settings, setSettings] = useState<HostSettings>({
    questionSource: 'gemini',
    questionFrequency: 5,
    numberOfQuestions: 3,
    questionType: 'mcq',
    contextualRange: 'last_5',
    breakIntervals: [],
    manualReview: false,
    pollVisibility: 5,
    difficulty: 'medium',
    isGenerating: true,
    ...initialSettings
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(settings);
  };

  return (
    <form onSubmit={handleSubmit} className="host-settings-form">
      <div className="form-group">
        <label>Question Source:</label>
        <select
          name="questionSource"
          value={settings.questionSource}
          onChange={handleChange}
        >
          <option value="gemini">Gemini API</option>
          <option value="ollama">Ollama (Local LLM)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Question Frequency (minutes):</label>
        <input
          type="number"
          name="questionFrequency"
          min="1"
          value={settings.questionFrequency}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Number of Questions:</label>
        <input
          type="number"
          name="numberOfQuestions"
          min="1"
          max="10"
          value={settings.numberOfQuestions}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Question Type:</label>
        <select
          name="questionType"
          value={settings.questionType}
          onChange={handleChange}
        >
          <option value="mcq">Multiple Choice</option>
          <option value="true_false">True/False</option>
          <option value="opinion">Opinion Poll</option>
        </select>
      </div>

      <div className="form-group">
        <label>Difficulty Level:</label>
        <select
          name="difficulty"
          value={settings.difficulty}
          onChange={handleChange}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="submit">Save Settings</button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};