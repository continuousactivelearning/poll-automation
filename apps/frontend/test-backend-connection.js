// Quick Frontend-Backend Connection Test
// Run this in the browser console on http://localhost:5174

console.log("🔗 [CONNECTION-TEST] Testing frontend-to-backend connection...");

async function testBackendConnection() {
  try {
    // Test 1: Direct backend connection
    console.log("📡 [TEST-1] Testing direct backend connection...");
    const directResponse = await fetch('http://localhost:8000/api/transcripts/test-meeting', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    console.log(`🔗 [TEST-1] Direct backend response: ${directResponse.status} ${directResponse.statusText}`);
    
    // Test 2: Through Vite proxy
    console.log("📡 [TEST-2] Testing through Vite proxy...");
    const proxyResponse = await fetch('/api/transcripts/test-meeting', {
      method: 'GET', 
      headers: { 'Accept': 'application/json' }
    });
    console.log(`🔗 [TEST-2] Proxy response: ${proxyResponse.status} ${proxyResponse.statusText}`);

    // Test 3: POST to save transcripts
    console.log("📡 [TEST-3] Testing transcript save through proxy...");
    const saveResponse = await fetch('/api/transcripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingId: "connection-test-meeting",
        role: "host",
        participantId: "test-participant",
        transcripts: [{
          text: "This is a connection test transcript to verify frontend-backend communication",
          type: "final",
          startTime: Date.now() - 2000,
          endTime: Date.now(),
          timestamp: Date.now()
        }]
      })
    });

    if (saveResponse.ok) {
      const saveResult = await saveResponse.json();
      console.log("✅ [TEST-3] SUCCESS: Transcript save successful!");
      console.log("📊 [TEST-3] Save result:", saveResult);
    } else {
      const errorText = await saveResponse.text();
      console.log(`❌ [TEST-3] FAILED: ${saveResponse.status} ${saveResponse.statusText}`);
      console.log("📝 [TEST-3] Error:", errorText);
    }

  } catch (error) {
    console.error("💥 [CONNECTION-TEST] Error:", error);
  }
}

testBackendConnection();
console.log("⏳ [CONNECTION-TEST] Running tests... check results above");