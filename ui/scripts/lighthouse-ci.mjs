/* global URL, console, process */
// Audits the built site (../docs) with the installed Lighthouse CLI and enforces score budgets.
// Replaces @lhci/cli, whose dependency tree is blocked by the pnpm trustPolicy.
import { execFile } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { promisify } from "node:util";

const ROOT = new URL("../../docs/", import.meta.url).pathname;
const OUT = "test-results/lighthouse-ci";
const URLS = ["/", "/tailwind/", "/faq/", "/ascii/", "/cheatsheets/ssh/"];
const RUNS = 3;
// Gating budgets; performance only warns because container runs vary.
const BUDGETS = { seo: 1, accessibility: 0.95, "best-practices": 0.95 };
const WARN = { performance: 0.9 };
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = join(ROOT, path.endsWith("/") ? `${path}index.html` : path);
  try {
    const body = readFileSync(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

mkdirSync(OUT, { recursive: true });
const median = (values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
let failed = false;
for (const url of URLS) {
  const runs = [];
  for (let run = 1; run <= RUNS; run++) {
    const output = `${OUT}/${url.replaceAll("/", "_")}-${run}.json`;
    // Lighthouse reads CHROME_PATH from the environment; --no-sandbox is explained in the Makefile.
    // Async so the event loop keeps serving pages to Chromium during the audit.
    await promisify(execFile)("lighthouse", [
      origin + url,
      "--quiet",
      "--output=json",
      `--output-path=${output}`,
      "--chrome-flags=--headless=new --no-sandbox",
    ]);
    runs.push(JSON.parse(readFileSync(output, "utf8")).categories);
  }
  const scores = Object.fromEntries(Object.keys(runs[0]).map((id) => [id, median(runs.map((r) => r[id].score))]));
  console.log(url, JSON.stringify(scores));
  for (const [id, min] of Object.entries({ ...BUDGETS, ...WARN })) {
    if (scores[id] >= min) continue;
    const gate = id in BUDGETS;
    failed ||= gate;
    console.log(`  ${gate ? "FAIL" : "WARN"} ${id} ${scores[id]} < ${min}`);
  }
}
server.close();
process.exitCode = failed ? 1 : 0;
