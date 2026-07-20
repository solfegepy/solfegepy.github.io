import type { Locator, Page } from "@playwright/test";

/** The vanilla-cookieconsent banner and settings, which render outside the app and so have no `data-testid`s. */
export class CookieBanner {
  readonly banner: Locator;
  readonly settings: Locator;
  readonly analyticsRequests: string[] = [];

  constructor(private readonly page: Page) {
    this.banner = page.getByRole("dialog", { name: "We value your privacy" });
    this.settings = page.getByRole("dialog", { name: "Cookie settings" });
  }

  /** Let the banner appear in this automated browser, and answer Google Analytics requests locally. */
  async install(): Promise<void> {
    // The library hides the banner from bots, and it counts any browser with `navigator.webdriver` as one.
    await this.page.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
    await this.page.route("https://www.googletagmanager.com/**", async (route) => {
      this.analyticsRequests.push(route.request().url());
      await route.fulfill({ contentType: "text/javascript", body: "" });
    });
  }

  /** Reload, returning only once the banner code has loaded, so a hidden banner means it chose to stay hidden. */
  async reloadPage(): Promise<void> {
    await Promise.all([this.page.waitForResponse(/\/analytics\.[^/]+\.js$/), this.page.reload()]);
  }

  async acceptAll(): Promise<void> {
    await this.banner.getByRole("button", { name: "Accept all" }).click();
  }

  async rejectAll(): Promise<void> {
    await this.banner.getByRole("button", { name: "Reject all" }).click();
  }

  async followPolicyLink(): Promise<void> {
    await this.banner.getByRole("link", { name: "Privacy & cookies" }).click();
  }

  /** On the privacy page, open the settings dialog with its Cookie settings button. */
  async openSettingsFromPrivacyPage(): Promise<void> {
    await this.page.getByTestId("privacy-cookie-settings").click();
  }

  /** In the open settings dialog, allow only analytics and save. */
  async allowAnalyticsOnly(): Promise<void> {
    await this.settings.getByRole("checkbox", { name: "Analytics" }).check();
    await this.settings.getByRole("checkbox", { name: "Advertising" }).uncheck();
    await this.settings.getByRole("button", { name: "Save choices" }).click();
  }

  /** In the open settings dialog, withdraw every optional category. */
  async rejectAllInSettings(): Promise<void> {
    await this.settings.getByRole("button", { name: "Reject all" }).click();
  }

  /** Return the latest advertising consent sent to Google Analytics, or `undefined` if none was sent. */
  async adStorageConsent(): Promise<string | undefined> {
    return this.page.evaluate(() => {
      const commands = ((window as { dataLayer?: IArguments[] }).dataLayer ?? []).map((args) => Array.from(args));
      const consent = commands.filter(([command]) => command === "consent").at(-1);
      return (consent?.[2] as { ad_storage?: string } | undefined)?.ad_storage;
    });
  }

  async cookieNames(): Promise<string[]> {
    return (await this.page.context().cookies()).map((cookie) => cookie.name);
  }
}
