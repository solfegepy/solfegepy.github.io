import type { Locator, Page } from "@playwright/test";

type WheelKind = "chromatic" | "neutral";
type Theme = "light" | "dark";

const WHEEL_FAMILIES: Record<WheelKind, readonly string[]> = {
  chromatic: [
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
  ],
  neutral: ["slate", "gray", "zinc", "neutral", "stone", "mauve", "olive", "mist", "taupe"],
};
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** Exposes Tailwind converter actions and locators to browser tests. */
export class TailwindPage {
  constructor(private readonly page: Page) {}

  async useTheme(theme: Theme): Promise<void> {
    await this.page.addInitScript((value) => localStorage.setItem("codec-bench-theme", value), theme);
  }

  async setViewport(width: number, height: number): Promise<void> {
    await this.page.setViewportSize({ width, height });
  }

  async useLargeText(): Promise<void> {
    await this.page.addStyleTag({ content: "html { font-size: 200%; }" });
  }

  async chooseFamilyWithKeyboard(familyKey: string): Promise<void> {
    const family = this.familySelect();
    await family.focus();
    await family.press(familyKey);
    await family.press("Enter");
  }

  async open(path = "/tailwind/"): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForFunction(
      () => document.querySelector('[data-testid="codec-app"]')?.getAttribute("data-hydrated") === "true",
    );
  }

  async chooseDesktopTailwind(): Promise<void> {
    await this.page.getByTestId("desktop-sidebar").getByTestId("tool-link-tailwind").click();
  }

  async chooseMobileTailwind(): Promise<void> {
    await this.page.getByTestId("menu-button").click();
    await this.page.getByTestId("mobile-drawer").getByTestId("tool-link-tailwind").click();
  }

  async enterHex(value: string): Promise<void> {
    await this.hexInput().fill(value);
  }

  async clickWheelToken(kind: WheelKind, family: string, shade: number): Promise<void> {
    const families = WHEEL_FAMILIES[kind];
    const familyIndex = families.indexOf(family);
    const shadeIndex = SHADES.indexOf(shade as (typeof SHADES)[number]);
    if (familyIndex < 0 || shadeIndex < 0) throw new RangeError(`Unknown ${kind} wheel color: ${family}-${shade}`);

    const canvas = this.canvas(kind);
    const box = await canvas.boundingBox();
    if (box === null) throw new Error(`${kind} wheel is not visible`);

    // Click the center of a visible sector and shade ring, as a visitor would.
    const center = box.width / 2;
    const discRadius = center - 8;
    const normalizedRadius = 0.19 + ((0.88 - 0.19) * (shadeIndex + 0.5)) / SHADES.length;
    const angle = -Math.PI / 2 + ((familyIndex + 0.5) * Math.PI * 2) / families.length;
    await canvas.click({
      position: {
        x: center + Math.cos(angle) * normalizedRadius * discRadius,
        y: center + Math.sin(angle) * normalizedRadius * discRadius,
      },
    });
  }

  async clickWheelHole(kind: WheelKind): Promise<void> {
    const box = await this.canvas(kind).boundingBox();
    if (box === null) throw new Error(`${kind} wheel is not visible`);
    await this.canvas(kind).click({ position: { x: box.width / 2, y: box.height / 2 } });
  }

  async clickWheelGap(kind: WheelKind, family: string, shade: number): Promise<void> {
    const families = WHEEL_FAMILIES[kind];
    const familyIndex = families.indexOf(family);
    const shadeIndex = SHADES.indexOf(shade as (typeof SHADES)[number]);
    if (familyIndex < 0 || shadeIndex < 0) throw new RangeError(`Unknown ${kind} wheel gap: ${family}-${shade}`);

    const box = await this.canvas(kind).boundingBox();
    if (box === null) throw new Error(`${kind} wheel is not visible`);
    const center = box.width / 2;
    const discRadius = center - 8;
    const normalizedRadius = 0.19 + ((0.88 - 0.19) * (shadeIndex + 0.5)) / SHADES.length;
    const angle = -Math.PI / 2 + (familyIndex * Math.PI * 2) / families.length;
    await this.canvas(kind).click({
      position: {
        x: center + Math.cos(angle) * normalizedRadius * discRadius,
        y: center + Math.sin(angle) * normalizedRadius * discRadius,
      },
    });
  }

  async clickOutsideWheel(kind: WheelKind): Promise<void> {
    await this.canvas(kind).click({ position: { x: 1, y: 1 } });
  }

  async hasHorizontalOverflow(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  }

  async useLargeTextAndFocusInput(): Promise<void> {
    await this.useLargeText();
    await this.hexInput().focus();
  }

  async focusHexInput(): Promise<void> {
    await this.hexInput().focus();
  }

  async captureScreenshot(path: string): Promise<void> {
    await this.page.screenshot({ path, fullPage: true, animations: "disabled" });
  }

  hexInput(): Locator {
    return this.page.getByTestId("tailwind-hex-input");
  }

  familySelect(): Locator {
    return this.page.getByTestId("tailwind-family-select");
  }

  shadeSelect(): Locator {
    return this.page.getByTestId("tailwind-shade-select");
  }

  token(): Locator {
    return this.page.getByTestId("tailwind-token");
  }

  result(): Locator {
    return this.page.getByTestId("tailwind-result");
  }

  inspectionPrompt(): Locator {
    return this.page.getByTestId("tailwind-inspection-prompt");
  }

  inputError(): Locator {
    return this.page.getByTestId("tailwind-input-error");
  }

  matchKind(): Locator {
    return this.page.getByTestId("tailwind-match-kind");
  }

  anchor(family: "black" | "white"): Locator {
    return this.page.getByTestId(`tailwind-${family}-swatch`);
  }

  canvas(kind: WheelKind): Locator {
    return this.page.getByTestId(`tailwind-${kind}-canvas`);
  }

  activeNavigation(): Locator {
    return this.page.locator('[data-testid="tool-link-tailwind"][aria-current="page"]');
  }

  main(): Locator {
    return this.page.getByTestId("tailwind-tool");
  }

  okLabNote(): Locator {
    return this.page.getByText(
      "Closest colors are selected using OKLab distance, which estimates perceived color difference. Hex values are sRGB approximations of Tailwind's OKLCH colors.",
      { exact: true },
    );
  }

  heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  versionLabel(): Locator {
    return this.page.getByRole("link", { name: "Tailwind CSS 4.2.0" });
  }
}
