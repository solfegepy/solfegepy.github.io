import type { Locator, Page } from "@playwright/test";

type ToolName = "Base64" | "URL" | "Query Params" | "JWT" | "Python → JSON" | "Timestamp";
type ToolId = "base64" | "url" | "query" | "jwt" | "python" | "timestamp";
type JwtSegment = "Header" | "Payload" | "Signature";
type Channel = "top" | "bottom";
type ChannelFormat =
  | "plain"
  | "base64"
  | "base64url"
  | "decoded"
  | "rfc3986"
  | "uri"
  | "form"
  | "query"
  | "json"
  | "python"
  | "ztime"
  | "timestamp-seconds"
  | "timestamp-milliseconds";

export class CodecPage {
  constructor(private readonly page: Page) {}

  async open(path = "/"): Promise<void> {
    await this.page.goto(path);
  }
  async chooseTool(name: ToolName): Promise<void> {
    const ids = {
      Base64: "base64",
      URL: "url",
      "Query Params": "query",
      JWT: "jwt",
      "Python → JSON": "python",
      Timestamp: "timestamp",
    } as const satisfies Record<ToolName, ToolId>;
    await this.page.getByTestId(`tool-link-${ids[name]}`).first().click();
  }
  async openDrawer(): Promise<void> {
    await this.page.getByTestId("menu-button").click();
  }
  async fill(testId: string, value: string): Promise<void> {
    await this.page.getByTestId(testId).fill(value);
  }
  async act(name: string): Promise<void> {
    await this.page.getByRole("button", { name, exact: true }).click();
  }
  convert(): Locator {
    return this.page.getByRole("button", { name: "Convert", exact: true });
  }
  async chooseTopFormat(toolId: ToolId, format: ChannelFormat): Promise<void> {
    await this.format(toolId, "top").selectOption(format);
  }
  async chooseBottomFormat(toolId: ToolId, format: ChannelFormat): Promise<void> {
    await this.format(toolId, "bottom").selectOption(format);
  }
  async swap(): Promise<void> {
    await this.page.getByTestId("codec-workspace-swap").click();
  }
  format(toolId: ToolId, channel: Channel): Locator {
    return this.page.getByTestId(`${toolId}-${channel}-format`);
  }
  async clipboardText(): Promise<string> {
    return this.page.evaluate(() => navigator.clipboard.readText());
  }
  async enterJwt(token: string): Promise<void> {
    await this.page.getByTestId("jwt-input").fill(token);
  }
  async decodeJwt(): Promise<void> {
    await this.page.getByTestId("jwt-decode").click();
  }
  async clearJwt(): Promise<void> {
    await this.page.getByTestId("jwt-clear").click();
  }
  async copyJwt(segment: JwtSegment): Promise<void> {
    await this.page.getByTestId(`jwt-copy-${segment.toLowerCase()}`).click();
  }
  jwtToken(): Locator {
    return this.page.getByTestId("jwt-input");
  }
  jwtOutput(segment: JwtSegment): Locator {
    return this.page.getByTestId(`jwt-${segment.toLowerCase()}-output`);
  }
  jwtDecode(): Locator {
    return this.page.getByTestId("jwt-decode");
  }
  jwtWarning(): Locator {
    return this.page.getByTestId("jwt-warning");
  }
  status(): Locator {
    return this.page.getByRole("status");
  }
  output(testId: string): Locator {
    return this.page.getByTestId(testId);
  }
  input(testId: string): Locator {
    return this.page.getByTestId(testId);
  }
  alert(): Locator {
    return this.page.getByRole("alert");
  }
  activeTool(): Locator {
    return this.page.locator('[data-testid^="tool-link-"][aria-current="page"]').first();
  }
  themeControl(): Locator {
    return this.page.getByTestId("desktop-sidebar").getByTestId("theme-control");
  }
  systemThemeReset(container: "desktop" | "drawer" = "desktop"): Locator {
    const shell =
      container === "desktop" ? this.page.getByTestId("desktop-sidebar") : this.page.getByTestId("mobile-drawer");
    return shell.getByTestId("theme-system-reset");
  }
  async chooseOppositeTheme(): Promise<void> {
    await this.themeControl().click();
  }
  async useSystemTheme(container: "desktop" | "drawer" = "desktop"): Promise<void> {
    await this.systemThemeReset(container).click();
  }
  channel(toolId: ToolId, channel: Channel): Locator {
    return this.page.getByTestId(`${toolId}-${channel}-channel`);
  }
  workspaceActions(): Locator {
    return this.page.getByTestId("codec-workspace-actions");
  }
  metadata(name: string): Locator {
    return this.page.locator(`meta[property="${name}"], meta[name="${name}"]`);
  }
  canonical(): Locator {
    return this.page.locator('link[rel="canonical"]');
  }
  primaryHeading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }
  staticSection(name: "How to use" | "What is Base64?" | "Base64 FAQ"): Locator {
    return this.page.getByRole("heading", { level: 2, name });
  }
  root(): Locator {
    return this.page.locator("html");
  }
  sidebar(): Locator {
    return this.page.getByTestId("desktop-sidebar");
  }
  drawer(): Locator {
    return this.page.getByTestId("mobile-drawer");
  }
  notFoundPage(): Locator {
    return this.page.getByTestId("not-found-page");
  }
  notFoundHome(): Locator {
    return this.page.getByTestId("not-found-home");
  }
  async recoverFromNotFound(): Promise<void> {
    await this.notFoundHome().click();
  }
}
