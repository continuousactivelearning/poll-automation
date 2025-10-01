// apps/frontend/src/utils/micDeviceManager.ts
/*
This utility will:
>   List available microphones
>   Provide labels and deviceIds
>   Handle permission prompts when needed
*/

export async function getAvailableMicrophones(): Promise<MediaDeviceInfo[]> {
  try {
    // Ensure permissions are granted before calling enumerateDevices
    await navigator.mediaDevices.getUserMedia({ audio: true });

    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter((device) => device.kind === "audioinput");
    return audioInputs;
  } catch (error) {
    console.error("[MicDeviceManager] Error getting microphones:", error);
    return [];
  }
}
