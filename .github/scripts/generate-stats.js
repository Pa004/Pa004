const fs = require("node:fs/promises");
const path = require("node:path");

const USERNAME = "Pa004";
const GITHUB_API = "https://api.github.com";
const TOP_LANGUAGES = 6;
const CARD_WIDTH = 480;
const FONT_STACK = '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif';

const COLORS = {
  bg: "#0d1117",
  border: "#30363d",
  text: "#e6edf3",
  muted: "#8b949e",
  track: "#21262d",
  accent: "#2f81f7",
};

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Dart: "#00B4AB",
  CSS: "#663399",
  HTML: "#e34c26",
  Shell: "#89e051",
  "Jupyter Notebook": "#DA5B0B",
  MDX: "#fcb32c",
  Dockerfile: "#384d54",
  PHP: "#4F5D95",
  Kotlin: "#A97BFF",
  Ruby: "#701516",
  Go: "#00ADD8",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
};

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "profile-readme-stats" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${url}`);
  return res.json();
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

function statsSvg(profile, repos) {
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const metrics = [
    ["Public repos", profile.public_repos],
    ["Stars", totalStars],
    ["Followers", profile.followers],
    ["Following", profile.following],
  ];

  const items = metrics
    .map(([label, value], i) => {
      const x = i % 2 === 0 ? 120 : 360;
      const y = i < 2 ? 90 : 150;
      return [
        `<text x="${x}" y="${y}" font-family='${FONT_STACK}' font-size="28" font-weight="700" text-anchor="middle" fill="${COLORS.text}">${esc(value)}</text>`,
        `<text x="${x}" y="${y + 28}" font-family='${FONT_STACK}' font-size="12" text-anchor="middle" fill="${COLORS.muted}">${esc(label)}</text>`,
      ].join("\n  ");
    })
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="194" viewBox="0 0 ${CARD_WIDTH} 194" role="img" aria-label="GitHub stats for ${USERNAME}">
  <rect x="0.5" y="0.5" width="${CARD_WIDTH - 1}" height="193" rx="12" fill="${COLORS.bg}" stroke="${COLORS.border}"/>
  <text x="24" y="34" font-family='${FONT_STACK}' font-size="16" font-weight="600" fill="${COLORS.text}">GitHub Stats</text>
  <rect x="24" y="44" width="48" height="3" rx="1.5" fill="${COLORS.accent}"/>
  ${items}
</svg>
`;
}

function languagesSvg(repos) {
  const counts = new Map();
  let total = 0;
  for (const repo of repos) {
    if (!repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) || 0) + 1);
    total += 1;
  }

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_LANGUAGES);
  const height = 60 + top.length * 30;

  const rows = top
    .map(([language, count], i) => {
      const y = 62 + i * 30;
      const percent = Math.round((count / total) * 100);
      const barWidth = Math.round((percent / 100) * 432);
      const color = LANGUAGE_COLORS[language] || "#8b949e";
      return [
        `<text x="24" y="${y}" font-family='${FONT_STACK}' font-size="13" font-weight="500" fill="${COLORS.text}">${esc(language)}</text>`,
        `<text x="456" y="${y}" font-family='${FONT_STACK}' font-size="12" text-anchor="end" fill="${COLORS.muted}">${percent}%</text>`,
        `<rect x="24" y="${y + 10}" width="432" height="6" rx="3" fill="${COLORS.track}"/>`,
        `<rect x="24" y="${y + 10}" width="${barWidth}" height="6" rx="3" fill="${color}"/>`,
      ].join("\n  ");
    })
    .join("\n  ");

  const body = top.length
    ? rows
    : `<text x="24" y="62" font-family='${FONT_STACK}' font-size="13" fill="${COLORS.muted}">No language data</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}" role="img" aria-label="Top languages for ${USERNAME}">
  <rect x="0.5" y="0.5" width="${CARD_WIDTH - 1}" height="${height - 1}" rx="12" fill="${COLORS.bg}" stroke="${COLORS.border}"/>
  <text x="24" y="34" font-family='${FONT_STACK}' font-size="16" font-weight="600" fill="${COLORS.text}">Top Languages</text>
  <rect x="24" y="44" width="48" height="3" rx="1.5" fill="${COLORS.accent}"/>
  ${body}
</svg>
`;
}

async function main() {
  const [profile, repos] = await Promise.all([
    fetchJson(`${GITHUB_API}/users/${USERNAME}`),
    fetchJson(`${GITHUB_API}/users/${USERNAME}/repos?per_page=100&sort=pushed`),
  ]);

  const assetsDir = path.join("assets");
  await Promise.all([
    fs.writeFile(path.join(assetsDir, "stats.svg"), statsSvg(profile, repos)),
    fs.writeFile(path.join(assetsDir, "languages.svg"), languagesSvg(repos)),
  ]);
  console.log("Generated assets/stats.svg and assets/languages.svg");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});