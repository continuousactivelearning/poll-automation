import { useEffect, useState } from "react";

const TranscriptListener = () => {
  const [transcript, setTranscript] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    // Connection to the WebSocket
    const socket = new WebSocket("ws://localhost:5001/ws/transcripts");

    socket.onopen = () => {
      console.log("Connected to transcript WebSocket");
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "updated") {
        console.log("📡 Transcript updated from backend via WebSocket!");
        try {
          
          // Fetching the updated transcript
          const res = await fetch("http://localhost:5001/transcripts");
          const json = await res.json();
          setTranscript(json.text);
          setLastUpdated(new Date().toLocaleTimeString());
          
          await fetch("http://localhost:5001/generate", { method: "POST" });

        } catch (err) {
          console.error("Failed to fetch updated transcript:", err);
        }
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div style={{
      maxWidth: "600px",
      margin: "2rem auto",
      padding: "1.5rem",
      borderRadius: "12px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
      backgroundColor: "#fff"
    }}>
      <h2 style={{ color: "#4f46e5" }}>🧾 Live Transcript Feed</h2>
      <p style={{ marginTop: "1rem", color: "#333" }}>{transcript || "Waiting for transcript..."}</p>
      {lastUpdated && (
        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
          Last Updated: {lastUpdated}
        </p>
      )}
    </div>
  );
};

export default TranscriptListener;
