import { expect, test } from "./fixtures";

import { HydrationPage } from "../pages/HydrationPage";

const routes = ["/base64/", "/url/", "/query/", "/jwt/", "/python-json/", "/timestamp/", "/tailwind/"];

for (const route of routes) {
  test(`${route} hydrates Astro islands in development`, async ({ page }) => {
    const hydration = new HydrationPage(page);
    await hydration.open(route);

    await expect(hydration.pendingIslands()).toHaveCount(0);
  });
}
