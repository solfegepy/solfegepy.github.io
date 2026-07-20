import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { loadEnv } from "vite";

import { requirePositiveInteger } from "./config-env";

const env = loadEnv("development", "../.devcontainer", "");
const port = requirePositiveInteger(env, "UI_INT_PORT");

// The npm provider reads one CSS file per family entry and ignores `subsets`, so each weight gets its own entry
// sharing the family's cssVariable. Fontsource weight files include every subset the package ships.
const fontProvider = fontProviders.npm({ remote: false });
const fontWeights = [400, 500, 600, 700];

function selfHostedFamily(name: string, cssVariable: string, fallbacks: string[]) {
  return fontWeights.map((weight) => ({
    provider: fontProvider,
    name,
    cssVariable,
    weights: [weight] as [number],
    styles: ["normal"] as ["normal"],
    fallbacks,
    options: { file: `${weight}.css` },
  }));
}

export default defineConfig({
  fonts: [
    ...selfHostedFamily("IBM Plex Sans", "--font-ibm-plex-sans", [
      "Segoe UI",
      "ui-sans-serif",
      "system-ui",
      "sans-serif",
    ]),
    ...selfHostedFamily("JetBrains Mono", "--font-jetbrains-mono", ["SFMono-Regular", "Consolas", "monospace"]),
  ],
  integrations: [react()],
  outDir: "../docs",
  output: "static",
  server: { host: "0.0.0.0", port },
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ["**/.pnpm-store/**", "**/test-results/**", "**/node_modules/**"],
      },
    },
  },
});
