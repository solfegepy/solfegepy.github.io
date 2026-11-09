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

  async dimensions(): Promise<{ width: number; height: number } | null> {
    return this.banner.boundingBox();
  }

  async primaryChoiceWidths(): Promise<{ accept: number; reject: number }> {
    const accept = await this.banner
      .getByRole("button", { name: "Accept all" })
      .evaluate((button) => button.getBoundingClientRect().width);
    const reject = await this.banner
      .getByRole("button", { name: "Reject all" })
      .evaluate((button) => button.getBoundingClientRect().width);
    return { accept, reject };
  }

  async actionTargetHeights(): Promise<number[]> {
    return Promise.all(
      ["Accept all", "Reject all", "Manage choices"].map(async (name) =>
        this.banner.getByRole("button", { name }).evaluate((button) => button.getBoundingClientRect().height),
      ),
    );
  }

  async hasInternalScrolling(): Promise<boolean> {
    return this.banner.evaluate((modal) => modal.scrollHeight > modal.clientHeight);
  }

  async toolHeadingAndSourceAreAboveBanner(): Promise<boolean> {
    const banner = await this.banner.boundingBox();
    const heading = await this.page.getByTestId("tool-header").getByRole("heading", { level: 1 }).boundingBox();
    const source = await this.page.getByText("Source", { exact: true }).boundingBox();
    return Boolean(
      banner && heading && source && heading.y + heading.height <= banner.y && source.y + source.height <= banner.y,
    );
  }

  async tabToManageChoices(): Promise<boolean> {
    const manageChoices = this.banner.getByRole("button", { name: "Manage choices" });
    for (let tab = 0; tab < 80; tab += 1) {
      if (await manageChoices.evaluate((button) => button === document.activeElement)) return true;
      await this.page.keyboard.press("Tab");
    }
    return manageChoices.evaluate((button) => button === document.activeElement);
  }

  async activateFocusedManageChoices(): Promise<void> {
    await this.page.keyboard.press("Space");
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
