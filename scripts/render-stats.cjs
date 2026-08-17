const { api } = require("@stats-organization/github-readme-stats-core/build/index.js");
const fs = require("fs");
const path = require("path");

const OPTIONS = {
  username: "Pa004",
  theme: "github-dark",
  hide_border: "true",
  show_icons: "true",
};
const OUTPUT = path.join("assets", "stats.svg");
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 30000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`Stats card render attempt ${attempt}`);
    try {
      const result = await api(OPTIONS);
      if (!String(result.status).startsWith("error") && result.content) {
        fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
        fs.writeFileSync(OUTPUT, result.content, "utf8");
        console.log("Stats card rendered OK");
        process.exit(0);
      }
      console.warn(`Renderer reported error: ${result.status}`);
    } catch (err) {
      console.warn(`Render threw: ${err.message}`);
    }
    if (attempt < MAX_ATTEMPTS) {
      console.log("Transient failure. Retrying in 30s...");
      await sleep(RETRY_DELAY_MS);
    }
  }
  console.error("Stats card still broken after all attempts");
  process.exit(1);
})();
