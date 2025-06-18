import type { HostSettings } from '../../../../../shared/types/src/HostSettings';

interface HostSettingsViewProps {
  settings: HostSettings;
  onEdit: () => void;
}

export const HostSettingsView = ({ settings, onEdit }: HostSettingsViewProps) => {
  return (
    <div className="host-settings-view">
      <h3>Current Settings</h3>
      <div className="settings-grid">
        <div>
          <strong>Question Source:</strong> 
          <span>{settings.questionSource === 'gemini' ? 'Gemini API' : 'Ollama (Local)'}</span>
        </div>
        <div>
          <strong>Frequency:</strong> 
          <span>Every {settings.questionFrequency} minutes</span>
        </div>
        <div>
          <strong>Questions per poll:</strong> 
          <span>{settings.numberOfQuestions}</span>
        </div>
        <div>
          <strong>Question Type:</strong> 
          <span>{settings.questionType}</span>
        </div>
        <div>
          <strong>Difficulty:</strong> 
          <span>{settings.difficulty}</span>
        </div>
      </div>
      <button onClick={onEdit} className="edit-button">
        Edit Settings
      </button>
    </div>
  );
};