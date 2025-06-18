// Example React Component
import React, { useState, useRef } from 'react';
import { MicrophoneStreamer } from '../utils/microphoneStream'; // Adjust path

// Import the TranscriptionResult type from microphoneStream to match the interface
interface TranscriptionResult {
    type: string;
    meetingId: string;
    speaker: string;
    text: string;
    segment_start: number;
    segment_end: number;
    language: string;
    is_final: boolean;
}

const LiveTranscriptionComponent: React.FC = () => {
    const [transcriptions, setTranscriptions] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const streamerRef = useRef<MicrophoneStreamer | null>(null);

    const meetingId = "live_meeting_123"; // Replace with dynamic ID
    const speaker = "Host"; // Replace with dynamic speaker name

    const handleTranscription = (data: TranscriptionResult) => {
        console.log("Received transcription:", data.text);
        // You'll likely want to display these incrementally
        setTranscriptions(prev => [...prev, data.text]); 
        // Logic for poll generation based on data.text can go here
        // e.g., check for keywords: if (data.text.toLowerCase().includes("poll")) { triggerPoll(); }
    };

    const handleStreamEnd = () => {
        console.log("Live stream ended.");
        setIsRecording(false);
        // Clean up UI, finalize transcriptions
    };

    const handleError = (error: Error | Event | unknown) => {
        console.error("Streaming error:", error);
        setIsRecording(false);
        // Display error message to user
    };

    const startRecording = async () => {
        setTranscriptions([]); // Clear previous transcriptions
        streamerRef.current = new MicrophoneStreamer(
            meetingId,
            speaker,
            handleTranscription,
            handleStreamEnd,
            handleError
        );
        await streamerRef.current.startStreaming();
        setIsRecording(true);
    };

    const stopRecording = () => {
        streamerRef.current?.stopStreaming(true); // Send 'end' signal
        setIsRecording(false);
    };

    return (
        <div>
            <h1>Live Host Transcription</h1>
            <button onClick={startRecording} disabled={isRecording}>
                Start Speaking
            </button>
            <button onClick={stopRecording} disabled={!isRecording}>
                Stop Speaking
            </button>
            <div>
                <h2>Transcriptions:</h2>
                {transcriptions.length === 0 && <p>No speech detected yet or recording not started.</p>}
                {transcriptions.map((text, index) => (
                    <p key={index}>{text}</p>
                ))}
            </div>
        </div>
    );
};

export default LiveTranscriptionComponent;