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

    for (const kind of ["chromatic", "neutral"] as const) {
      await tailwind.focusWheelView(kind, "3D HSL");
      await tailwind.activateFocusedWheelView();
      const hslButton = tailwind.wheelViewButton(kind, "3D HSL");
      await expect(hslButton).toBeVisible();
      await expect(hslButton).toBeFocused();
      await expect(hslButton).toHaveAttribute("aria-pressed", "true");
      await expect(tailwind.colorSpace(kind)).toBeVisible();
      await expect(tailwind.colorSpace(kind)).toHaveAttribute("aria-label", new RegExp(`${kind} HSL space`, "i"));
      expect(await tailwind.hasHorizontalOverflow()).toBe(false);

      await tailwind.chooseWheelView(kind, "3D OKLCH");
      await expect(tailwind.wheelViewButton(kind, "3D OKLCH")).toHaveAttribute("aria-pressed", "true");
      await expect(tailwind.colorSpace(kind)).toHaveAttribute("aria-label", new RegExp(`${kind} OKLCH space`, "i"));
      expect(await tailwind.hasHorizontalOverflow()).toBe(false);
      await tailwind.chooseWheelView(kind, "2D");
      await expect(tailwind.wheelViewButton(kind, "2D")).toHaveAttribute("aria-pressed", "true");
    }

    await tailwind.chooseWheelView("chromatic", "3D HSL");
    await tailwind.chooseWheelView("neutral", "3D HSL");
    expect(await tailwind.hasHorizontalOverflow()).toBe(false);
    await tailwind.captureScreenshot(testInfo.outputPath(`tailwind-mobile-${theme}-hsl.png`));
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
  await tailwind.chooseWheelView("chromatic", "3D OKLCH");
  await expect(tailwind.colorSpace("chromatic")).toHaveAttribute("aria-label", /No token selected in this space/);

  // Where fuchsia-600 projects from the initial camera, clear of every other dot.
  await tailwind.clickColorSpace("chromatic", 0.792, 0.443);
  await expect(tailwind.token()).toHaveText("fuchsia-600");
  await expect(tailwind.colorSpace("chromatic")).toHaveAttribute("aria-label", /Selected fuchsia-600, #/);
  await tailwind.captureScreenshot(testInfo.outputPath("tailwind-oklch-space.png"));

  await tailwind.dragColorSpace("chromatic", 0.25);
  await expect(tailwind.token()).toHaveText("fuchsia-600");

  await tailwind.chooseWheelView("chromatic", "2D");
  await expect(tailwind.canvas("chromatic")).toHaveAttribute("aria-label", /Selected fuchsia-600/);
});

test("3D OKLCH space view buttons move the camera to the top, side, and bottom", async ({ page }) => {
  const tailwind = new TailwindPage(page);
  await tailwind.open();
  await tailwind.chooseWheelView("chromatic", "3D OKLCH");

  // Each point is where an otherwise unobstructed dot projects from that camera.
  await tailwind.viewColorSpaceFrom("chromatic", "Top");
  await tailwind.clickColorSpace("chromatic", 0.651, 0.537);
  await expect(tailwind.token()).toHaveText("pink-300");

  await tailwind.viewColorSpaceFrom("chromatic", "Bottom");
  await tailwind.clickColorSpace("chromatic", 0.691, 0.466);
  await expect(tailwind.token()).toHaveText("pink-400");

  await tailwind.viewColorSpaceFrom("chromatic", "Side");
  await tailwind.clickColorSpace("chromatic", 0.447, 0.289);
  await expect(tailwind.token()).toHaveText("blue-400");
});

