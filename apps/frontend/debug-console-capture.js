// Debug Console Capture System
// Run this in browser console on AI Questions page

console.log("🔧 [DEBUG] Starting console capture diagnosis...");

// Step 1: Check current console.log function
console.log("📋 [DEBUG] Current console.log:", console.log.toString().substring(0, 200));

// Step 2: Test basic console interception
const originalLog = console.log;
let interceptedCalls = [];

console.log = function(...args) {
  interceptedCalls.push({
    timestamp: Date.now(),
    args: args,
    joinedMessage: args.join(' ')
  });
  return originalLog.apply(console, args);
};

console.log("🧪 [DEBUG] Testing interception...");

// Step 3: Create the exact message format from your logs
const realTranscript = {
  endTime: 1759075849648,
  meetingId: "test-room-id", 
  participantId: "68d77e7638e27a6a4f2d27c1",
  role: "host",
  startTime: 1759075849648,
  text: "means useful for generating the questions and now the system grows to was the man who grows to the man and the system in the all fight areas or gathering to what and the very first not we not at that the windows is best and LINUX and Macbook is very good for programming thank you",
  timestamp: 1759075849648,
  type: "final"
};

console.log("📝 [AUDIOCAPTURE] Received transcript:", realTranscript);

// Step 4: Analyze what we captured
setTimeout(() => {
  console.log("🔍 [DEBUG] Analysis Results:");
  console.log(`📊 [DEBUG] Intercepted ${interceptedCalls.length} console calls`);
  
  interceptedCalls.forEach((call, index) => {
    console.log(`🔢 [DEBUG] Call ${index + 1}:`, {
      argsCount: call.args.length,
      firstArg: call.args[0],
      hasAUDIOCAPTURE: call.joinedMessage.includes('[AUDIOCAPTURE]'),
      hasTranscript: call.joinedMessage.includes('Received transcript:'),
      secondArgType: typeof call.args[1],
      secondArg: call.args[1]
    });
  });

  // Step 5: Test the exact detection logic from useTranscriptCapture
  const audioCaptureCall = interceptedCalls.find(call => 
    call.joinedMessage.includes('[AUDIOCAPTURE]') && 
    call.joinedMessage.includes('Received transcript:')
  );

  if (audioCaptureCall) {
    console.log("✅ [DEBUG] Found AUDIOCAPTURE call!");
    console.log("🔬 [DEBUG] Testing detection logic...");
    
    // Mimic the exact logic from useTranscriptCapture
    const args = audioCaptureCall.args;
    let transcriptObject = null;
    
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      console.log(`🧪 [DEBUG] Arg[${i}]:`, {
        type: typeof arg,
        isObject: typeof arg === 'object',
        hasText: arg && arg.text,
        hasTranscript: arg && arg.transcript,
        hasMeetingId: arg && arg.meetingId,
        isTranscriptObject: arg && typeof arg === 'object' && (arg.text || arg.transcript) && arg.meetingId
      });
      
      if (arg && 
          typeof arg === 'object' && 
          (arg.text || arg.transcript) && 
          arg.meetingId) {
        transcriptObject = arg;
        console.log(`🎯 [DEBUG] Found transcript object at arg[${i}]!`);
        break;
      }
    }
    
    if (transcriptObject) {
      console.log("🏆 [DEBUG] SUCCESS - Detection logic works!");
      console.log("📋 [DEBUG] Transcript object:", transcriptObject);
      
      // Check localStorage
      setTimeout(() => {
        const stored = localStorage.getItem('local-transcripts');
        if (stored) {
          const transcripts = JSON.parse(stored);
          const testRoomTranscripts = transcripts.filter(t => t.meetingId === 'test-room-id');
          console.log(`💾 [DEBUG] Found ${testRoomTranscripts.length} transcripts in localStorage for test-room-id`);
        } else {
          console.log("❌ [DEBUG] No transcripts found in localStorage");
        }
      }, 500);
      
    } else {
      console.log("❌ [DEBUG] FAILED - Could not detect transcript object");
    }
  } else {
    console.log("❌ [DEBUG] No AUDIOCAPTURE call found");
  }

  // Restore original console.log
  console.log = originalLog;
  console.log("🔄 [DEBUG] Restored original console.log");
  
}, 1000);

console.log("⏳ [DEBUG] Test running... results in 1 second");