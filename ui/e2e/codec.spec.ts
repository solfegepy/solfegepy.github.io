import { expect, test } from "@playwright/test";

import { CodecPage } from "../pages/CodecPage";

test("publishes route metadata and navigates with browser history", async ({ page }) => {
  const codec = new CodecPage(page);
  await codec.open();
  await expect(codec.primaryHeading()).toHaveText("Base64 Decode and Encode");
  await expect(codec.canonical()).toHaveAttribute("href", "https://codec64.com/");
  await expect(codec.staticSection("Base64 FAQ")).toBeVisible();
  await codec.chooseTool("URL");
  await expect(page).toHaveURL(/\/url$/);
  await expect(codec.activeTool()).toHaveText("URL");
  await page.goBack();
  await expect(codec.activeTool()).toHaveText("Base64");
  await codec.open("/missing");
  await expect(page.getByText("This page could not be found")).toBeVisible();
});

test("unknown route renders branded fallback and recovers home", async ({ page }) => {
  const codec = new CodecPage(page);
  await codec.open("/missing/nested");
  await expect(codec.notFoundPage()).toBeVisible();
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(codec.primaryHeading()).toContainText("404");
  await expect(codec.notFoundHome()).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(codec.notFoundHome()).toBeFocused();
  expect(await codec.notFoundHome().evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
  await codec.recoverFromNotFound();
  await expect(page).toHaveURL(/\/$/);
  await expect(codec.primaryHeading()).toHaveText("Base64 Decode and Encode");
});

test("404 fallback fits 320px with large text", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  const codec = new CodecPage(page);
  await codec.open("/missing");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await expect(codec.notFoundPage()).toBeVisible();
  await expect(codec.notFoundHome()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("404 fallback follows system light and dark themes", async ({ page }) => {
  const codec = new CodecPage(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await codec.open("/missing");
  await expect(codec.root()).toHaveAttribute("data-theme", "dark");
  const darkBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  await page.emulateMedia({ colorScheme: "light" });
  await page.reload();
  await expect(codec.root()).toHaveAttribute("data-theme", "light");
  const lightBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(lightBackground).not.toBe(darkBackground);
});

test("desktop shell is full width with fixed-size sticky sidebar", async ({ page }) => {
  const codec = new CodecPage(page);
  await codec.open();
  await expect(codec.sidebar()).toBeVisible();
  expect(await codec.sidebar().evaluate((node) => getComputedStyle(node).width)).toBe("256px");
  expect(await codec.sidebar().evaluate((node) => getComputedStyle(node).position)).toBe("sticky");
  expect(await page.getByTestId("codec-app").evaluate((node) => node.getBoundingClientRect().width)).toBe(
    await page.evaluate(() => innerWidth),
  );
});

test("mobile drawer traps focus, closes, and fits large text at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  const codec = new CodecPage(page);
  await codec.open();
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await expect(codec.sidebar()).toBeHidden();
  await codec.openDrawer();
  await expect(codec.drawer()).toBeVisible();
  await expect(page.getByTestId("drawer-close")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByTestId("mobile-drawer").getByTestId("theme-control")).toBeFocused();
  expect(
    await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((node) => node.getBoundingClientRect().right > innerWidth + 1)
        .map((node) => `${node.tagName}.${node.className}:${Math.round(node.getBoundingClientRect().right)}`),
    ),
  ).toEqual([]);
  await page.getByTestId("drawer-close").focus();
  await page.keyboard.press("Escape");
  await expect(codec.drawer()).toBeHidden();
  await expect(page.getByTestId("menu-button")).toBeFocused();
  await codec.format("base64", "top").focus();
  await expect(codec.format("base64", "top")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(codec.format("base64", "top")).toHaveValue("base64");
  await codec.openDrawer();
  await page.getByTestId("mobile-drawer").getByTestId("tool-link-query").click();
  await expect(page).toHaveURL(/\/query$/);
  await expect(codec.drawer()).toBeHidden();
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await codec.format("query", "top").focus();
  await page.keyboard.press("ArrowDown");
  await expect(codec.format("query", "top")).toHaveValue("json");
  await page.keyboard.press("Tab");
  await expect(codec.input("query-input")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("codec-workspace-swap")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Convert" })).toBeFocused();
  expect(
    await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-testid="query-workspace"] *')]
        .filter((node) => node.getBoundingClientRect().right > innerWidth + 1)
        .map((node) => `${node.tagName}.${node.className}:${Math.round(node.getBoundingClientRect().right)}`),
    ),
  ).toEqual([]);
  await codec.open("/url");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await expect(page.getByTestId("url-mode-comparison")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("page reload resets Base64 workspace without network input leakage", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const codec = new CodecPage(page);
  await codec.open();
  await expect(codec.input("base64-input")).toHaveValue("Hello, world!");
  await expect(codec.output("base64-output")).toHaveValue("SGVsbG8sIHdvcmxkIQ==");
  await expect(codec.format("base64", "top")).toHaveValue("plain");
  await codec.fill("base64-input", "secret value");
  await codec.chooseBottomFormat("base64", "base64url");
  await codec.act("Convert");
  await codec.chooseTopFormat("base64", "base64url");
  await page.reload();
  await expect(codec.input("base64-input")).toHaveValue("Hello, world!");
  await expect(codec.output("base64-output")).toHaveValue("SGVsbG8sIHdvcmxkIQ==");
  await expect(codec.format("base64", "top")).toHaveValue("plain");
  await expect(codec.format("base64", "bottom")).toHaveValue("base64");
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
  expect(requests.every((url) => !url.includes("secret"))).toBe(true);
  expect(page.url()).not.toContain("secret");
});

test("new browser context starts with example workspace", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const codec = new CodecPage(page);
  await codec.open();
  await expect(codec.input("base64-input")).toHaveValue("Hello, world!");
  await expect(codec.output("base64-output")).toHaveValue("SGVsbG8sIHdvcmxkIQ==");
  await codec.open("/query");
  await expect(codec.input("query-input")).toHaveValue("?name=Ada&active=true");
  await expect(codec.output("query-output")).toHaveValue('{\n  "name": "Ada",\n  "active": "true"\n}');
  await codec.open("/python-json");
  await expect(codec.input("python-input")).toHaveValue("{'name': 'Ada', 'active': True}");
  await expect(codec.output("python-output")).toHaveValue('{\n  "name": "Ada",\n  "active": true\n}');
  await context.close();
});

test("Convert tracks workspace freshness", async ({ page }) => {
  const codec = new CodecPage(page);
  await codec.open();
  await expect(codec.convert()).toBeDisabled();
  await codec.fill("base64-input", "fresh");
  await expect(codec.convert()).toBeEnabled();
  await codec.act("Convert");
  await expect(codec.output("base64-output")).toHaveValue("ZnJlc2g=");
  await expect(codec.convert()).toBeDisabled();
  await codec.chooseBottomFormat("base64", "base64url");
  await expect(codec.input("base64-input")).toHaveValue("fresh");
  await expect(codec.output("base64-output")).toHaveValue("ZnJlc2g=");
  await expect(codec.convert()).toBeEnabled();
  await codec.swap();
  await expect(codec.input("base64-input")).toHaveValue("ZnJlc2g=");
  await expect(codec.output("base64-output")).toHaveValue("fresh");
  await expect(codec.convert()).toBeDisabled();
  await codec.fill("base64-input", "***");
  await expect(codec.convert()).toBeEnabled();
  await codec.act("Convert");
  await expect(codec.alert()).toHaveText("Enter valid Base64.");
  await expect(codec.convert()).toBeDisabled();
  await codec.fill("base64-input", "Zg");
  await expect(codec.convert()).toBeEnabled();
  await codec.act("Clear");
  await expect(codec.input("base64-input")).toHaveValue("");
  await expect(codec.output("base64-output")).toHaveValue("");
  await expect(codec.convert()).toBeDisabled();
  await expect(page.getByRole("button", { name: "Copy output" })).toBeDisabled();
});

test("format selectors preserve text and swap exchanges channels", async ({ page }) => {
  const codec = new CodecPage(page);
  await codec.open();
  await codec.chooseTopFormat("base64", "base64url");
  await expect(codec.input("base64-input")).toHaveValue("Hello, world!");
  await expect(codec.output("base64-output")).toHaveValue("SGVsbG8sIHdvcmxkIQ==");
  await expect(codec.format("base64", "bottom")).toHaveValue("plain");
  await codec.chooseBottomFormat("base64", "base64");
  await expect(codec.format("base64", "top")).toHaveValue("plain");
  await codec.swap();
  await expect(codec.input("base64-input")).toHaveValue("SGVsbG8sIHdvcmxkIQ==");
  await expect(codec.output("base64-output")).toHaveValue("Hello, world!");
  await expect(codec.format("base64", "top")).toHaveValue("base64");
});

test("Query formats convert, preserve, swap, validate, and stay private", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const codec = new CodecPage(page);
  await codec.open("/query");
  await expect(codec.format("query", "top")).toHaveValue("query");
  await expect(codec.format("query", "bottom")).toHaveValue("json");
  await expect(codec.format("query", "top").getByRole("option", { name: "Query string" })).toHaveCount(1);
  await expect(codec.format("query", "top").getByRole("option", { name: "JSON" })).toHaveCount(1);
  await codec.chooseTopFormat("query", "json");
  await expect(codec.input("query-input")).toHaveValue("?name=Ada&active=true");
  await expect(codec.output("query-output")).toHaveValue('{\n  "name": "Ada",\n  "active": "true"\n}');
  await expect(codec.format("query", "bottom")).toHaveValue("query");
  await codec.chooseBottomFormat("query", "json");
  await codec.fill("query-input", "?private-query-value=1&private-query-value=2");
  await codec.act("Convert");
  await expect(codec.output("query-output")).toHaveValue('{\n  "private-query-value": [\n    "1",\n    "2"\n  ]\n}');
  await codec.swap();
  await expect(codec.format("query", "top")).toHaveValue("json");
  await expect(codec.output("query-output")).toHaveValue("?private-query-value=1&private-query-value=2");
  await codec.fill("query-input", '{"message":"hello world"}');
  await codec.act("Convert");
  await expect(codec.output("query-output")).toHaveValue("message=hello+world");
  await codec.fill("query-input", "[]");
  await codec.act("Convert");
  await expect(codec.alert()).toHaveText("JSON must be an object.");
  expect(requests.every((url) => !url.includes("private-query-value"))).toBe(true);
  expect(page.url()).not.toContain("private-query-value");
});

test("Python formats convert both directions and reject invalid JSON", async ({ page }) => {
  const codec = new CodecPage(page);
  await codec.open("/python-json");
  await expect(codec.format("python", "top")).toHaveValue("python");
  await expect(codec.format("python", "bottom")).toHaveValue("json");
  await expect(codec.format("python", "top").getByRole("option", { name: "Python literal" })).toHaveCount(1);
  await expect(codec.format("python", "top").getByRole("option", { name: "JSON" })).toHaveCount(1);
  await codec.chooseTopFormat("python", "json");
  await expect(codec.input("python-input")).toHaveValue("{'name': 'Ada', 'active': True}");
  await expect(codec.output("python-output")).toHaveValue('{\n  "name": "Ada",\n  "active": true\n}');
  await codec.fill("python-input", '{"items":[true,null,{"name":"Ada"}]}');
  await codec.act("Convert");
  await expect(codec.output("python-output")).toHaveValue("{'items': [True, None, {'name': 'Ada'}]}");
  await codec.swap();
  await expect(codec.format("python", "top")).toHaveValue("python");
  await codec.fill("python-input", "{'items': [True, None, {'name': 'Ada'}] }");
  await codec.act("Convert");
  await expect(codec.output("python-output")).toHaveValue(
    '{\n  "items": [\n    true,\n    null,\n    {\n      "name": "Ada"\n    }\n  ]\n}',
  );
  await codec.chooseTopFormat("python", "json");
  await codec.fill("python-input", "nope");
  await codec.act("Convert");
  await expect(codec.alert()).toHaveText("Enter valid JSON.");
});

test("page reload resets DATA workspace", async ({ page }) => {
  const codec = new CodecPage(page);
  await codec.open("/query");
  await codec.chooseTopFormat("query", "json");
  await codec.act("Clear");
  await page.reload();
  await expect(codec.input("query-input")).toHaveValue("?name=Ada&active=true");
  await expect(codec.output("query-output")).toHaveValue('{\n  "name": "Ada",\n  "active": "true"\n}');
  await expect(codec.format("query", "top")).toHaveValue("query");
});

test("URL modes convert, preserve, swap, validate, copy, clear, and stay private", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const codec = new CodecPage(page);
  await codec.open("/url");
  await expect(codec.format("url", "top")).toHaveValue("decoded");
  await expect(codec.format("url", "bottom")).toHaveValue("rfc3986");
  for (const option of ["Plain text", "RFC 3986 component", "Full URI", "Form URL encoded"]) {
    await expect(codec.format("url", "top").getByRole("option", { name: option })).toHaveCount(1);
  }
  await codec.chooseBottomFormat("url", "form");
  await expect(codec.input("url-input")).toHaveValue("https://example.com/search?q=hello world~");
  await expect(codec.output("url-output")).toHaveValue("https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world~");
  await codec.chooseBottomFormat("url", "rfc3986");
  await codec.fill("url-input", "private+a / c~d!");
  await codec.act("Convert");
  await expect(codec.output("url-output")).toHaveValue("private%2Ba%20%2F%20c~d%21");
  await codec.chooseBottomFormat("url", "uri");
  await codec.fill("url-input", "https://example.test/a path?q=café#part 1");
  await codec.act("Convert");
  await expect(codec.output("url-output")).toHaveValue("https://example.test/a%20path?q=caf%C3%A9#part%201");
  await codec.swap();
  await expect(codec.format("url", "top")).toHaveValue("uri");
  await expect(codec.format("url", "bottom")).toHaveValue("decoded");
  await codec.fill("url-input", "https://example.test/a%20path?q=caf%c3%a9#part%201");
  await codec.act("Convert");
  await expect(codec.output("url-output")).toHaveValue("https://example.test/a path?q=café#part 1");
  await codec.chooseBottomFormat("url", "form");
  await codec.fill("url-input", "a+b / c~d");
  await codec.act("Convert");
  await expect(codec.output("url-output")).toHaveValue("a%2Bb+%2F+c%7Ed");
  await codec.chooseTopFormat("url", "form");
  await codec.fill("url-input", "a+b%2Bc");
  await codec.act("Convert");
  await expect(codec.output("url-output")).toHaveValue("a b+c");
  await codec.act("Copy output");
  expect(await codec.clipboardText()).toBe("a b+c");
  await codec.fill("url-input", "%ZZ");
  await codec.act("Convert");
  await expect(codec.alert()).toHaveText("Enter valid percent-encoded text.");
  await expect(codec.output("url-output")).toHaveValue("");
  await codec.act("Clear");
  await expect(codec.input("url-input")).toHaveValue("");
  await expect(codec.output("url-output")).toHaveValue("");
  expect(requests.every((url) => !url.includes("private"))).toBe(true);
  expect(page.url()).not.toContain("private");
});

test("invalid Base64 remains rejected", async ({ page }) => {
  const codec = new CodecPage(page);
  await codec.open();
  await codec.chooseTopFormat("base64", "base64");
  await codec.fill("base64-input", "***");
  await codec.act("Convert");
  await expect(codec.alert()).toHaveText("Enter valid Base64.");
});

test("Timestamp converts every format privately and remains accessible", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const codec = new CodecPage(page);
  await codec.open();
  const beforeLoad = Math.floor(Date.now() / 1_000);
  await codec.chooseTool("Timestamp");
  const afterLoad = Math.floor(Date.now() / 1_000);
  await expect(page).toHaveURL(/\/timestamp$/);
  await expect(codec.activeTool()).toHaveText("Timestamp");
  await expect(codec.format("timestamp", "top")).toHaveValue("ztime");
  await expect(codec.format("timestamp", "bottom")).toHaveValue("timestamp-seconds");
  const initialSeconds = Number(await codec.output("timestamp-output").inputValue());
  expect(initialSeconds).toBeGreaterThanOrEqual(beforeLoad);
  expect(initialSeconds).toBeLessThanOrEqual(afterLoad);
  await expect(codec.input("timestamp-input")).toHaveValue(
    new Date(initialSeconds * 1_000).toISOString().replace(".000Z", "Z"),
  );
  await expect(codec.convert()).toBeDisabled();

  await codec.fill("timestamp-input", "2026-01-31T12:34:56.788Z");
  await codec.act("Convert");
  await expect(codec.output("timestamp-output")).toHaveValue("1769862896");
  await codec.chooseBottomFormat("timestamp", "timestamp-milliseconds");
  await codec.act("Convert");
  await expect(codec.output("timestamp-output")).toHaveValue("1769862896788");

  await codec.chooseTopFormat("timestamp", "timestamp-seconds");
  await codec.chooseBottomFormat("timestamp", "ztime");
  await codec.fill("timestamp-input", "1769862896.7899");
  await codec.act("Convert");
  await expect(codec.output("timestamp-output")).toHaveValue("2026-01-31T12:34:56.789Z");
  await codec.chooseBottomFormat("timestamp", "timestamp-milliseconds");
  await codec.fill("timestamp-input", "1.5");
  await codec.act("Convert");
  await expect(codec.output("timestamp-output")).toHaveValue("1500");
  await codec.swap();
  await expect(codec.format("timestamp", "top")).toHaveValue("timestamp-milliseconds");
  await expect(codec.input("timestamp-input")).toHaveValue("1500");

  await codec.chooseTopFormat("timestamp", "ztime");
  await codec.fill("timestamp-input", "2026-01-31T12:34:56+00:00");
  await codec.act("Convert");
  await expect(codec.alert()).toHaveText("Enter a valid UTC Z time from 1970 through 9999.");
  await codec.fill("timestamp-input", "1969-12-31T23:59:59.999Z");
  await codec.act("Convert");
  await expect(codec.alert()).toHaveText("Enter a valid UTC Z time from 1970 through 9999.");

  expect(requests.every((url) => !url.includes("1769862896.7899"))).toBe(true);
  expect(page.url()).not.toContain("1769862896.7899");
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);

  await page.setViewportSize({ width: 320, height: 812 });
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await codec.format("timestamp", "top").focus();
  await page.keyboard.press("ArrowDown");
  await expect(codec.format("timestamp", "top")).toHaveValue("timestamp-seconds");
  expect(
    await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((node) => node.getBoundingClientRect().right > innerWidth + 1)
        .map((node) => `${node.tagName}.${node.className}:${Math.round(node.getBoundingClientRect().right)}`),
    ),
  ).toEqual([]);

  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await expect(codec.root()).toHaveAttribute("data-theme", "dark");
  const darkBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.emulateMedia({ colorScheme: "light" });
  await page.reload();
  await expect(codec.root()).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(darkBackground);
});

