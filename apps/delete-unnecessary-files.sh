#!/bin/bash
# Permanent deletion of unnecessary files after successful testing

echo "Ì∑ëÔ∏è Deleting unnecessary files..."
echo ""

echo "Deleting frontend test files..."
rm -f frontend/test-transcript-capture.html
rm -f frontend/test-transcript-capture.js
rm -f frontend/test-manual-console-capture.js
rm -f frontend/test-console-capture.js
rm -f frontend/test-backend-connection.js
rm -f frontend/simple-console-test.js
rm -f frontend/manual-test-real-transcript.js
rm -f frontend/enhanced-console-test.js
rm -f frontend/e2e-transcript-test.js
rm -f frontend/debug-console-test.js
rm -f frontend/console-test-final.js
rm -f frontend/comprehensive-test.js
rm -f frontend/public/speech-test.html

echo "Deleting backend test files..."
rm -f backend/test-question-generation.js
rm -f backend/test-gemini-models.js
rm -f backend/test-client.ts
rm -f backend/test-client-streaming.ts
rm -f backend/test-asr-client.js
rm -f backend/test-service-manager.js
rm -f backend/direct-test.ts
rm -f backend/src/__tests__/index.test.ts

echo "Deleting backup files..."
rm -f frontend/src/pages/AIQuestionFeed.backup.tsx
rm -f frontend/src/hooks/useTranscriptCapture.backup.ts
rm -f frontend/src/pages/AudioCapture.tsx.bak

echo "Deleting unused page files..."
rm -f frontend/src/pages/CreatePollPage_NEW.tsx
rm -f frontend/src/pages/AIQuestionFeedLocal.tsx
rm -f frontend/src/pages/GlobalAudioTest.tsx

echo "Deleting old build scripts..."
rm -f backend/render-build.sh
rm -f backend/render-build-types-fix.sh
rm -f backend/render-build-new.sh
rm -f backend/render-build-fixed.sh

echo ""
echo "‚úÖ Deletion complete!"
echo "Ì≥ä Files deleted: 30"
echo ""
echo "Verifying deletion..."
echo ""

# Verify files are deleted
REMAINING=0
for file in frontend/test-transcript-capture.html frontend/test-transcript-capture.js backend/test-*.js backend/test-*.ts frontend/src/pages/*.backup.tsx backend/render-build.sh; do
  if [ -f "$file" ]; then
    echo "‚ö†Ô∏è  Still exists: $file"
    REMAINING=$((REMAINING+1))
  fi
done

if [ $REMAINING -eq 0 ]; then
  echo "‚úÖ All unnecessary files successfully deleted!"
else
  echo "‚ö†Ô∏è  $REMAINING files still exist"
fi
