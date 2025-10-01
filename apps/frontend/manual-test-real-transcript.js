// Manual test script for transcript capture
// Run this in the browser console while on AI Questions page

console.log("🧪 [MANUAL-TEST] Clearing localStorage and testing real transcript capture...");

// Clear all existing data
localStorage.removeItem('local-transcripts');
console.log("✅ [MANUAL-TEST] Cleared localStorage");

// Simulate the exact format from your voice recording logs
const realTranscript = {
  endTime: 1759075849648,
  meetingId: "test-room-id", 
  participantId: "68d77e7638e27a6a4f2d27c1",
  role: "host",
  startTime: 1759075849648,
  text: "means useful for generating the questions and now the system grows to was the man who grows to the man and the system in the all fight areas or gathering to what and the very first not we not at that the windows is best and LINUX and Macbook is very good for programming thank you",
  timestamp: 1759075849648,
  type: "final"
};

console.log("🎤 [MANUAL-TEST] Triggering console capture...");
console.log("📝 [AUDIOCAPTURE] Received transcript:", realTranscript);

// Check if it was captured
setTimeout(() => {
  const stored = localStorage.getItem('local-transcripts');
  if (stored) {
    const transcripts = JSON.parse(stored);
    const testRoomTranscripts = transcripts.filter(t => t.meetingId === 'test-room-id');
    console.log(`✅ [MANUAL-TEST] Found ${testRoomTranscripts.length} transcript(s) for test-room-id`);
    
    if (testRoomTranscripts.length > 0) {
      console.log("🎉 [MANUAL-TEST] SUCCESS! Real transcript was captured:");
      console.log("Captured:", testRoomTranscripts[testRoomTranscripts.length - 1]);
      
      // Trigger UI update
      window.dispatchEvent(new CustomEvent('transcript-captured', {
        detail: { 
          text: realTranscript.text, 
          speaker: 'host', 
          timestamp: realTranscript.timestamp,
          meetingId: realTranscript.meetingId 
        }
      }));
      
      console.log("🔄 [MANUAL-TEST] Dispatched transcript-captured event");
    } else {
      console.log("❌ [MANUAL-TEST] FAILED: Real transcript was not captured");
    }
  } else {
    console.log("❌ [MANUAL-TEST] FAILED: No localStorage data found");
  }
  
  // Check the current meeting ID in the UI
  setTimeout(() => {
    console.log("🔍 [MANUAL-TEST] Check if AI Questions page switched to test-room-id");
    console.log("Current page should show 'test-room-id' and transcript count should be 1");
  }, 500);
}, 1000);