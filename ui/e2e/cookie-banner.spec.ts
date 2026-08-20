import { expect, test, type Page } from "@playwright/test";

import { CodecPage } from "../pages/CodecPage";
import { CookieBannerPage } from "../pages/CookieBannerPage";

const GA_SCRIPT_PATTERN = /googletagmanager\.com\/gtag\/js/;

async function stubGoogleTagManager(page: Page): Promise<{ requested: () => boolean }> {
  let requested = false;
  await page.route(GA_SCRIPT_PATTERN, async (route) => {
    requested = true;
    await route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });
  return { requested: () => requested };
}

test("first visit shows the banner and loads no tracker", async ({ page }) => {
  const codec = new CodecPage(page);
  const cookies = new CookieBannerPage(page);
  const gtm = await stubGoogleTagManager(page);
  await codec.open();

  expect(await cookies.bannerVisible()).toBe(true);
  expect(gtm.requested()).toBe(false);
  expect(await cookies.noTrackerScript()).toBe(true);
  expect((await page.context().cookies()).some((cookie) => cookie.name === "_ga")).toBe(false);
});

test("accept hides the banner, loads the tracker, and survives a reload", async ({ page }) => {
  const codec = new CodecPage(page);
  const cookies = new CookieBannerPage(page);
  const gtm = await stubGoogleTagManager(page);
  await codec.open();

  await cookies.accept();
  await expect(cookies.banner()).toBeHidden();
  await expect.poll(() => gtm.requested()).toBe(true);
  expect(await cookies.noTrackerScript()).toBe(false);

  await page.reload();
  await expect(cookies.banner()).toBeHidden();
  expect(await cookies.noTrackerScript()).toBe(false);
});

test("reject hides the banner and never loads the tracker, even after navigating", async ({ page }) => {
  const codec = new CodecPage(page);
  const cookies = new CookieBannerPage(page);
  const gtm = await stubGoogleTagManager(page);
  await codec.open();

  await cookies.reject();
  await expect(cookies.banner()).toBeHidden();
  expect(gtm.requested()).toBe(false);

  await codec.open("/url");
  expect(gtm.requested()).toBe(false);
  expect(await cookies.noTrackerScript()).toBe(true);
});

test("is not a cookie wall: the main tool still works while the banner is open", async ({ page }) => {
  const codec = new CodecPage(page);
  const cookies = new CookieBannerPage(page);
  await codec.open();

  expect(await cookies.bannerVisible()).toBe(true);
  await codec.fill("base64-input", "hello");
  await codec.convert().click();
  await expect(codec.output("base64-output")).toHaveValue("aGVsbG8=");
});

test("footer cookie settings reopens the banner after a decision", async ({ page }) => {
  const codec = new CodecPage(page);
  const cookies = new CookieBannerPage(page);
  await codec.open();

  await cookies.reject();
  await expect(cookies.banner()).toBeHidden();
  await cookies.openCookieSettingsFromFooter();
  await expect(cookies.banner()).toBeVisible();
});

test("withdrawing consent after accepting disables the tracker", async ({ page }) => {
  const codec = new CodecPage(page);
  const cookies = new CookieBannerPage(page);
  await stubGoogleTagManager(page);
  await codec.open();

  await cookies.accept();
  await expect(cookies.banner()).toBeHidden();
  await cookies.openCookieSettingsFromFooter();
  await expect(cookies.banner()).toBeVisible();
  await cookies.reject();

  await page.waitForLoadState();
  expect(await cookies.noTrackerScript()).toBe(true);
  expect((await cookies.consentRecord())?.status).toBe("denied");
});

test("a stale consent record re-shows the banner", async ({ page }) => {
  const codec = new CodecPage(page);
  const cookies = new CookieBannerPage(page);
  const staleDecidedAt = Date.now() - 181 * 24 * 60 * 60 * 1_000;
  await cookies.seedConsent("granted", staleDecidedAt);
  await codec.open();

  expect(await cookies.bannerVisible()).toBe(true);
});

test("a corrupt consent record is treated as undecided", async ({ page }) => {
  const codec = new CodecPage(page);
  const cookies = new CookieBannerPage(page);
  const gtm = await stubGoogleTagManager(page);
  await cookies.seedCorruptConsent();
  await codec.open();

  expect(await cookies.bannerVisible()).toBe(true);
  expect(gtm.requested()).toBe(false);
});

test("the privacy page names the vendor and lists each cookie", async ({ page }) => {
  const codec = new CodecPage(page);
  await codec.open("/privacy");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy & Cookies Policy");
  await expect(page.getByTestId("privacy-cookie-table")).toContainText("_ga");
  await expect(page.getByTestId("privacy-cookie-table")).toContainText("_ga_J0WPVDJ942");
  await expect(page.getByTestId("privacy-google-analytics")).toContainText("Google Analytics");
});