const SYNTHETIC_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImFkbWluIjp0cnVlfQ.c3ludGhldGljLXNpZ25hdHVyZQ";

test("JWT route, navigation, history, and synthetic fixture", async ({ page }) => {
  const codec = new CodecPage(page);
  await codec.open();
  await codec.chooseTool("JWT");
  await expect(page).toHaveURL(/\/jwt$/);
  await expect(codec.activeTool()).toHaveText("JWT");
  await expect(codec.primaryHeading()).toHaveText("JWT Decoder");
  await expect(codec.canonical()).toHaveAttribute("href", "https://codec64.com/jwt");
  await expect(codec.jwtToken()).toHaveValue(SYNTHETIC_JWT);
  await expect(codec.jwtOutput("Header")).toHaveValue('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  await expect(codec.jwtOutput("Payload")).toHaveValue(
    '{\n  "sub": "1234567890",\n  "name": "Ada Lovelace",\n  "admin": true\n}',
  );
  await expect(codec.jwtOutput("Signature")).toHaveValue("c3ludGhldGljLXNpZ25hdHVyZQ");
  await expect(codec.jwtDecode()).toBeDisabled();
  await expect(codec.jwtWarning()).toHaveText("Decoded only. Signature not verified.");
  await page.goBack();
  await expect(codec.activeTool()).toHaveText("Base64");
  await page.goForward();
  await expect(codec.activeTool()).toHaveText("JWT");
});

