import { expect, test } from "@playwright/test";

import { AsciiPage } from "../pages/AsciiPage";
import { CodecPage } from "../pages/CodecPage";

test("direct ASCII reference loading hydrates and resolves a hex code", async ({ page }) => {
  const ascii = new AsciiPage(page);
  const codec = new CodecPage(page);
  await codec.setViewport(1440, 1000);
  await codec.useTheme("light");
  await ascii.open();

  await expect(ascii.heading()).toBeVisible();
  await expect(ascii.navigationLink().first()).toHaveAttribute("aria-current", "page");
  await ascii.search("5E");
  await expect(ascii.rows()).toHaveCount(1);
  await expect(ascii.firstRowCells()).toHaveText(["^", "94", "U+005E", "%5E"]);
  await ascii.captureScreenshot("test-results/ascii-desktop-light.png");
});

test("desktop Encoding navigation opens the ASCII reference", async ({ page }) => {
  const ascii = new AsciiPage(page);
  const codec = new CodecPage(page);
  await codec.setViewport(1440, 1000);
  await codec.useTheme("dark");
  await codec.open();
  await ascii.openFromDesktopNavigation();

  await expect(page).toHaveURL(/\/ascii\/$/);
  await expect(ascii.heading()).toBeVisible();
  await expect(ascii.navigationLink().first()).toHaveAttribute("aria-current", "page");
  await ascii.captureScreenshot("test-results/ascii-desktop-dark.png");
});

test("mobile drawer opens the reference and keeps enlarged table overflow inside the page", async ({ page }) => {
  const ascii = new AsciiPage(page);
  const codec = new CodecPage(page);
  await codec.setMobileViewport();
  await codec.useTheme("light");
  await codec.open();
  await ascii.openFromMobileNavigation();
  await codec.useLargeText();

  await expect(page).toHaveURL(/\/ascii\/$/);
  await expect(ascii.heading()).toBeVisible();
  await expect(ascii.searchInput()).toBeVisible();
  await expect(codec.drawer()).toBeHidden();
  expect(await ascii.rootFontSize()).toBe("32px");
  await ascii.search("5E");
  await expect(ascii.rows()).toHaveCount(1);
  const layout = await ascii.layout();
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.tableScrollWidth).toBeGreaterThan(layout.tableClientWidth);
  await ascii.captureScreenshot("test-results/ascii-mobile-light.png");

  await codec.useTheme("dark");
  await ascii.reload();
  await codec.useLargeText();
  expect(await ascii.rootFontSize()).toBe("32px");
  await ascii.search("5E");
  await ascii.captureScreenshot("test-results/ascii-mobile-dark.png");
});
