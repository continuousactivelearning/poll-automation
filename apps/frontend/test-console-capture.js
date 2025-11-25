// Test console capture functionality
console.log('Testing console capture system...');

const mockTranscriptMessage = {
  type: 'final',
  meetingId: 'test-room-id',
  role: 'host',
  participantId: 'host-123',
  displayName: 'Test Host',
  text: 'Hello, this is a test transcript message that should be captured by our system.',
  startTime: Date.now() - 5000,
  endTime: Date.now(),
  timestamp: Date.now()
};

console.log('📝 [AUDIOCAPTURE] Received transcript:', mockTranscriptMessage);

console.log('Test completed. Check if the transcript was captured in localStorage and synced to backend.');