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

test("3D OKLCH space selects the clicked dot and rotates on drag without selecting", async ({ page }, testInfo) => {
  const tailwind = new TailwindPage(page);
  await tailwind.open();
  await tailwind.chooseWheelView("chromatic", "3D");
  await expect(tailwind.oklchSpace("chromatic")).toHaveAttribute("aria-label", /No token selected in this space/);

  // Where fuchsia-600 projects from the initial camera, clear of every other dot.
  await tailwind.clickOklchSpace("chromatic", 0.792, 0.443);
  await expect(tailwind.token()).toHaveText("fuchsia-600");
  await expect(tailwind.oklchSpace("chromatic")).toHaveAttribute("aria-label", /Selected fuchsia-600, #/);
  await tailwind.captureScreenshot(testInfo.outputPath("tailwind-oklch-space.png"));

  await tailwind.dragOklchSpace("chromatic", 0.25);
  await expect(tailwind.token()).toHaveText("fuchsia-600");

  await tailwind.chooseWheelView("chromatic", "2D");
  await expect(tailwind.canvas("chromatic")).toHaveAttribute("aria-label", /Selected fuchsia-600/);
});

test("3D OKLCH space view buttons move the camera to the top, side, and bottom", async ({ page }) => {
  const tailwind = new TailwindPage(page);
  await tailwind.open();
  await tailwind.chooseWheelView("chromatic", "3D");

  // Each point is where an otherwise unobstructed dot projects from that camera.
  await tailwind.viewOklchSpaceFrom("chromatic", "Top");
  await tailwind.clickOklchSpace("chromatic", 0.651, 0.537);
  await expect(tailwind.token()).toHaveText("pink-300");

  await tailwind.viewOklchSpaceFrom("chromatic", "Bottom");
  await tailwind.clickOklchSpace("chromatic", 0.691, 0.466);
  await expect(tailwind.token()).toHaveText("pink-400");

  await tailwind.viewOklchSpaceFrom("chromatic", "Side");
  await tailwind.clickOklchSpace("chromatic", 0.447, 0.289);
  await expect(tailwind.token()).toHaveText("blue-400");
});

test("neutral 3D OKLCH space selects the clicked dot while the chromatic wheel stays flat", async ({ page }) => {
  const tailwind = new TailwindPage(page);
  await tailwind.open();
  await tailwind.chooseWheelView("neutral", "3D");
  await expect(tailwind.oklchSpace("neutral")).toHaveAttribute("aria-label", /No token selected in this space/);
  await expect(tailwind.canvas("chromatic")).toBeVisible();

  // Where mauve-500 projects from the initial camera, clear of every other dot.
  await tailwind.clickOklchSpace("neutral", 0.69, 0.46);
  await expect(tailwind.token()).toHaveText("mauve-500");
  await expect(tailwind.oklchSpace("neutral")).toHaveAttribute("aria-label", /Selected mauve-500, #/);

  await tailwind.chooseWheelView("neutral", "2D");
  await expect(tailwind.canvas("neutral")).toHaveAttribute("aria-label", /Selected mauve-500/);
});

test("both 3D OKLCH spaces label the screen's pure colors around the hue ring", async ({ page }, testInfo) => {
  const tailwind = new TailwindPage(page);
  await tailwind.open();
  await tailwind.chooseWheelView("chromatic", "3D");
  await tailwind.chooseWheelView("neutral", "3D");

  for (const kind of ["chromatic", "neutral"] as const) {
    for (const hex of ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF"]) {
      await expect(tailwind.hueLabels(kind).getByText(hex, { exact: true })).toBeVisible();
    }
  }
  await tailwind.captureScreenshot(testInfo.outputPath("tailwind-hue-labels.png"));

  // Labels overlay the canvas without blocking dot selection.
  await tailwind.clickOklchSpace("neutral", 0.69, 0.46);
  await expect(tailwind.token()).toHaveText("mauve-500");
});
