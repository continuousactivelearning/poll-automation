// uploadAndStream.ts
const WS_URL = import.meta.env.VITE_BACKEND_WS_URL || "ws://localhost:3000";

export async function uploadAndStreamWAV(file: File, meetingId: string, speaker: string) {
  return new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(WS_URL);
    socket.binaryType = "arraybuffer";

    socket.onopen = async () => {
      console.log("[Frontend→Backend WS] Connected to backend.");

      const metadata = { type: "start", meetingId, speaker };
      console.log("[Frontend→Backend WS] Sending metadata:", metadata);
      socket.send(JSON.stringify(metadata));

      const arrayBuffer = await file.arrayBuffer();
      console.log("[Frontend→Backend WS] Sending audio buffer...");
      socket.send(arrayBuffer);

      console.log("[Frontend→Backend WS] Audio buffer sent. Closing socket...");
      socket.close();
      resolve();
    };

    socket.onerror = (err) => {
      console.error("[Frontend→Backend WS] WebSocket error:", err);
      reject(err);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("[Frontend→Backend WS] Received message:", data);
    };
  });
}
