import React from "react";
import PollQuestionsPage from "../components/student/PollQuestionsPage";

const TestPollPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-6">
      <div className="max-w-4xl mx-auto">
        <PollQuestionsPage
          roomCode="TEST-ROOM-123"
          onComplete={() => {
            console.log("Poll completed!");
            alert("Poll completed! Check the console for logs.");
          }}
        />
      </div>
    </div>
  );
};

export default TestPollPage;
