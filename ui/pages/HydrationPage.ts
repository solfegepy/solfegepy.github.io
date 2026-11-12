import type { Page } from "@playwright/test";

/**
 * Opens routes and reports hydration progress for their Astro islands.
 */
export class HydrationPage {
  /**
   * Creates a page object for development hydration checks.
   * @param page - Browser page to drive and inspect.
   * @returns A hydration page object.
   */
  constructor(private readonly page: Page) {}

  /**
   * Opens a route in the development server.
   * @param path - Route path to open.
   * @returns Resolves after navigation completes.
   */
  async open(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Counts Astro islands still marked as server-rendered.
   * @returns The number of islands awaiting hydration.
   */
  async countPendingIslands(): Promise<number> {
    return this.page.locator("astro-island[ssr]").count();
  }
}
