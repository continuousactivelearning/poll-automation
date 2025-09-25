import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import config from "../config/websocket";

const IntegrationTest: React.FC = () => {
  // Socket.IO state
  const [socketIOConnected, setSocketIOConnected] = useState(false);
  const [socketIOMessages, setSocketIOMessages] = useState<string[]>([]);
  const socketIORef = useRef<any>(null);

  // WebSocket state
  const [webSocketConnected, setWebSocketConnected] = useState(false);
  const [webSocketMessages, setWebSocketMessages] = useState<string[]>([]);
  const webSocketRef = useRef<WebSocket | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io(config.socketIO.url, {
      transports: ["websocket", "polling"],
      timeout: 10000,
    });

    socketIORef.current = socket;

    socket.on("connect", () => {
      setSocketIOConnected(true);
      addSocketIOMessage("✅ Socket.IO connected successfully");
    });

    socket.on("disconnect", () => {
      setSocketIOConnected(false);
      addSocketIOMessage("❌ Socket.IO disconnected");
    });

    socket.on("connect_error", (error: any) => {
      addSocketIOMessage(`❌ Socket.IO connection error: ${error.message}`);
    });

    socket.on("initial-data", (data: any) => {
      addSocketIOMessage(`📊 Received initial data: ${JSON.stringify(data)}`);
    });

    socket.on("poll", (questions: any) => {
      addSocketIOMessage(`📝 New poll received: ${questions.length} questions`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const addSocketIOMessage = (message: string) => {
    setSocketIOMessages((prev) => [
      ...prev.slice(-9),
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const addWebSocketMessage = (message: string) => {
    setWebSocketMessages((prev) => [
      ...prev.slice(-9),
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const connectWebSocket = () => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }

    const ws = new WebSocket(config.webSocket.transcription);
    webSocketRef.current = ws;

    ws.onopen = () => {
      setWebSocketConnected(true);
      addWebSocketMessage("✅ WebSocket connected successfully");

      // Send start message
      const startMessage = {
        type: "start",
        guestId: "test-guest-" + Date.now(),
        meetingId: "test-meeting-" + Date.now(),
      };
      ws.send(JSON.stringify(startMessage));
      addWebSocketMessage(
        `📤 Sent start message: ${JSON.stringify(startMessage)}`,
      );
    };

    ws.onclose = () => {
      setWebSocketConnected(false);
      addWebSocketMessage("❌ WebSocket disconnected");
    };

    ws.onerror = (error) => {
      addWebSocketMessage(`❌ WebSocket error: ${error}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addWebSocketMessage(`📨 Received: ${JSON.stringify(data)}`);
      } catch (e) {
        addWebSocketMessage(
          `📨 Received binary data: ${event.data.length} bytes`,
        );
      }
    };
  };

  const disconnectWebSocket = () => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }
  };

  const requestInitialData = () => {
    if (socketIORef.current && socketIOConnected) {
      socketIORef.current.emit("request-initial-data");
      addSocketIOMessage("📤 Requested initial data");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        🔌 WebSocket Integration Test
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Socket.IO Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span
              className={`w-3 h-3 rounded-full mr-2 ${socketIOConnected ? "bg-green-500" : "bg-red-500"}`}
            ></span>
            Socket.IO (Poll Management)
          </h2>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              URL: {config.socketIO.url}
            </p>
            <p
              className={`text-sm font-medium ${socketIOConnected ? "text-green-600" : "text-red-600"}`}
            >
              Status: {socketIOConnected ? "Connected" : "Disconnected"}
            </p>
          </div>

          <div className="space-y-2 mb-4">
            <button
              onClick={requestInitialData}
              disabled={!socketIOConnected}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Request Initial Data
            </button>
          </div>

          <div className="bg-gray-100 p-3 rounded h-48 overflow-y-auto">
            <h3 className="font-medium text-sm mb-2">Messages:</h3>
            {socketIOMessages.length === 0 ? (
              <p className="text-gray-500 text-sm">No messages yet...</p>
            ) : (
              socketIOMessages.map((msg, idx) => (
                <div key={idx} className="text-xs mb-1 font-mono">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>

        {/* WebSocket Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span
              className={`w-3 h-3 rounded-full mr-2 ${webSocketConnected ? "bg-green-500" : "bg-red-500"}`}
            ></span>
            WebSocket (Transcription)
          </h2>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              URL: {config.webSocket.transcription}
            </p>
            <p
              className={`text-sm font-medium ${webSocketConnected ? "text-green-600" : "text-red-600"}`}
            >
              Status: {webSocketConnected ? "Connected" : "Disconnected"}
            </p>
          </div>

          <div className="space-y-2 mb-4">
            <button
              onClick={connectWebSocket}
              disabled={webSocketConnected}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed mr-2"
            >
              Connect
            </button>
            <button
              onClick={disconnectWebSocket}
              disabled={!webSocketConnected}
              className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Disconnect
            </button>
          </div>

          <div className="bg-gray-100 p-3 rounded h-48 overflow-y-auto">
            <h3 className="font-medium text-sm mb-2">Messages:</h3>
            {webSocketMessages.length === 0 ? (
              <p className="text-gray-500 text-sm">No messages yet...</p>
            ) : (
              webSocketMessages.map((msg, idx) => (
                <div key={idx} className="text-xs mb-1 font-mono">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-800 mb-2">Integration Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Socket.IO (Polls):</span>
            <span
              className={`ml-2 ${socketIOConnected ? "text-green-600" : "text-red-600"}`}
            >
              {socketIOConnected ? "✅ Active" : "❌ Inactive"}
            </span>
          </div>
          <div>
            <span className="font-medium">WebSocket (Transcription):</span>
            <span
              className={`ml-2 ${webSocketConnected ? "text-green-600" : "text-red-600"}`}
            >
              {webSocketConnected ? "✅ Active" : "❌ Inactive"}
            </span>
          </div>
        </div>
        <p className="text-blue-700 text-sm mt-2">
          {socketIOConnected && webSocketConnected
            ? "🎉 Both systems are working correctly!"
            : "Some systems are not connected. Check the console for errors."}
        </p>
      </div>
    </div>
  );
};

export default IntegrationTest;