test("JWT decodes, copies every segment, clears failures, and reloads fresh", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const codec = new CodecPage(page);
  await codec.open("/jwt");
  await codec.enterJwt("eyJhbGciOiJub25lIn0.eyJzdWIiOiJuZXcifQ.");
  await codec.decodeJwt();
  await expect(codec.jwtOutput("Header")).toHaveValue('{\n  "alg": "none"\n}');
  await expect(codec.jwtOutput("Payload")).toHaveValue('{\n  "sub": "new"\n}');
  await expect(codec.jwtOutput("Signature")).toHaveValue("");
  await expect(codec.jwtDecode()).toBeDisabled();

  await codec.enterJwt(SYNTHETIC_JWT);
  await codec.decodeJwt();
  for (const [segment, expected] of [
    ["Header", '{\n  "alg": "HS256",\n  "typ": "JWT"\n}'],
    ["Payload", '{\n  "sub": "1234567890",\n  "name": "Ada Lovelace",\n  "admin": true\n}'],
    ["Signature", "c3ludGhldGljLXNpZ25hdHVyZQ"],
  ] as const) {
    await codec.copyJwt(segment);
    expect(await codec.clipboardText()).toBe(expected);
    await expect(codec.status()).toHaveText(`${segment} copied.`);
  }

  await codec.enterJwt("bad");
  await codec.decodeJwt();
  await expect(codec.alert()).toHaveText("JWT must contain three segments.");
  for (const segment of ["Header", "Payload", "Signature"] as const) {
    await expect(codec.jwtOutput(segment)).toHaveValue("");
  }
  await codec.clearJwt();
  await expect(codec.jwtToken()).toHaveValue("");
  await expect(codec.alert()).toHaveCount(0);
  await page.reload();
  await expect(codec.jwtToken()).toHaveValue(SYNTHETIC_JWT);
  await expect(codec.jwtWarning()).toHaveText("Decoded only. Signature not verified.");
});

