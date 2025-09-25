# Make the script executable:
# chmod +x start_servers_linux.sh

# Run the script:
# ./start_servers_linux.sh

#!/bin/bash

echo "🚀 Starting all servers in new GNOME Terminal tabs..."

WD="$(pwd)"

gnome-terminal \
    --tab --title="Backend" -- bash -c "cd '$WD'; pnpm --filter @poll-automation/backend dev; exec bash" \
    --tab --title="Frontend" -- bash -c "cd '$WD'; pnpm --filter automatic-poll-system dev; exec bash" \
    --tab --title="Whisper" -- bash -c "cd '$WD'; pnpm --filter @poll-automation/whisper dev; exec bash" \
    --tab --title="LLM" -- bash -c "cd '$WD'; pnpm --filter pollgen-llm dev; exec bash"
