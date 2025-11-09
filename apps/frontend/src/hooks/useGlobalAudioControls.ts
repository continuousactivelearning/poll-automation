import { useGlobalAudio } from '../contexts/GlobalAudioContext';

/**
 * Simple hook that provides global audio functionality to any component
 * Usage: const { isRecording, startRecording, stopRecording, toggleMute } = useGlobalAudioControls();
 */
export const useGlobalAudioControls = () => {
  const { state, startRecording, stopRecording, toggleMute, clearTranscripts, exportTranscripts } = useGlobalAudio();

  return {
    // State
    isRecording: state.isRecording,
    isMuted: state.isMuted,
    isConnected: state.isConnected,
    status: state.status,
    transcriptCount: state.transcriptLines.filter(line => line.isFinal).length,
    totalTranscripts: state.transcriptLines.length,
    hasError: !!state.error,
    error: state.error,
    
    // Actions
    startRecording,
    stopRecording,
    toggleMute,
    clearTranscripts,
    exportTranscripts,
    
    // Quick status checks
    isActive: state.isRecording && !state.isMuted,
    isIdle: !state.isRecording,
    hasTranscripts: state.transcriptLines.length > 0,
  };
};

export default useGlobalAudioControls;