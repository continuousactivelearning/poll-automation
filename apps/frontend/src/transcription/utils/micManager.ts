let currentStream: MediaStream | null = null;
let currentTrack: MediaStreamTrack | null = null;
let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;

/**
 * Returns a list of available audio input devices (microphones).
 */
export const getMicrophones = async (): Promise<MediaDeviceInfo[]> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop()); // Stop immediately
    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter((d) => d.kind === 'audioinput');
    console.log('[micManager] Found microphones:', mics);
    return mics;
  } catch (error) {
    console.error('[micManager] Error accessing microphones', error);
    return [];
  }
};

/**
 * Selects a microphone by deviceId and updates the current stream and track.
 */
export async function selectMicrophone(deviceId: string): Promise<MediaStream | null> {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } }
    });

    currentStream = stream;
    currentTrack = stream.getAudioTracks()[0];
    console.log('[micManager] Selected mic stream:', currentTrack.label);

    if (audioContext) {
      await audioContext.close();
    }

    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0; // Silent output to prevent echoing
    source.connect(gainNode).connect(audioContext.destination);

    return stream;
  } catch (err) {
    console.error('[micManager] Error selecting mic:', err);
    return null;
  }
}

/**
 * Returns the current selected microphone stream, if any.
 */
export function getSelectedMicStream(): MediaStream | null {
  return currentStream;
}

/**
 * Toggles mute on the current audio track.
 */
export function toggleMute(): void {
  if (currentTrack) {
    currentTrack.enabled = !currentTrack.enabled;
    console.log('[micManager] Toggled mute:', !currentTrack.enabled);
  }
}

/**
 * Sets the microphone input volume using Web Audio API.
 */
export function setVolume(value: number): void {
  if (gainNode) {
    gainNode.gain.value = value;
    console.log('[micManager] Volume set to:', value);
  }
}