test("JWT private marker never enters request, URL, or browser storage", async ({ page }) => {
  const traffic: { url: string; body: string }[] = [];
  page.on("request", (request) => traffic.push({ url: request.url(), body: request.postData() ?? "" }));
  const codec = new CodecPage(page);
  const marker = "JWT_PRIVATE_MARKER_7f3";
  const payload = Buffer.from(JSON.stringify({ private: marker })).toString("base64url");
  const token = `eyJhbGciOiJIUzI1NiJ9.${payload}.c2ln`;
  await codec.open("/jwt");
  await codec.enterJwt(token);
  await codec.decodeJwt();
  await expect(codec.jwtOutput("Payload")).toContainText(marker);
  await codec.chooseTool("Base64");
  await page.goBack();
  await page.reload();

  expect(page.url()).not.toContain(marker);
  expect(page.url()).not.toContain(token);
  expect(
    traffic.every(
      ({ url, body }) =>
        !url.includes(marker) && !url.includes(token) && !body.includes(marker) && !body.includes(token),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      ({ marker, token }) =>
        !JSON.stringify(localStorage).includes(marker) &&
        !JSON.stringify(localStorage).includes(token) &&
        !JSON.stringify(sessionStorage).includes(marker) &&
        !JSON.stringify(sessionStorage).includes(token),
      { marker, token },
    ),
  ).toBe(true);
  await expect(codec.jwtToken()).toHaveValue(SYNTHETIC_JWT);
});

