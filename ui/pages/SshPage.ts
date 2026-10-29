import type { Locator, Page } from "@playwright/test";

/** Represents the SSH cheatsheet route and its user actions. */
export class SshPage {
  /** Creates page object for a browser page. @param page Playwright page. */
  constructor(private readonly page: Page) {}

  /** Opens route and waits for app hydration. @returns Resolves after hydration. */
  async open(): Promise<void> {
    await this.page.goto("/cheatsheets/ssh/");
    await this.page.waitForFunction(
      () => document.querySelector('[data-testid="codec-app"]')?.getAttribute("data-hydrated") === "true",
    );
  }

  /** Finds page heading. @returns Heading locator. */
  heading(): Locator {
    return this.page.getByRole("heading", { name: "SSH Cheatsheet", level: 1 });
  }

  /** Finds this page link. @param container Navigation container. @returns Link locator. */
  navigationLink(container: Locator): Locator {
    return container.getByTestId("cheatsheet-link-ssh");
  }

  /** Finds command snippets. @returns Snippet locators. */
  commandSnippets(): Locator {
    return this.page.getByTestId("command-snippet");
  }

  /** Finds command copy buttons. @returns Button locators. */
  copyButtons(): Locator {
    return this.page.getByTestId("command-snippet-copy");
  }

  /** Finds command text elements. @returns Command locators. */
  commands(): Locator {
    return this.page.getByTestId("command-snippet-command");
  }

  /** Counts displayed commands. @returns Command count. */
  async commandCount(): Promise<number> {
    return this.commands().count();
  }

  /** Counts command copy buttons. @returns Button count. */
  async copyButtonCount(): Promise<number> {
    return this.copyButtons().count();
  }

  /** Reports whether copy controls are enabled. @returns True when all are enabled. */
  async copyButtonsAreEnabled(): Promise<boolean> {
    return this.copyButtons().evaluateAll((buttons) =>
      buttons.every((button) => !(button as HTMLButtonElement).disabled),
    );
  }

  /** Reads first command. @returns Command text. */
  async firstCommandText(): Promise<string> {
    return (await this.commands().first().textContent()) ?? "";
  }

  /** Reads first copy control outline. @returns Computed outline style. */
  async firstCopyButtonOutlineStyle(): Promise<string> {
    return this.copyButtons()
      .first()
      .evaluate((button) => getComputedStyle(button).outlineStyle);
  }

  /** Focuses first copy control. @returns Resolves after focus. */
  async focusFirstCopyButton(): Promise<void> {
    await this.copyButtons().first().focus();
  }

  /** Copies first displayed command. @returns Resolves after click. */
  async copyFirstCommand(): Promise<void> {
    await this.copyButtons().first().scrollIntoViewIfNeeded();
    await this.copyButtons().first().click();
  }

  /** Follows this page link. @param container Navigation container. @returns Resolves after navigation. */
  async followNavigationLink(container: Locator): Promise<void> {
    await this.navigationLink(container).click();
  }

  /** Finds first snippet feedback. @returns Status locator. */
  copyStatus(): Locator {
    return this.commandSnippets().first().getByRole("status");
  }
}
