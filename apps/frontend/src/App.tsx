import UploadWAV from "./components/UploadWAV";
import { HostSettings } from "./components/HostSettings";
import TranscriptListener from "./components/TranscriptListener";
function App() {
  return (
    <div className="p-4 space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-4">Audio Upload</h1>
        <UploadWAV />
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