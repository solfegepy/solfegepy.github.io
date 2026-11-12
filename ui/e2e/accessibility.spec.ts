import { expect, test } from "@playwright/test";

import { AccessibilityPage } from "../pages/AccessibilityPage";

const routes = [
  "/base64/",
  "/url/",
  "/query/",
  "/jwt/",
  "/python-json/",
  "/timestamp/",
  "/tailwind/",
  "/about/",
  "/faq/",
  "/privacy/",
  "/ascii/",
  "/cheatsheets/openssl/",
  "/cheatsheets/ssh/",
];

for (const route of routes) {
  test(`${route} has accessible names`, async ({ page }) => {
    const accessibility = new AccessibilityPage(page);
    await accessibility.open(route);

    expect(await accessibility.violations()).toEqual([]);
  });
}

test("consent banner has accessible names", async ({ page }) => {
  const accessibility = new AccessibilityPage(page);
  await accessibility.openConsentBanner();

  expect(await accessibility.violations()).toEqual([]);
});

test("consent settings have accessible names", async ({ page }) => {
  const accessibility = new AccessibilityPage(page);
  await accessibility.openConsentSettings();

  expect(await accessibility.violations()).toEqual([]);
});
