import cron from "node-cron";
import chalk from "chalk";

const TRANSCRIPTS = [
  "NASA confirms water traces.",
  "ISRO plans next lunar mission.",
  "SpaceX announces Starship launch."
];

let i = 0;

cron.schedule("*/2 * * * *", () => {
  console.log(chalk.green(`[CRON] ${new Date().toLocaleTimeString()} - ${TRANSCRIPTS[i % TRANSCRIPTS.length]}`));
  i++;
});

console.log(chalk.yellow("🔁 Cron job running every 2 mins"));
