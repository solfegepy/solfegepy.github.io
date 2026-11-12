import type { Locator, Page } from "@playwright/test";

/** Opens routes and exposes Astro islands that have not hydrated. */
export class HydrationPage {
  constructor(private readonly page: Page) {}

  async open(path: string): Promise<void> {
    await this.page.goto(path);
  }

  pendingIslands(): Locator {
    return this.page.locator("astro-island[ssr]");
  }
}
