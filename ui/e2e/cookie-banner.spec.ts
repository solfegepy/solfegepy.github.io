import { expect, test } from "@playwright/test";

import { CodecPage } from "../pages/CodecPage";
import { CookieBanner } from "../pages/CookieBanner";

test("reject all hides the banner for good and loads no tracker", async ({ page }) => {
  const codec = new CodecPage(page);
  const cookies = new CookieBanner(page);
  await cookies.install();
  await codec.open();

  await cookies.rejectAll();
  await expect(cookies.banner).toBeHidden();
  await cookies.reloadPage();

  await expect(cookies.banner).toBeHidden();
  expect(cookies.analyticsRequests).toEqual([]);
});

test("accept all loads the tracker once, only after the click, with advertising granted", async ({ page }) => {
  const codec = new CodecPage(page);
  const cookies = new CookieBanner(page);
  await cookies.install();
  await codec.open();

  await expect(cookies.banner).toBeVisible();
  expect(cookies.analyticsRequests).toEqual([]);
  await cookies.acceptAll();

  await expect.poll(() => cookies.analyticsRequests.length).toBe(1);
  expect(await cookies.adStorageConsent()).toBe("granted");
});

test("cookie settings on the privacy page allow analytics without advertising", async ({ page }) => {
  const codec = new CodecPage(page);
  const cookies = new CookieBanner(page);
  await cookies.install();
  await codec.open("/privacy");
  await cookies.rejectAll();

  await cookies.openSettingsFromPrivacyPage();
  await expect(cookies.settings).toBeVisible();
  await cookies.allowAnalyticsOnly();

  await expect.poll(() => cookies.analyticsRequests.length).toBe(1);
  expect(await cookies.adStorageConsent()).toBe("denied");
});

test("withdrawing consent deletes the analytics cookies and reloads the page", async ({ page }) => {
  const codec = new CodecPage(page);
  const cookies = new CookieBanner(page);
  await cookies.install();
  await codec.open("/privacy");
  await cookies.acceptAll();
  // The stubbed gtag.js sets nothing, so plant the cookie the real one would set.
  await page.context().addCookies([{ name: "_ga", value: "GA1.1.1.1", url: page.url() }]);

  await cookies.openSettingsFromPrivacyPage();
  await Promise.all([page.waitForEvent("load"), cookies.rejectAllInSettings()]);

  expect(await cookies.cookieNames()).not.toContain("_ga");
});

test("is not a cookie wall: the main tool still works while the banner is open", async ({ page }) => {
  const codec = new CodecPage(page);
  const cookies = new CookieBanner(page);
  await cookies.install();
  await codec.open();

  await expect(cookies.banner).toBeVisible();
  await codec.fill("base64-input", "hello");
  await codec.convert().click();
  await expect(codec.output("base64-output")).toHaveValue("aGVsbG8=");
});

test("the banner links to a policy naming every tracker and cookie", async ({ page }) => {
  const codec = new CodecPage(page);
  const cookies = new CookieBanner(page);
  await cookies.install();
  await codec.open();

  await cookies.followPolicyLink();

  await expect(page).toHaveURL(/\/privacy$/);
  const policy = page.getByTestId("privacy-content");
  await expect(policy).toContainText("Google Analytics");
  for (const cookie of ["cc_cookie", "_ga", "_ga_J0WPVDJ942", "_gcl_*"])
    await expect(page.getByTestId("privacy-cookie-table")).toContainText(cookie);
  await expect(policy.locator('a[href="https://policies.google.com/technologies/partner-sites"]')).toBeVisible();
});

test("the about page opens with a link to the privacy policy", async ({ page }) => {
  const codec = new CodecPage(page);
  await codec.open("/about");

  const lead = page.getByTestId("about-lead");
  await expect(lead).toBeVisible();
  await expect(lead.getByRole("link").first()).toHaveAttribute("href", "/privacy");
});
