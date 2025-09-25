# Make the script executable:
# chmod +x start_servers_mac.sh

# Run the script:
# ./start_servers_mac.sh

#!/bin/bash

echo "🚀 Starting all servers in new Terminal tabs..."

WD="$(pwd)"

# AppleScript for macOS Terminal (you can switch to iTerm2 script below if needed)
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$WD' && pnpm --filter @poll-automation/backend dev"
    delay 2
    do script "cd '$WD' && pnpm --filter automatic-poll-system dev" in front window
    delay 2
    do script "cd '$WD' && pnpm --filter @poll-automation/whisper dev" in front window
    delay 2
    do script "cd '$WD' && pnpm --filter pollgen-llm dev" in front window
end tell
EOF