test("neutral 3D OKLCH space selects the clicked dot while the chromatic wheel stays flat", async ({ page }) => {
  const tailwind = new TailwindPage(page);
  await tailwind.open();
  await tailwind.chooseWheelView("neutral", "3D OKLCH");
  await expect(tailwind.colorSpace("neutral")).toHaveAttribute("aria-label", /No token selected in this space/);
  await expect(tailwind.canvas("chromatic")).toBeVisible();

  // Where mauve-500 projects from the initial camera, clear of every other dot.
  await tailwind.clickColorSpace("neutral", 0.69, 0.46);
  await expect(tailwind.token()).toHaveText("mauve-500");
  await expect(tailwind.colorSpace("neutral")).toHaveAttribute("aria-label", /Selected mauve-500, #/);

  await tailwind.chooseWheelView("neutral", "2D");
  await expect(tailwind.canvas("neutral")).toHaveAttribute("aria-label", /Selected mauve-500/);
});

test("both 3D OKLCH spaces label the screen's pure colors around the hue ring", async ({ page }, testInfo) => {
  const tailwind = new TailwindPage(page);
  await tailwind.open();
  await tailwind.chooseWheelView("chromatic", "3D OKLCH");
  await tailwind.chooseWheelView("neutral", "3D OKLCH");

  for (const kind of ["chromatic", "neutral"] as const) {
    for (const hex of ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF"]) {
      await expect(tailwind.hueLabels(kind).getByText(hex, { exact: true })).toBeVisible();
    }
  }
  await tailwind.captureScreenshot(testInfo.outputPath("tailwind-hue-labels.png"));

  // Labels overlay the canvas without blocking dot selection.
  await tailwind.clickColorSpace("neutral", 0.69, 0.46);
  await expect(tailwind.token()).toHaveText("mauve-500");
});

test("3D HSL spaces select chromatic and high-saturation neutral colors", async ({ page }, testInfo) => {
  const tailwind = new TailwindPage(page);
  await tailwind.open();

  await tailwind.chooseWheelView("chromatic", "3D HSL");
  await expect(tailwind.colorSpace("chromatic")).toHaveAttribute("aria-label", /Chromatic HSL space/);
  // Halfway between red and yellow, the encoded-sRGB HSL hue sweep produces #ff8000.
  const intermediateHuePixels = await tailwind.colorSpacePixels("chromatic", [{ x: 0.74, y: 0.67 }]);
  const [orangeRed, orangeGreen, orangeBlue] = intermediateHuePixels[0]!;
  expect(orangeRed).toBeGreaterThan(220);
  expect(orangeGreen).toBeGreaterThan(90);
  expect(orangeGreen).toBeLessThan(160);
  expect(orangeBlue).toBeLessThan(50);
  // red-500 has HSL (357.5°, 96.1%, 57.8%); its point projects near 82%, 40% from the initial camera.
  await tailwind.hoverColorSpace("chromatic", 0.82, 0.4);
  await expect(tailwind.colorSpace("chromatic")).toHaveAttribute("title", "red-500");
  await tailwind.clickColorSpace("chromatic", 0.82, 0.4);
  await expect(tailwind.token()).toHaveText("red-500");
  await expect(tailwind.hexInput()).toHaveValue("#fb2c36");
  await expect(tailwind.colorSpace("chromatic")).toHaveAttribute("aria-label", /Selected red-500, #fb2c36/);

  await tailwind.chooseWheelView("neutral", "3D HSL");
  await expect(tailwind.colorSpace("neutral")).toHaveAttribute("aria-label", /outer grid represents 85% saturation/i);
  // slate-950 (#020618) has HSL (229.1°, 84.6%, 5.1%); neutral scaling puts it near 26%, 83% from the initial camera.
  await tailwind.hoverColorSpace("neutral", 0.26, 0.83);
  await expect(tailwind.colorSpace("neutral")).toHaveAttribute("title", "slate-950");
  await tailwind.clickColorSpace("neutral", 0.26, 0.83);
  await expect(tailwind.token()).toHaveText("slate-950");
  await expect(tailwind.hexInput()).toHaveValue("#020618");
  await expect(tailwind.colorSpace("neutral")).toHaveAttribute("aria-label", /Selected slate-950, #020618/);

  for (const hex of ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF"])
    await expect(tailwind.hueLabel("neutral", hex)).toBeVisible();
  const redLabelX = await tailwind.hueLabelX("neutral", "#FF0000");
  const yellowLabelX = await tailwind.hueLabelX("neutral", "#FFFF00");
  const greenLabelX = await tailwind.hueLabelX("neutral", "#00FF00");
  expect(redLabelX).toBeGreaterThan(yellowLabelX);
  expect(yellowLabelX).toBeGreaterThan(greenLabelX);
  await tailwind.captureScreenshot(testInfo.outputPath("tailwind-hsl-spaces.png"));
});

test("3D HSL selection survives model switches, and drags and camera controls preserve it", async ({
  page,
}, testInfo) => {
  const tailwind = new TailwindPage(page);
  await tailwind.open();
  await tailwind.chooseWheelView("chromatic", "3D HSL");

  // red-500 has HSL (357.5°, 96.1%, 57.8%); its initial camera point is near 82%, 40%.
  await tailwind.clickColorSpace("chromatic", 0.82, 0.4);
  await expect(tailwind.token()).toHaveText("red-500");
  await tailwind.hoverColorSpace("chromatic", 0.82, 0.4);
  await expect(tailwind.colorSpace("chromatic")).toHaveAttribute("title", /.+/);

  await tailwind.chooseWheelView("chromatic", "3D OKLCH");
  await expect(tailwind.colorSpace("chromatic")).not.toHaveAttribute("title");
  await expect(tailwind.colorSpace("chromatic")).toHaveAttribute("aria-label", /Selected red-500/);
  await tailwind.captureScreenshot(testInfo.outputPath("tailwind-hsl-selection-in-oklch.png"));

  await tailwind.chooseWheelView("chromatic", "3D HSL");
  const samplePoints = [0.25, 0.4, 0.55, 0.7].flatMap((x) => [0.25, 0.4, 0.55, 0.7].map((y) => ({ x, y })));
  const beforeDrag = await tailwind.colorSpacePixels("chromatic", samplePoints);
  await tailwind.dragColorSpace("chromatic", 0.25);
  const afterDrag = await tailwind.colorSpacePixels("chromatic", samplePoints);
  expect(afterDrag).not.toEqual(beforeDrag);
  await expect(tailwind.token()).toHaveText("red-500");
  await expect(tailwind.colorSpace("chromatic")).toHaveAttribute("aria-label", /Selected red-500/);

  // From top and bottom, lightness collapses along the view axis and red-500 stays at the same hue radius.
  await tailwind.viewColorSpaceFrom("chromatic", "Top");
  await tailwind.enterHex("#2b7fff");
  await tailwind.clickColorSpace("chromatic", 0.82, 0.5);
  await expect(tailwind.token()).toHaveText("red-700");
  await tailwind.viewColorSpaceFrom("chromatic", "Bottom");
  await tailwind.enterHex("#2b7fff");
  await tailwind.captureScreenshot(testInfo.outputPath("tailwind-hsl-bottom-view.png"));
  await tailwind.clickColorSpace("chromatic", 0.79, 0.48);
  await expect(tailwind.token()).toHaveText("red-950");

  // From the side, red hue lies near the view axis and the token's lightness sets its vertical position.
  await tailwind.viewColorSpaceFrom("chromatic", "Side");
  await tailwind.enterHex("#2b7fff");
  await tailwind.captureScreenshot(testInfo.outputPath("tailwind-hsl-side-view.png"));
  await tailwind.clickColorSpace("chromatic", 0.82, 0.4);
  await expect(tailwind.token()).toHaveText("rose-500");
  await tailwind.captureScreenshot(testInfo.outputPath("tailwind-hsl-camera-presets.png"));

  await tailwind.chooseWheelView("chromatic", "2D");
  await expect(tailwind.canvas("chromatic")).toHaveAttribute("aria-label", /Selected rose-500/);
});
