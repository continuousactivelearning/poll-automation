// Simple test to verify console capture is working
// Run this in browser console after the page loads

console.log('🧪 Testing console capture...');

// Wait a moment then test
setTimeout(() => {
  // Create a mock transcript object matching the exact structure
  const mockTranscript = {
    type: 'final',
    meetingId: 'test-room-id',
    role: 'host',
    participantId: 'test-host-123',
    displayName: 'Test User',
    text: 'This is a manual test transcript to verify console capture works.',
    startTime: Date.now() - 2000,
    endTime: Date.now(),
    timestamp: Date.now()
  };
  
  // Log it exactly like AudioCapture does
  console.log('📝 [AUDIOCAPTURE] Received transcript:', mockTranscript);
  
  // Check if it was captured
  setTimeout(() => {
    const stored = localStorage.getItem('transcripts-test-room-id');
    if (stored) {
      console.log('✅ Console capture test PASSED - transcript found in localStorage');
      console.log('📦 Stored transcripts:', JSON.parse(stored));
    } else {
      console.log('❌ Console capture test FAILED - no transcript in localStorage');
    }
  }, 1000);
}, 2000);