test("JWT stays stacked, keyboard accessible, and overflow-safe at 320px and 200% text", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 320, height: 812 });
  const codec = new CodecPage(page);
  await codec.open("/jwt");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await codec.enterJwt("bad");
  await codec.jwtToken().focus();
  await page.keyboard.press("Tab");
  await expect(codec.jwtDecode()).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(codec.alert()).toHaveText("JWT must contain three segments.");
  await expect(codec.jwtWarning()).toHaveText("Decoded only. Signature not verified.");
  await codec.enterJwt(SYNTHETIC_JWT);
  await codec.decodeJwt();
  await codec.copyJwt("Header");
  await expect(codec.status()).toHaveText("Header copied.");

  for (const testId of ["jwt-actions", "jwt-header-output", "jwt-payload-output", "jwt-signature-output"]) {
    await expect(page.getByTestId(testId)).toBeVisible();
  }
  const order = await page.evaluate(() =>
    ["jwt-input", "jwt-actions", "jwt-warning", "jwt-header-output", "jwt-payload-output", "jwt-signature-output"].map(
      (testId) => document.querySelector<HTMLElement>(`[data-testid="${testId}"]`)!.getBoundingClientRect().top,
    ),
  );
  expect(order).toEqual([...order].sort((left, right) => left - right));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
