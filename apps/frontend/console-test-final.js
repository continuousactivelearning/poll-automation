// Test console command - run this in your browser console on the AI Questions page
console.log("🧪 [TEST] Testing transcript capture with exact format from your logs...");

// Simulate the exact transcript object from your console logs
const testTranscript = {
  endTime: 1759073879231,
  meetingId: "test-room-id", 
  participantId: "68d77e7638e27a6a4f2d27c1",
  role: "host",
  startTime: 1759073877231,
  text: "artificial intelligence and machine learning are revolutionary technologies that are transforming our world today",
  timestamp: 1759073879231,
  type: "final"
};

console.log("📝 [AUDIOCAPTURE] Received transcript:", testTranscript);

// Wait and check results
setTimeout(() => {
  const stored = localStorage.getItem('local-transcripts');
  if (stored) {
    const transcripts = JSON.parse(stored);
    const testRoomTranscripts = transcripts.filter(t => t.meetingId === 'test-room-id');
    console.log(`✅ [TEST] Found ${testRoomTranscripts.length} transcripts for test-room-id`);
    
    if (testRoomTranscripts.length > 0) {
      console.log("🎉 [TEST] SUCCESS: Console transcript capture is working!");
      console.log("Captured transcript:", testRoomTranscripts[testRoomTranscripts.length - 1]);
    } else {
      console.log("❌ [TEST] FAILED: Transcript not captured");
    }
  } else {
    console.log("❌ [TEST] FAILED: No localStorage data");
  }
}, 1000);