import { expect, test, type TestInfo } from "@playwright/test";

import { CodecPage } from "../pages/CodecPage";
import { OpenSslPage } from "../pages/OpenSslPage";
import { SshPage } from "../pages/SshPage";

async function capturePageVariants(
  codec: CodecPage,
  testInfo: TestInfo,
  pageName: string,
  open: () => Promise<void>,
): Promise<void> {
  for (const [viewport, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 320, 812],
  ] as const) {
    for (const theme of ["light", "dark"] as const) {
      await codec.setViewport(width, height);
      await codec.useTheme(theme);
      await open();
      if (viewport === "mobile") await codec.useLargeText();
      await expect(codec.htmlRoot()).toHaveAttribute("data-theme", theme);
      await codec.captureScreenshot(testInfo.outputPath(`${pageName}-${viewport}-${theme}.png`));
    }
  }
}

test("direct cheatsheet routes expose the matching heading and only their active navigation link", async ({ page }) => {
  const codec = new CodecPage(page);
  const openSsl = new OpenSslPage(page);
  const ssh = new SshPage(page);
  const desktop = codec.sidebar();

  await openSsl.open();
  await expect(openSsl.heading()).toBeVisible();
  expect(codec.currentUrl()).toMatch(/\/cheatsheets\/openssl\/$/);
  await expect(codec.activeNavigationLinks("desktop")).toHaveCount(1);
  await expect(openSsl.navigationLink(desktop)).toHaveAttribute("aria-current", "page");
  await expect(ssh.navigationLink(desktop)).not.toHaveAttribute("aria-current", "page");

  await ssh.open();
  await expect(ssh.heading()).toBeVisible();
  expect(codec.currentUrl()).toMatch(/\/cheatsheets\/ssh\/$/);
  await expect(codec.activeNavigationLinks("desktop")).toHaveCount(1);
  await expect(ssh.navigationLink(desktop)).toHaveAttribute("aria-current", "page");
  await expect(openSsl.navigationLink(desktop)).not.toHaveAttribute("aria-current", "page");
  expect(await codec.hasHorizontalOverflow()).toBe(false);
});

test("desktop CHEATSHEETS navigation opens OpenSSL before SSH", async ({ page }) => {
  const codec = new CodecPage(page);
  const openSsl = new OpenSslPage(page);
  const ssh = new SshPage(page);
  await codec.open();

  const group = codec.cheatsheetsGroup("desktop");
  expect(await codec.cheatsheetLinkNames("desktop")).toEqual(["OpenSSL", "SSH"]);

  await openSsl.followNavigationLink(group);
  expect(codec.currentUrl()).toMatch(/\/cheatsheets\/openssl\/$/);
  await expect(openSsl.heading()).toBeVisible();
  await expect(codec.activeNavigationLinks("desktop")).toHaveCount(1);

  await ssh.followNavigationLink(group);
  expect(codec.currentUrl()).toMatch(/\/cheatsheets\/ssh\/$/);
  await expect(ssh.heading()).toBeVisible();
  await expect(codec.activeNavigationLinks("desktop")).toHaveCount(1);
});

test("mobile drawer opens each cheatsheet and closes after navigation", async ({ page }) => {
  const codec = new CodecPage(page);
  const openSsl = new OpenSslPage(page);
  const ssh = new SshPage(page);
  await codec.setMobileViewport();
  await codec.open();

  for (const [targetPage, otherPage, route] of [
    [openSsl, ssh, /\/cheatsheets\/openssl\/$/],
    [ssh, openSsl, /\/cheatsheets\/ssh\/$/],
  ] as const) {
    await codec.openDrawer();
    const drawer = codec.drawer();
    const group = codec.cheatsheetsGroup("mobile");
    await expect(openSsl.navigationLink(group)).toBeVisible();
    await expect(ssh.navigationLink(group)).toBeVisible();
    await targetPage.followNavigationLink(group);
    expect(codec.currentUrl()).toMatch(route);
    await expect(targetPage.heading()).toBeVisible();
    expect(await codec.isDrawerOpen()).toBe(false);

    await codec.openDrawer();
    await expect(codec.activeNavigationLinks("mobile")).toHaveCount(1);
    await expect(targetPage.navigationLink(drawer)).toHaveAttribute("aria-current", "page");
    await expect(otherPage.navigationLink(drawer)).not.toHaveAttribute("aria-current", "page");
    await codec.closeDrawer();
    expect(await codec.isDrawerOpen()).toBe(false);
  }
});

test("cheatsheet commands and copy actions stay reachable at 320px with 200% text", async ({ page }, testInfo) => {
  const codec = new CodecPage(page);
  await codec.allowClipboard();
  await codec.setMobileViewport();
  const pages = [
    [new OpenSslPage(page), "openssl"],
    [new SshPage(page), "ssh"],
  ] as const;
  for (const [cheatsheet, pageName] of pages) {
    await cheatsheet.open();
    await codec.useLargeText();
    expect(await codec.hasHorizontalOverflow()).toBe(false);
    const commandCount = await cheatsheet.commandCount();
    expect(commandCount).toBeGreaterThan(0);
    expect(await cheatsheet.copyButtonCount()).toBe(commandCount);
    expect(await cheatsheet.copyButtonsAreEnabled()).toBe(true);
    await cheatsheet.focusFirstCopyButton();
    expect(await cheatsheet.firstCopyButtonOutlineStyle()).not.toBe("none");
    const command = await cheatsheet.firstCommandText();
    await cheatsheet.copyFirstCommand();
    await expect(cheatsheet.copyStatus()).toHaveText("Command copied.");
    expect(await codec.clipboardText()).toBe(command);
    await codec.captureScreenshot(testInfo.outputPath(`${pageName}-320px-200-percent-copy-status.png`), false);
    expect(await codec.hasHorizontalOverflow()).toBe(false);
  }
});

test("both cheatsheets remain legible in desktop and mobile light and dark themes", async ({ page }, testInfo) => {
  const codec = new CodecPage(page);
  const openSsl = new OpenSslPage(page);
  const ssh = new SshPage(page);
  await capturePageVariants(codec, testInfo, "openssl", () => openSsl.open());
  await capturePageVariants(codec, testInfo, "ssh", () => ssh.open());
});
