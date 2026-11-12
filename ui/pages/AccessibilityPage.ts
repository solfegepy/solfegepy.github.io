import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { CodecPage } from "./CodecPage";
import { CookieBanner } from "./CookieBanner";

const RULES = ["button-name", "link-name", "label", "label-content-name-mismatch"];

/**
 * Opens a hydrated page or consent dialog and scans its accessible names.
 */
export class AccessibilityPage {
  private readonly codec: CodecPage;
  private readonly cookies: CookieBanner;

  /**
   * Creates a page object for accessible-name scans.
   * @param page - Browser page to drive and inspect.
   * @returns An accessibility page object.
   */
  constructor(private readonly page: Page) {
    this.codec = new CodecPage(page);
    this.cookies = new CookieBanner(page);
  }

  /**
   * Opens a route after its application hydrates.
   * @param path - Route path to open.
   * @returns Resolves after navigation completes.
   */
  async open(path: string): Promise<void> {
    await this.codec.open(path);
  }

  /**
   * Opens the cookie consent banner.
   * @returns Resolves when the banner is visible.
   */
  async openConsentBanner(): Promise<void> {
    await this.cookies.install();
    await this.codec.open("/base64/");
    await this.cookies.banner.waitFor({ state: "visible" });
  }

  /**
   * Opens cookie consent settings from the privacy page.
   * @returns Resolves when the settings dialog is visible.
   */
  async openConsentSettings(): Promise<void> {
    await this.cookies.install();
    await this.codec.open("/privacy/");
    await this.cookies.rejectAll();
    await this.cookies.openSettingsFromPrivacyPage();
    await this.cookies.settings.waitFor({ state: "visible" });
  }

  /**
   * Scans the current page for configured accessible-name violations.
   * @returns Axe violations found on the current page.
   */
  async violations(): Promise<Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]> {
    const results = await new AxeBuilder({ page: this.page }).withRules(RULES).analyze();
    return results.violations;
  }
}
