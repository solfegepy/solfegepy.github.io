/// <reference types="astro/client" />

type Gtag = (...args: [command: "js", date: Date] | [command: "config", targetId: string]) => void;

interface Window {
  dataLayer: unknown[];
  gtag: Gtag;
  [key: `ga-disable-${string}`]: boolean | undefined;
}
