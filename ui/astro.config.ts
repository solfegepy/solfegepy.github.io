import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

import { requirePositiveInteger } from "./config-env";

const env = loadEnv("development", "../.devcontainer", "");
const port = requirePositiveInteger(env, "UI_INT_PORT");

export default defineConfig({
  integrations: [react()],
  outDir: "../docs",
  output: "static",
  server: { host: "0.0.0.0", port },
  vite: { plugins: [tailwindcss()] },
});
