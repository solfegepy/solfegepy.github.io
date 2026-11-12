import { defineConfig } from "@playwright/test";
import { loadEnv } from "vite";

import baseConfig from "./playwright.config";
import { requirePositiveInteger } from "./config-env";

const env = loadEnv("development", "../.devcontainer", "");
const testPort = requirePositiveInteger(env, "UI_TEST_INT_PORT");
const testUrl = `http://127.0.0.1:${testPort}`;

export default defineConfig({
  ...baseConfig,
  testMatch: ["**/hydration.spec.ts"],
  testIgnore: [],
  webServer: {
    command: `pnpm exec astro dev --ignore-lock --host 0.0.0.0 --port ${testPort}`,
    url: testUrl,
    // This keeps Astro dev in the foreground under agentic CLIs, matching the base Playwright server.
    env: { ASTRO_PREVIEW_BACKGROUND: "1", ASTRO_DEV_BACKGROUND: "1", ENV: "test" },
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
