import { useCallback } from 'react';
import { useGlobalAudio } from '../contexts/GlobalAudioContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Custom hook that provides enhanced session management with automatic audio cleanup
 * Combines room destruction with comprehensive audio session reset
 */
export const useSessionManagement = () => {
  const { resetSession } = useGlobalAudio();
  const { destroyRoom, activeRoom } = useAuth();

  /**
   * Ends the current session with complete cleanup:
   * - Stops audio recording automatically
   * - Resets all segment counters to start from 1
   * - Clears transcript buffers and localStorage
   * - Destroys the room and notifies participants
   * - Resets timer sessions
   */
  const endSessionWithAudioReset = useCallback(async (navigationCallback?: () => void) => {
    if (!activeRoom) {
      console.warn('⚠️ [SESSION] No active room to end');
      return false;
    }

    const endingToast = toast.loading('Ending session and resetting audio...');

    try {
      console.log('🏁 [SESSION] Starting complete session end with audio reset...');

      // Step 1: Reset audio session first (stops recording, clears all state)
      console.log('🔄 [SESSION] Resetting audio session...');
      const audioResetSuccess = await resetSession();

      if (!audioResetSuccess) {
        console.warn('⚠️ [SESSION] Audio reset failed, but continuing with session end...');
      }

      // Step 2: Destroy the room (handles backend notification and participant cleanup)
      console.log('🏠 [SESSION] Destroying room...');
      await destroyRoom(navigationCallback);

      toast.success('Session ended successfully! Ready for fresh start.', { 
        id: endingToast,
        duration: 4000
      });

      console.log('✅ [SESSION] Complete session end with audio reset successful');
      return true;

    } catch (error) {
      console.error('❌ [SESSION] Session end with audio reset failed:', error);
      toast.error('Failed to properly end session. Please try again.', { 
        id: endingToast 
      });
      return false;
    }
  }, [activeRoom, resetSession, destroyRoom]);

  /**
   * Resets only the audio session without ending the room
   * Useful for "Stop Mic" button to ensure clean restart
   */
  const resetAudioSession = useCallback(async () => {
    console.log('🔄 [SESSION] Resetting audio session only...');
    
    const resetToast = toast.loading('Resetting audio session...');

    try {
      const success = await resetSession();
      
      if (success) {
        toast.success('Audio session reset! Ready to start fresh.', { 
          id: resetToast,
          duration: 3000
        });
        console.log('✅ [SESSION] Audio session reset successful');
        return true;
      } else {
        throw new Error('Audio reset failed');
      }
    } catch (error) {
      console.error('❌ [SESSION] Audio session reset failed:', error);
      toast.error('Failed to reset audio session. Please try again.', { 
        id: resetToast 
      });
      return false;
    }
  }, [resetSession]);

  return {
    endSessionWithAudioReset,
    resetAudioSession,
    hasActiveRoom: !!activeRoom,
    roomName: activeRoom?.name,
    roomCode: activeRoom?.code,
  };
};

export default useSessionManagement;