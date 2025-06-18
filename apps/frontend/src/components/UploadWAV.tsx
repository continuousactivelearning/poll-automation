// UploadWAV.tsx
import { useState } from "react";
import { uploadAndStreamWAV } from "../utils/uploadAndStream";

export default function UploadWAV() {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    console.log("[Frontend] Starting upload:", file.name);
    try {
      await uploadAndStreamWAV(file, "meeting123", "host");
      console.log("[Frontend] Upload complete.");
    } catch (err) {
      console.error("[Frontend] Upload failed:", err);
    }
  };

  return (
    <div className="p-4">
      <input
        type="file"
        accept=".wav"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            console.log("[Frontend] File selected:", e.target.files[0].name);
            setFile(e.target.files[0]);
          }
        }}
      />
      <button onClick={handleUpload} disabled={!file}>
        Send WAV
      </button>
    </div>
  );
}
