/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// Astro's Vite config resolves virtual modules such as `astro:env/client` for tests.
export default getViteConfig({
  test: {
    environment: "jsdom",
    testTimeout: 10_000,
    include: ["src/**/*.test.{ts,tsx}", "config-env.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./test-results/coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/**/*.d.ts", "**/.astro/**", "**/dist/**"],
    },
  },
});
