/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// Astro's Vite config resolves virtual modules such as `astro:env/client` for tests.
export default getViteConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "config-env.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
