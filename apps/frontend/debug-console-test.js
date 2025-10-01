// Debug script to test your exact console format
// Copy and paste this into your browser console while on the AI Questions page

console.log("🧪 [TEST] Starting debug test with your exact console format...");

// Simulate your exact console message format
const testTranscript = {
  type: 'final',
  meetingId: 'test-room-id',
  role: 'host',
  participantId: '68d77e7638e27a6a4f2d27c1',
  text: 'today we got discuss about artificial intelligence artificial intelligence is a branch of science activation intelligence is the father scope to ensure the human equiva it may the human brain it to gives examples of charge GPT thank you',
  timestamp: Date.now(),
  endTime: Date.now(),
  startTime: Date.now() - 5000,
  confidence: 0.878570556640625
};

console.log("🧪 [TEST] Simulating exact format from your logs...");

// Test the exact format from your console logs
console.log("📝 [AUDIOCAPTURE] Received transcript:", testTranscript);

// Also test without emoji
console.log("[AUDIOCAPTURE] Received transcript:", testTranscript);

// Check localStorage after a moment
setTimeout(() => {
  console.log("🔍 [TEST] Checking localStorage...");
  const stored = localStorage.getItem('local-transcripts');
  if (stored) {
    const transcripts = JSON.parse(stored);
    const testRoomTranscripts = transcripts.filter(t => t.meetingId === 'test-room-id');
    console.log(`✅ [TEST] Found ${testRoomTranscripts.length} transcripts for test-room-id:`, testRoomTranscripts);
    
    if (testRoomTranscripts.length > 0) {
      console.log("🎉 [TEST] SUCCESS: Transcript capture is working!");
      
      // Trigger a custom event to update the UI
      window.dispatchEvent(new CustomEvent('transcript-captured', {
        detail: { 
          text: testTranscript.text, 
          speaker: 'host', 
          timestamp: testTranscript.timestamp,
          meetingId: testTranscript.meetingId 
        }
      }));
    } else {
      console.log("❌ [TEST] FAILED: Transcript was not captured");
    }
  } else {
    console.log("❌ [TEST] FAILED: No transcripts in localStorage at all");
  }
}, 1000);

// Also check what console.log function is currently active
setTimeout(() => {
  console.log("🔍 [TEST] Checking console.log override status...");
  console.log("Console.log function:", console.log.toString().substring(0, 100) + "...");
}, 500);