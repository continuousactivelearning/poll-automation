# 🕒 Transcript Cron Job — Poll Automation

This module contains a scheduled **cron job** that simulates fetching transcript data every 2 minutes.  
It is part of the [`pollgen-llm`](../../) service within the [Poll Automation Monorepo](../../../..).

---

## 📌 Purpose

The cron job mimics periodic polling of a transcript service (e.g., Whisper or YouTube captions)  
and logs new transcript lines every 2 minutes to simulate real-time updates.

---

## 🧠 Features

- ⏰ Scheduled every 2 minutes using `node-cron`
- 🎨 Colored logging using `chalk`
- 🔁 Rotating mock transcript simulation
- 🧱 Modular structure — easily swappable with real transcript API

---

## 🗂️ File Structure

\`\`\`
cron/
├── fetchTranscript.ts   # Main cron job logic
└── README.md            # You’re here
\`\`\`

---

## 🚀 How to Run

From the monorepo root:

\`\`\`bash
pnpm dev -F pollgen-llm
\`\`\`

Ensure `fetchTranscript.ts` is imported in your entry file:

\`\`\`ts
import './cron/fetchTranscript';
\`\`\`

---

## 🔧 Future Enhancements

- Replace mock data with real transcript polling (e.g., Whisper API)
- Trigger LLM-based poll generation after fetching
- Log output to a DB or backend service

---

## 📦 Dependencies

- [node-cron](https://www.npmjs.com/package/node-cron)
- [chalk](https://www.npmjs.com/package/chalk)

---

## 🧑‍💻 Author

**Shaik Balaji Mahammad Rafi**  
Part of the [Poll Automation](https://github.com/Rafi-Luffy/poll-automation) project  
Licensed under [MIT](https://opensource.org/licenses/MIT)
