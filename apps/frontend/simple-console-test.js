// Test console capture - run this in browser console on AI Questions page
console.log("🧪 [TEST] Testing console capture detection...");

// Test 1: Simple test message
console.log("📝 [AUDIOCAPTURE] Received transcript:", { test: "message" });

// Test 2: Real transcript format from your logs
const testTranscript = {
  endTime: 1759077087568,
  meetingId: "test-room-id",
  participantId: "68d77e7638e27a6a4f2d27c1", 
  role: "host",
  startTime: 1759077087568,
  text: "hello good morning to everyone today I will discuss about C language sing is a computer programming language which is used for singing songs and programming coding",
  timestamp: 1759077087568,
  type: "final"
};

console.log("📝 [AUDIOCAPTURE] Received transcript:", testTranscript);

// Wait and check localStorage
setTimeout(() => {
  const stored = localStorage.getItem('local-transcripts');
  if (stored) {
    const transcripts = JSON.parse(stored);
    console.log(`✅ [TEST] Found ${transcripts.length} transcript(s) in localStorage`);
    const testRoomTranscripts = transcripts.filter(t => t.meetingId === 'test-room-id');
    console.log(`✅ [TEST] Found ${testRoomTranscripts.length} transcript(s) for test-room-id`);
    
    if (testRoomTranscripts.length > 0) {
      console.log("🎉 [TEST] SUCCESS - Console capture is working!");
    } else {
      console.log("❌ [TEST] FAILED - Console capture not working");
    }
  } else {
    console.log("❌ [TEST] FAILED - No transcripts in localStorage");
  }
}, 1000);