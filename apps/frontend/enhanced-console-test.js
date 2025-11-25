// Enhanced Console Capture Test
// Run this on the AI Questions page after opening browser console

console.log("🧪 [TEST] Starting enhanced console capture test...");

// Clear localStorage to start fresh
localStorage.removeItem('local-transcripts');
console.log("🧹 [TEST] Cleared localStorage");

// Wait a moment then test
setTimeout(() => {
  // Test the new improved console capture
  const testTranscript = {
    endTime: Date.now(),
    meetingId: "test-room-id",
    participantId: "test-participant-123",
    role: "host",
    startTime: Date.now() - 5000,
    text: "This is an enhanced test transcript about JavaScript programming and React development for web applications",
    timestamp: Date.now(),
    type: "final"
  };

  console.log("🔥 [TEST] Triggering AUDIOCAPTURE message...");
  console.log("📝 [AUDIOCAPTURE] Received transcript:", testTranscript);

  // Check results after processing
  setTimeout(() => {
    const stored = localStorage.getItem('local-transcripts');
    if (stored) {
      const transcripts = JSON.parse(stored);
      const testRoomTranscripts = transcripts.filter(t => t.meetingId === 'test-room-id');
      
      console.log(`🎯 [TEST] RESULTS:`);
      console.log(`✅ Total stored transcripts: ${transcripts.length}`);
      console.log(`✅ Test-room-id transcripts: ${testRoomTranscripts.length}`);
      
      if (testRoomTranscripts.length > 0) {
        console.log(`🏆 [TEST] SUCCESS! Console capture working!`);
        console.log(`📋 [TEST] First transcript:`, testRoomTranscripts[0]);
      } else {
        console.log(`❌ [TEST] FAILED - Console capture not working`);
        console.log(`💡 [TEST] Check for console.log override conflicts`);
      }
    } else {
      console.log(`❌ [TEST] FAILED - No transcripts in localStorage at all`);
    }

    // Also test if the page shows the transcript count
    setTimeout(() => {
      console.log(`🔍 [TEST] Check the UI - the AI Questions page should now show "1 transcript found" and enabled Generate Questions button`);
    }, 500);

  }, 1000);

}, 1000);

console.log("⏳ [TEST] Test will run in 1 second, results in 2-3 seconds...");