import { useEffect, useState } from "react";
import io from "socket.io-client";
import config from "../config/websocket";

const WebSocketTest = () => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Connect to the Socket.IO server
    const newSocket = io(config.socketIO.url, {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to Socket.IO server");
      setConnected(true);
      setMessages((prev) => [...prev, "Connected to Socket.IO server"]);
    });

    newSocket.on("connect_error", (error: any) => {
      console.error("❌ Connection error:", error);
      setMessages((prev) => [...prev, `Connection error: ${error.message}`]);
    });

    newSocket.on("poll", (questions: any) => {
      console.log("📥 New Poll Received:", questions);
      setMessages((prev) => [
        ...prev,
        `New Poll Received: ${questions.length} questions`,
      ]);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from Socket.IO server");
      setConnected(false);
      setMessages((prev) => [...prev, "Disconnected from Socket.IO server"]);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  const triggerPoll = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/polls/test-send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const result = await response.json();
      setMessages((prev) => [
        ...prev,
        `Poll trigger result: ${JSON.stringify(result)}`,
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        `Error triggering poll: ${error instanceof Error ? error.message : "Unknown error"}`,
      ]);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">WebSocket Test</h1>

      <div className="mb-6">
        <div
          className={`inline-block px-4 py-2 rounded-lg ${
            connected
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          Status: {connected ? "Connected" : "Disconnected"}
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={triggerPoll}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Trigger Poll
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-bold mb-2">Messages:</h2>
        <div className="space-y-1">
          {messages.map((message, index) => (
            <div key={index} className="text-sm font-mono">
              {message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WebSocketTest;
