import type { Locator, Page } from "@playwright/test";

import { CONSENT_STORAGE_KEY, type ConsentStatus } from "../src/lib/consent";

export class CookieBannerPage {
  constructor(private readonly page: Page) {}

  async seedConsent(status: ConsentStatus, decidedAt: number = Date.now()): Promise<void> {
    await this.page.addInitScript(({ key, record }) => localStorage.setItem(key, JSON.stringify(record)), {
      key: CONSENT_STORAGE_KEY,
      record: { status, decidedAt },
    });
  }

  async seedCorruptConsent(): Promise<void> {
    await this.page.addInitScript((key) => localStorage.setItem(key, "not-json"), CONSENT_STORAGE_KEY);
  }

  banner(): Locator {
    return this.page.getByTestId("cookie-banner");
  }

  async bannerVisible(): Promise<boolean> {
    return this.banner().isVisible();
  }

  async accept(): Promise<void> {
    await this.page.getByTestId("cookie-accept").click();
  }

  async reject(): Promise<void> {
    await this.page.getByTestId("cookie-reject").click();
  }

  async openCookieSettingsFromFooter(): Promise<void> {
    await this.page.getByTestId("cookie-settings-link").first().click();
  }

  async noTrackerScript(): Promise<boolean> {
    return (await this.page.locator('script[src*="googletagmanager.com/gtag/js"]').count()) === 0;
  }

  async consentRecord(): Promise<{ status: ConsentStatus; decidedAt: number } | null> {
    return this.page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "null") as { status: ConsentStatus; decidedAt: number } | null,
      CONSENT_STORAGE_KEY,
    );
  }
}
