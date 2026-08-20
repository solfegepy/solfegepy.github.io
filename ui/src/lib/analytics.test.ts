import { afterEach, describe, expect, it } from "vitest";

import { disableAnalytics, GA_MEASUREMENT_ID, loadAnalytics } from "./analytics";

const SCRIPT_SELECTOR = 'script[src*="googletagmanager.com/gtag/js"]';

afterEach(() => {
  document.querySelectorAll(SCRIPT_SELECTOR).forEach((script) => script.remove());
  Reflect.deleteProperty(window, "dataLayer");
  Reflect.deleteProperty(window, "gtag");
  Reflect.deleteProperty(window, `ga-disable-${GA_MEASUREMENT_ID}`);
});

describe("analytics loader", () => {
  it("injects the gtag script for the configured measurement ID", () => {
    loadAnalytics();

    const script = document.querySelector<HTMLScriptElement>(SCRIPT_SELECTOR);
    expect(script?.src).toBe(`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`);
    expect(script?.async).toBe(true);
  });

  it("configures dataLayer and gtag for the measurement ID", () => {
    loadAnalytics();

    expect(window.dataLayer).toBeInstanceOf(Array);
    expect((window.dataLayer.at(0) as ArrayLike<unknown> | undefined)?.[0]).toBe("js");
    expect(Array.from(window.dataLayer.at(1) as ArrayLike<unknown>)).toEqual(["config", GA_MEASUREMENT_ID]);
  });

  it("is idempotent: calling twice injects only one script", () => {
    loadAnalytics();
    loadAnalytics();

    expect(document.querySelectorAll(SCRIPT_SELECTOR)).toHaveLength(1);
  });

  it("sets the vendor opt-out flag on disable", () => {
    disableAnalytics();

    expect(window[`ga-disable-${GA_MEASUREMENT_ID}`]).toBe(true);
  });
});
