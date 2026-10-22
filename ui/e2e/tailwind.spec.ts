import { expect, test } from "@playwright/test";

import { TailwindPage } from "../pages/TailwindPage";

test("direct and desktop navigation discover the Tailwind converter", async ({ page }) => {
  const tailwind = new TailwindPage(page);
  await tailwind.open();

  await expect(page).toHaveURL(/\/tailwind\/$/);
  await expect(tailwind.heading()).toHaveText("Tailwind Color Converter");
  await expect(tailwind.activeNavigation()).toHaveCount(1);
  await expect(tailwind.versionLabel()).toBeVisible();
  await expect(tailwind.inspectionPrompt()).toBeVisible();

  await tailwind.open("/");
  await tailwind.chooseDesktopTailwind();
  await expect(page).toHaveURL(/\/tailwind\/$/);
  await expect(tailwind.activeNavigation()).toBeVisible();
});

test("mobile drawer navigation opens the converter", async ({ page }) => {
  const tailwind = new TailwindPage(page);
  await tailwind.setViewport(390, 844);
  await tailwind.open("/");
  await tailwind.chooseMobileTailwind();

  await expect(page).toHaveURL(/\/tailwind\/$/);
  await expect(tailwind.activeNavigation()).toHaveAttribute("aria-current", "page");
  await expect(tailwind.inspectionPrompt()).toBeVisible();
});

test("wheel, hex, anchor, and invalid recovery keep selection synchronized", async ({ page }) => {
  const tailwind = new TailwindPage(page);
  await tailwind.open();

  await tailwind.clickWheelToken("chromatic", "blue", 500);
  await expect(tailwind.token()).toHaveText("blue-500");
  await expect(tailwind.hexInput()).toHaveValue("#2b7fff");
  await expect(tailwind.canvas("chromatic")).toHaveAttribute("aria-label", /Selected blue-500, #2b7fff/);

  await tailwind.clickWheelToken("neutral", "gray", 950);
  await expect(tailwind.token()).toHaveText("gray-950");
  await expect(tailwind.hexInput()).toHaveValue("#030712");
  await expect(tailwind.canvas("neutral")).toHaveAttribute("aria-label", /Selected gray-950, #030712/);
  await tailwind.clickWheelHole("neutral");
  await expect(tailwind.token()).toHaveText("gray-950");
  await tailwind.clickWheelGap("neutral", "slate", 500);
  await expect(tailwind.token()).toHaveText("gray-950");
  await tailwind.clickOutsideWheel("neutral");
  await expect(tailwind.token()).toHaveText("gray-950");

  await tailwind.enterHex("#fff");
  await expect(tailwind.token()).toHaveText("white");
  await expect(tailwind.anchor("white")).toHaveAttribute("aria-pressed", "true");
  await expect(tailwind.matchKind()).toHaveText("Exact match");

  await tailwind.enterHex("#12");
  await expect(tailwind.inputError()).toHaveAttribute("role", "alert");
  await expect(tailwind.result()).toHaveCount(0);
  await expect(tailwind.canvas("chromatic")).toHaveAttribute("aria-label", /No token selected on this wheel/);

  await tailwind.enterHex("#0080ff");
  await expect(tailwind.token()).toHaveText("blue-500");
  await expect(tailwind.matchKind()).toHaveText("Closest match");
  await tailwind.enterHex("");
  await expect(tailwind.inputError()).toHaveCount(0);
  await expect(tailwind.inspectionPrompt()).toBeVisible();
});

test("keyboard family selection chooses and highlights the same palette token", async ({ page }) => {
  const tailwind = new TailwindPage(page);
  await tailwind.open();
  await tailwind.chooseFamilyWithKeyboard("b");

  await expect(tailwind.token()).toHaveText("blue-500");
  await expect(tailwind.hexInput()).toHaveValue("#2b7fff");
  await expect(tailwind.canvas("chromatic")).toHaveAttribute("aria-label", /Selected blue-500, #2b7fff/);
});

test("resizing preserves selection and remaps wheel pointer coordinates", async ({ page }) => {
  const tailwind = new TailwindPage(page);
  await tailwind.open();
  await tailwind.clickWheelToken("chromatic", "blue", 500);
  await tailwind.setViewport(900, 900);
  await expect(tailwind.canvas("chromatic")).toHaveAttribute("aria-label", /Selected blue-500, #2b7fff/);

  await tailwind.clickWheelToken("chromatic", "rose", 950);
  await expect(tailwind.token()).toHaveText("rose-950");
  await expect(tailwind.hexInput()).toHaveValue("#4d0218");
  await expect(tailwind.canvas("chromatic")).toHaveAttribute("aria-label", /Selected rose-950, #4d0218/);
});

test("320px and 200% text remain usable in both themes", async ({ page }, testInfo) => {
  const tailwind = new TailwindPage(page);
  for (const theme of ["light", "dark"] as const) {
    await tailwind.useTheme(theme);
    await tailwind.setViewport(320, 900);
    await tailwind.open();
    await tailwind.enterHex("#2b7fff");
    await tailwind.useLargeTextAndFocusInput();

    await expect(tailwind.hexInput()).toBeVisible();
    await expect(tailwind.token()).toHaveText("blue-500");
    await expect(tailwind.canvas("chromatic")).toBeVisible();
    await expect(tailwind.okLabNote()).toBeVisible();
    expect(await tailwind.hasHorizontalOverflow()).toBe(false);
    await tailwind.captureScreenshot(testInfo.outputPath(`tailwind-mobile-${theme}-200-percent.png`));
  }
});

test("desktop wheel and result remain readable in both themes", async ({ page }, testInfo) => {
  const tailwind = new TailwindPage(page);
  for (const theme of ["light", "dark"] as const) {
    await tailwind.useTheme(theme);
    await tailwind.setViewport(1440, 1000);
    await tailwind.open();
    await tailwind.enterHex("#2b7fff");
    await tailwind.focusHexInput();

    await expect(tailwind.canvas("chromatic")).toHaveAttribute("aria-label", /Selected blue-500, #2b7fff/);
    await expect(tailwind.result()).toBeVisible();
    await expect(tailwind.okLabNote()).toBeVisible();
    expect(await tailwind.hasHorizontalOverflow()).toBe(false);
    await tailwind.captureScreenshot(testInfo.outputPath(`tailwind-desktop-${theme}.png`));
  }
});
