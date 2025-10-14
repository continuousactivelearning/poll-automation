// Comprehensive end-to-end test for the live transcript capture and storage system
// This test simulates the exact behavior of AudioCapture.tsx

console.log('🧪 Starting comprehensive transcript capture test...');

// Test 1: Verify backend connectivity
async function testBackendConnection() {
  try {
    const response = await fetch('/api/transcripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingId: 'test-connection',
        role: 'host', 
        participantId: 'test-host',
        transcripts: [{
          meetingId: 'test-connection',
          role: 'host',
          participantId: 'test-host', 
          text: 'Backend connection test',
          type: 'final',
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          timestamp: Date.now()
        }]
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Backend connection test PASSED:', result);
      return true;
    } else {
      console.error('❌ Backend connection test FAILED:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Backend connection test ERROR:', error);
    return false;
  }
}

// Test 2: Simulate AudioCapture.tsx console output
function testConsoleCapture() {
  console.log('🎭 Testing console capture detection...');
  
  // This is the exact format that AudioCapture.tsx uses
  const mockTranscriptMessage = {
    type: 'final',
    meetingId: 'test-room-123',
    role: 'host',
    participantId: 'host-456', 
    displayName: 'Test Host',
    text: 'This is a test transcript that should be automatically captured and stored in the database.',
    startTime: Date.now() - 3000,
    endTime: Date.now(), 
    timestamp: Date.now()
  };

  // Simulate the exact console.log call from AudioCapture.tsx:109
  console.log('📝 [AUDIOCAPTURE] Received transcript:', mockTranscriptMessage);
  
  // Wait a moment then check localStorage
  setTimeout(() => {
    const stored = localStorage.getItem('transcripts-test-room-123');
    if (stored) {
      const transcripts = JSON.parse(stored);
      console.log('✅ Console capture test PASSED - found in localStorage:', transcripts.length, 'transcripts');
      
      // Check if our test transcript is there
      const found = transcripts.find(t => t.text.includes('This is a test transcript'));
      if (found) {
        console.log('✅ Test transcript found in storage:', found);
      } else {
        console.log('⚠️ Test transcript not found in storage');
      }
    } else {
      console.log('❌ Console capture test FAILED - no transcripts in localStorage');
    }
  }, 2000);
}

// Test 3: Check live transcript capture status
function checkTranscriptCapture() {
  console.log('🔍 Checking transcript capture system status...');
  
  // Check if useTranscriptCapture hook is active
  const event = new CustomEvent('transcript-test', { detail: 'testing' });
  window.dispatchEvent(event);
  
  // Check localStorage for existing transcripts
  const keys = Object.keys(localStorage).filter(key => key.startsWith('transcripts-'));
  console.log('📊 Found', keys.length, 'transcript storage keys:', keys);
  
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const transcripts = JSON.parse(data);
        console.log(`📝 ${key}: ${transcripts.length} transcripts stored`);
        if (transcripts.length > 0) {
          console.log('   Latest:', transcripts[transcripts.length - 1].text.substring(0, 50) + '...');
        }
      } catch (e) {
        console.log(`❌ ${key}: invalid JSON data`);
      }
    }
  });
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running comprehensive transcript system test...');
  console.log('⏰ Current time:', new Date().toLocaleString());
  
  // Test 1: Backend connection
  const backendOk = await testBackendConnection();
  
  // Test 2: Console capture 
  testConsoleCapture();
  
  // Test 3: System status
  checkTranscriptCapture();
  
  // Final summary
  setTimeout(() => {
    console.log('📋 TEST SUMMARY:');
    console.log('- Backend connection:', backendOk ? '✅ WORKING' : '❌ FAILED');
    console.log('- Console capture: Check results above');
    console.log('- Storage check: Check results above');
    console.log('');
    console.log('🎯 NEXT STEPS:');
    console.log('1. Go to your AudioCapture component and record some audio');
    console.log('2. Check console for AUDIOCAPTURE messages');  
    console.log('3. Verify transcripts appear in localStorage');
    console.log('4. Confirm transcripts are synced to MongoDB backend');
  }, 5000);
}

// Auto-run tests when this script loads
runAllTests();