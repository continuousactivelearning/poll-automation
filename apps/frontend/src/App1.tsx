
import UploadWAV from "./components/UploadWAV";
import { HostSettings } from "./components/HostSettings";
import TranscriptListener from "./components/TranscriptListener";
import MicSettingsManager from "./components/MicSettingsManager";

function App() {
  return (
    <div className="p-4 space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-4">Audio Upload</h1>
        <UploadWAV />
        <MicSettingsManager
  meetingId="meeting123"
  speaker="host"
  onTranscription={(data) => console.log("Transcription:", data)}
  onStreamEnd={() => console.log("Stream ended")}
  onError={(err) => console.error("Error:", err)}
/>
      </section>

      <section>
        <div className="App">
      <HostSettings />
    </div>
      </section>
      <section>
        <div className="App">
       <TranscriptListener />
    </div>
      </section>
    </div>
  );
}

export default App;