import type { Locator, Page } from "@playwright/test";

/** Page object for the ASCII and Latin code reference and its Encoding navigation entry. */
export class AsciiPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto("/ascii/");
    await this.page.waitForFunction(
      () => document.querySelector('[data-testid="codec-app"]')?.getAttribute("data-hydrated") === "true",
    );
  }

  async openFromDesktopNavigation(): Promise<void> {
    await this.page.getByTestId("ascii-link").first().click();
  }

  async openFromMobileNavigation(): Promise<void> {
    await this.page.getByTestId("menu-button").click();
    await this.page.getByTestId("mobile-drawer").getByTestId("ascii-link").click();
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.page.waitForFunction(
      () => document.querySelector('[data-testid="codec-app"]')?.getAttribute("data-hydrated") === "true",
    );
  }

  async search(query: string): Promise<void> {
    await this.page.getByTestId("ascii-search").fill(query);
  }

  async captureScreenshot(path: string): Promise<void> {
    await this.page.screenshot({ path, animations: "disabled" });
  }

  async rootFontSize(): Promise<string> {
    return this.page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
  }

  heading(): Locator {
    return this.page.getByRole("heading", { level: 1, name: "ASCII & Latin Codes" });
  }

  navigationLink(): Locator {
    return this.page.getByTestId("ascii-link");
  }

  searchInput(): Locator {
    return this.page.getByTestId("ascii-search");
  }

  resultCount(): Locator {
    return this.page.getByTestId("ascii-result-count");
  }

  rows(): Locator {
    return this.page.getByTestId("ascii-table").locator("tbody tr");
  }

  firstRowCells(): Locator {
    return this.rows().first().getByRole("cell");
  }

  tableScrollArea(): Locator {
    return this.page.getByTestId("ascii-table-scroll");
  }

  async layout(): Promise<{
    documentWidth: number;
    viewportWidth: number;
    tableClientWidth: number;
    tableScrollWidth: number;
  }> {
    return this.page.evaluate(() => {
      const scrollArea = document.querySelector<HTMLElement>('[data-testid="ascii-table-scroll"]');
      if (!scrollArea) throw new Error("ASCII table scroll area is missing");
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
        tableClientWidth: scrollArea.clientWidth,
        tableScrollWidth: scrollArea.scrollWidth,
      };
    });
  }
}
