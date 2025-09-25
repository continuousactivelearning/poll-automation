// Frontend configuration for WebSocket connections
export const config = {
  // Socket.IO for poll management and real-time updates
  socketIO: {
    url: import.meta.env.VITE_SOCKETIO_URL || "http://localhost:3000",
    options: {
      transports: ["websocket", "polling"],
      timeout: 10000,
      forceNew: true,
      autoConnect: true,
    },
  },

  // Native WebSocket for AI transcription
  webSocket: {
    transcription:
      import.meta.env.VITE_BACKEND_WS_URL ||
      "ws://localhost:3001/transcription",
    transcriptionGuest:
      import.meta.env.VITE_BACKEND_WS_URL_GUEST ||
      "ws://localhost:3001/transcription",
  },

  // API endpoints
  api: {
    baseUrl: import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3000",
  },

  // Audio settings
  audio: {
    chunkInterval: parseInt(import.meta.env.VITE_CHUNK_INTERVAL || "30000"),
  },
};

export default config;
