// UploadWAV.tsx - Integrated with our current frontend
import React, { useState } from "react";
import { uploadAndStreamWAV } from "../utils/uploadAndStream";

interface UploadWAVProps {
  meetingId?: string;
  speaker?: string;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
  onUploadError?: (error: any) => void;
}

export default function UploadWAV({ 
  meetingId = "meeting123", 
  speaker = "host",
  onUploadStart,
  onUploadComplete,
  onUploadError
}: UploadWAVProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadStatus("Starting upload...");
    onUploadStart?.();
    
    console.log("[Frontend] Starting upload:", file.name);
    
    try {
      await uploadAndStreamWAV(file, meetingId, speaker);
      console.log("[Frontend] Upload complete.");
      setUploadStatus("Upload completed successfully!");
      onUploadComplete?.();
    } catch (err) {
      console.error("[Frontend] Upload failed:", err);
      setUploadStatus("Upload failed. Please try again.");
      onUploadError?.(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      console.log("[Frontend] File selected:", selectedFile.name);
      setFile(selectedFile);
      setUploadStatus("");
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🎵 Upload Audio File
        </h3>
        <p className="text-gray-600 text-sm">
          Upload a WAV file to process and generate polls
        </p>
      </div>

      <div className="space-y-4">
        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select WAV File
          </label>
          <input
            type="file"
            accept=".wav,audio/wav"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* File Info */}
        {file && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Selected:</strong> {file.name}
            </p>
            <p className="text-xs text-blue-600">
              Size: {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        {/* Upload Status */}
        {uploadStatus && (
          <div className={`border rounded-lg p-3 ${
            uploadStatus.includes("failed") 
              ? "bg-red-50 border-red-200 text-red-800" 
              : uploadStatus.includes("completed")
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-yellow-50 border-yellow-200 text-yellow-800"
          }`}>
            <p className="text-sm">{uploadStatus}</p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
        >
          {isUploading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </div>
          ) : (
            "🚀 Upload & Process WAV"
          )}
        </button>

        {/* Meeting Info */}
        <div className="text-xs text-gray-500 text-center">
          Meeting ID: {meetingId} | Speaker: {speaker}
        </div>
      </div>
    </div>
  );
}
