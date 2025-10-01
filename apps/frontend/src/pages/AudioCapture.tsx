import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import AudioCapture from "../components/AudioCapture";

const AudioCapturePage = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <AudioCapture />
      </div>
    </DashboardLayout>
  );
};

export default AudioCapturePage;
