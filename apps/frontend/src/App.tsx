import UploadWAV from "./components/UploadWAV";
import { HostSettingsComponent } from "./components/HostSettings";

function App() {
  return (
    <div className="p-4 space-y-8">
      {/* Existing Audio Upload Section */}
      <section>
        <h1 className="text-2xl font-bold mb-4">Audio Upload</h1>
        <UploadWAV />
      </section>

      {/* New Host Settings Section */}
      <section>
        <h1 className="text-2xl font-bold mb-4">Host Controls</h1>
        <HostSettingsComponent />
      </section>
    </div>
  );
}

export default App;