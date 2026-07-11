import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { loadEnv } from "vite";

import { requirePositiveInteger } from "./config-env";

const env = loadEnv("development", "../.devcontainer", "");
const testPort = requirePositiveInteger(env, "UI_TEST_INT_PORT");
const testUrl = `http://127.0.0.1:${testPort}`;
const testResultsDir = path.resolve(import.meta.dirname, "test-results/playwright");

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["html", { outputFolder: path.join(testResultsDir, "report"), open: "never" }],
    ["list"],
    ["json", { outputFile: path.join(testResultsDir, "report.json") }],
  ],
  outputDir: path.join(testResultsDir, "results"),
  use: {
    baseURL: testUrl,
    viewport: { width: 1920, height: 1080 },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--disable-dev-shm-usage", "--disable-gpu", "--no-sandbox"],
          ...(process.env.PLAYWRIGHT_SLOW_MO ? { slowMo: Number(process.env.PLAYWRIGHT_SLOW_MO) } : {}),
        },
      },
    },
  ],
  webServer: {
    command: `pnpm run build && pnpm exec astro preview --host 0.0.0.0 --port ${testPort}`,
    url: testUrl,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
