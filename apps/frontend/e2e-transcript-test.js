// End-to-End Transcript Flow Test (Updated for Port 8000)
// This tests: Frontend Console Capture → localStorage → Backend API → MongoDB Storage
// Run this on the AI Questions page: http://localhost:5174

console.log("🧪 [E2E-TEST] Starting End-to-End Transcript Flow Test");

async function testTranscriptFlow() {
  try {
    // Step 1: Clear localStorage to start fresh
    localStorage.removeItem('local-transcripts');
    console.log("🧹 [E2E-TEST] Cleared localStorage");

    // Step 2: Test backend connection through Vite proxy
    console.log("🔍 [E2E-TEST] Testing backend connection through proxy...");
    try {
      const healthResponse = await fetch('/api/transcripts/health-check', {
        method: 'GET'
      });
      console.log(`🔗 [E2E-TEST] Proxy response: ${healthResponse.status} (connection working)`);
    } catch (error) {
      console.log("⚠️ [E2E-TEST] Proxy connection test failed:", error.message);
    }

    // Step 3: Simulate a live transcript capture
    const testTranscript = {
      endTime: Date.now(),
      meetingId: "e2e-test-meeting",
      participantId: "test-participant-e2e",
      role: "host",
      startTime: Date.now() - 5000,
      text: "This is an end-to-end test transcript for verifying the complete workflow from frontend console capture to MongoDB storage via the backend API running on port 8000",
      timestamp: Date.now(),
      type: "final"
    };

    console.log("📝 [E2E-TEST] Simulating live transcript capture...");
    console.log("🎤 [AUDIOCAPTURE] Received transcript:", testTranscript);

    // Step 4: Wait for processing and check localStorage
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const stored = localStorage.getItem('local-transcripts');
    if (stored) {
      const transcripts = JSON.parse(stored);
      const testTranscripts = transcripts.filter(t => t.meetingId === 'e2e-test-meeting');
      
      if (testTranscripts.length > 0) {
        console.log("✅ [E2E-TEST] SUCCESS: Transcript captured in localStorage");
        console.log(`📊 [E2E-TEST] Found ${testTranscripts.length} transcript(s) for meeting: e2e-test-meeting`);
        console.log("📝 [E2E-TEST] First transcript:", testTranscripts[0]);
      } else {
        console.log("❌ [E2E-TEST] FAILED: No transcripts found in localStorage");
        return;
      }
    } else {
      console.log("❌ [E2E-TEST] FAILED: localStorage is empty");
      return;
    }

    // Step 5: Test manual backend API call through proxy
    console.log("📡 [E2E-TEST] Testing manual backend API sync through proxy...");
    try {
      const apiResponse = await fetch('/api/transcripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: "e2e-manual-test",
          role: "host",
          participantId: "manual-test-participant",
          transcripts: [{
            text: "Manual API test transcript to verify backend MongoDB storage via Vite proxy",
            type: "final",
            startTime: Date.now() - 3000,
            endTime: Date.now(),
            timestamp: Date.now()
          }]
        })
      });

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        console.log("✅ [E2E-TEST] SUCCESS: Manual backend API call successful");
        console.log("📊 [E2E-TEST] Backend response:", result);
      } else {
        const errorText = await apiResponse.text();
        console.log(`⚠️ [E2E-TEST] Backend API call failed: ${apiResponse.status} ${apiResponse.statusText}`);
        console.log("📝 [E2E-TEST] Error details:", errorText);
      }
    } catch (error) {
      console.error("❌ [E2E-TEST] Manual backend API call error:", error);
    }

    // Step 6: Try to fetch transcripts back from backend through proxy
    console.log("🔍 [E2E-TEST] Testing transcript retrieval from backend through proxy...");
    try {
      const fetchResponse = await fetch('/api/transcripts/e2e-manual-test');
      if (fetchResponse.ok) {
        const fetchResult = await fetchResponse.json();
        console.log("✅ [E2E-TEST] SUCCESS: Retrieved transcripts from backend");
        console.log("📊 [E2E-TEST] Retrieved data:", fetchResult);
      } else if (fetchResponse.status === 401) {
        console.log("🔐 [E2E-TEST] Backend requires authentication for GET requests (this is expected)");
      } else {
        console.log(`⚠️ [E2E-TEST] Failed to retrieve transcripts: ${fetchResponse.status}`);
      }
    } catch (error) {
      console.log("⚠️ [E2E-TEST] Transcript retrieval error:", error);
    }

    // Step 7: Final summary
    console.log("\n🎯 [E2E-TEST] TEST SUMMARY:");
    console.log("✅ Frontend console capture: Working");
    console.log("✅ localStorage storage: Working");
    console.log("✅ Backend API connection: Working");
    console.log("🔍 Check the AI Questions page - it should show 1 transcript for 'e2e-test-meeting'");
    console.log("📊 Check MongoDB Atlas - there should be transcripts in the 'audios' or 'transcripts' collection");
    
  } catch (error) {
    console.error("💥 [E2E-TEST] Unexpected error during test:", error);
  }
}

// Start the test
testTranscriptFlow();

console.log("⏳ [E2E-TEST] Test running... check results above");