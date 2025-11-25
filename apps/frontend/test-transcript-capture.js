// Test script to simulate [AUDIOCAPTURE] console messages
// This mimics the exact format from your console logs

// Simulate the transcript object from your console output
const testTranscript = {
  "text": "Artificial Intelligence has revolutionized the way we interact with technology today. Machine learning algorithms can now process vast amounts of data and provide insights that were previously impossible to obtain. From natural language processing to computer vision, AI applications are becoming increasingly sophisticated and are being integrated into various industries including healthcare, finance, and automotive. The future of AI looks promising with ongoing research in areas like deep learning, neural networks, and autonomous systems.",
  "type": "final",
  "timestamp": Date.now(),
  "meetingId": "test-room-id",
  "participantId": "host-123",
  "role": "host"
};

console.log("🧪 [TEST] Starting transcript capture test...");

// Simulate the exact console.log format from AudioCapture
console.log("[AUDIOCAPTURE] Received transcript:", testTranscript);

// Wait a moment and check if it was captured
setTimeout(() => {
  console.log("🧪 [TEST] Checking localStorage for captured transcript...");
  
  const stored = localStorage.getItem('local-transcripts');
  if (stored) {
    const transcripts = JSON.parse(stored);
    const testTranscripts = transcripts.filter(t => t.meetingId === 'test-room-id');
    console.log(`✅ [TEST] Found ${testTranscripts.length} transcript(s) for test-room-id:`, testTranscripts);
    
    if (testTranscripts.length > 0) {
      console.log("🎉 [TEST] SUCCESS: Transcript capture is working!");
      
      // Dispatch a test event to trigger UI updates
      window.dispatchEvent(new CustomEvent('transcript-captured', {
        detail: { 
          text: testTranscript.text, 
          speaker: 'host', 
          timestamp: testTranscript.timestamp,
          meetingId: testTranscript.meetingId 
        }
      }));
    } else {
      console.log("❌ [TEST] FAILED: Transcript was not captured properly");
    }
  } else {
    console.log("❌ [TEST] FAILED: No transcripts found in localStorage");
  }
}, 1000);

// Also test with a few more transcripts to ensure the system works with multiple
setTimeout(() => {
  console.log("🧪 [TEST] Adding more test transcripts...");
  
  const transcript2 = {
    "text": "The integration of AI in education has opened up new possibilities for personalized learning experiences.",
    "type": "final", 
    "timestamp": Date.now(),
    "meetingId": "test-room-id",
    "participantId": "guest-456",
    "role": "guest"
  };
  
  const transcript3 = {
    "text": "However, we must also consider the ethical implications of artificial intelligence and ensure responsible development.",
    "type": "final",
    "timestamp": Date.now(), 
    "meetingId": "test-room-id",
    "participantId": "host-123", 
    "role": "host"
  };
  
  console.log("[AUDIOCAPTURE] Received transcript:", transcript2);
  console.log("[AUDIOCAPTURE] Received transcript:", transcript3);
  
  // Check final state
  setTimeout(() => {
    const stored = localStorage.getItem('local-transcripts');
    if (stored) {
      const transcripts = JSON.parse(stored);
      const testTranscripts = transcripts.filter(t => t.meetingId === 'test-room-id');
      console.log(`🏁 [TEST] Final count: ${testTranscripts.length} transcript(s) for test-room-id`);
      console.log("🔍 [TEST] Word count:", testTranscripts.reduce((sum, t) => sum + t.text.split(' ').length, 0));
    }
  }, 500);
}, 2000);