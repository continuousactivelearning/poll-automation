// apps/frontend/src/utils/volumeControl.ts

/**
 * Creates a GainNode for controlling microphone volume.
 * @param audioContext - The AudioContext to create the GainNode in
 * @param initialVolume - Initial volume level (0.0 to 1.0)
 * @returns GainNode instance
 */
export function createGainNode(audioContext: AudioContext, initialVolume: number = 1.0): GainNode {
  const gainNode = audioContext.createGain();
  gainNode.gain.value = initialVolume;
  return gainNode;
}

/**
 * Updates the volume of a given GainNode.
 * @param gainNode - The GainNode whose volume to update
 * @param volume - New volume value (0.0 to 1.0)
 */
export function setGainVolume(gainNode: GainNode, volume: number): void {
  if (volume < 0) volume = 0;
  if (volume > 1) volume = 1;
  gainNode.gain.value = volume;
}
