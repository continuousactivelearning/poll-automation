#!/bin/bash
# Clear content from test files (keeping files for safe testing before deletion)

echo "Clearing frontend test files..."
echo "// File cleared - pending deletion after testing" > frontend/test-transcript-capture.js
echo "// File cleared - pending deletion after testing" > frontend/test-manual-console-capture.js
echo "// File cleared - pending deletion after testing" > frontend/test-console-capture.js
echo "// File cleared - pending deletion after testing" > frontend/test-backend-connection.js
echo "// File cleared - pending deletion after testing" > frontend/simple-console-test.js
echo "// File cleared - pending deletion after testing" > frontend/manual-test-real-transcript.js
echo "// File cleared - pending deletion after testing" > frontend/enhanced-console-test.js
echo "// File cleared - pending deletion after testing" > frontend/e2e-transcript-test.js
echo "// File cleared - pending deletion after testing" > frontend/debug-console-test.js
echo "// File cleared - pending deletion after testing" > frontend/console-test-final.js
echo "// File cleared - pending deletion after testing" > frontend/comprehensive-test.js
echo "<!-- File cleared - pending deletion after testing -->" > frontend/test-transcript-capture.html
echo "<!-- File cleared - pending deletion after testing -->" > frontend/public/speech-test.html

echo "Clearing backend test files..."
echo "// File cleared - pending deletion after testing" > backend/test-question-generation.js
echo "// File cleared - pending deletion after testing" > backend/test-gemini-models.js
echo "// File cleared - pending deletion after testing" > backend/test-client.ts
echo "// File cleared - pending deletion after testing" > backend/test-client-streaming.ts
echo "// File cleared - pending deletion after testing" > backend/test-asr-client.js
echo "// File cleared - pending deletion after testing" > backend/test-service-manager.js
echo "// File cleared - pending deletion after testing" > backend/direct-test.ts
echo "// File cleared - pending deletion after testing" > backend/src/__tests__/index.test.ts

echo "Clearing backup files..."
echo "// Backup file cleared - pending deletion after testing" > frontend/src/pages/AIQuestionFeed.backup.tsx
echo "// Backup file cleared - pending deletion after testing" > frontend/src/hooks/useTranscriptCapture.backup.ts
echo "// Backup file cleared - pending deletion after testing" > frontend/src/pages/AudioCapture.tsx.bak

echo "Clearing unused page files..."
echo "// Unused page - cleared for deletion after testing" > frontend/src/pages/CreatePollPage_NEW.tsx
echo "// Unused page - cleared for deletion after testing" > frontend/src/pages/AIQuestionFeedLocal.tsx
echo "// Unused page - cleared for deletion after testing" > frontend/src/pages/GlobalAudioTest.tsx

echo "Clearing old build scripts..."
echo "# Old build script - cleared for deletion after testing" > backend/render-build.sh
echo "# Old build script - cleared for deletion after testing" > backend/render-build-types-fix.sh
echo "# Old build script - cleared for deletion after testing" > backend/render-build-new.sh
echo "# Old build script - cleared for deletion after testing" > backend/render-build-fixed.sh

echo "‚úÖ All files cleared! Files are kept as placeholders for safe testing."
echo "Ì≥ù Total files cleared: 30"
echo ""
echo "Next steps:"
echo "1. Test all features thoroughly"
echo "2. If everything works, delete these files permanently"
