import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { CodecPage } from "./CodecPage";
import { CookieBanner } from "./CookieBanner";

const RULES = ["button-name", "link-name", "label", "label-content-name-mismatch"];

/** Opens a hydrated page or consent dialog and scans its accessible names. */
export class AccessibilityPage {
  private readonly codec: CodecPage;
  private readonly cookies: CookieBanner;

  constructor(private readonly page: Page) {
    this.codec = new CodecPage(page);
    this.cookies = new CookieBanner(page);
  }

  async open(path: string): Promise<void> {
    await this.codec.open(path);
  }

  async openConsentBanner(): Promise<void> {
    await this.cookies.install();
    await this.codec.open("/base64/");
    await this.cookies.banner.waitFor({ state: "visible" });
  }

  async openConsentSettings(): Promise<void> {
    await this.cookies.install();
    await this.codec.open("/privacy/");
    await this.cookies.rejectAll();
    await this.cookies.openSettingsFromPrivacyPage();
    await this.cookies.settings.waitFor({ state: "visible" });
  }

  async violations(): Promise<Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]> {
    const results = await new AxeBuilder({ page: this.page }).withRules(RULES).analyze();
    return results.violations;
  }
}
