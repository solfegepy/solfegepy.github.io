import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CodecApp } from "./CodecApp";

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({ matches: false })) });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

afterEach(() => vi.restoreAllMocks());

describe("CodecApp", () => {
  it("persists explicit theme and resets to system", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="base64" />);

    const dark = screen.getAllByRole("button", { name: "Use dark theme" })[0]!;
    expect(dark).toHaveAttribute("title", "Use dark theme");
    expect(dark).toHaveAttribute("data-testid", "theme-control");
    await user.click(dark);
    expect(localStorage.getItem("codec-bench-theme")).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    const reset = screen.getAllByRole("button", { name: "Use system theme" })[0]!;
    expect(reset).toHaveAttribute("title", "Use system theme");
    expect(reset).toHaveAttribute("data-testid", "theme-system-reset");
    await user.click(reset);
    expect(localStorage.getItem("codec-bench-theme")).toBeNull();
    expect(document.documentElement.dataset.theme).toBe("light");
  });
  it("renders grouped routed navigation and active tool", () => {
    render(<CodecApp toolId="base64" />);
    expect(screen.getAllByTestId("tool-navigation-group")).toHaveLength(2);
    expect(screen.getAllByText("Encoding")).toHaveLength(1);
    expect(screen.getAllByText("Conversion")).toHaveLength(1);
    expect(screen.getAllByTestId("tool-navigation-group")[0]).toHaveTextContent("Base64URLQuery Params");
    expect(screen.getAllByTestId("tool-navigation-group")[0]).not.toHaveTextContent("Python → JSON");
    expect(screen.getAllByTestId("tool-navigation-group")[1]).toHaveTextContent("Python → JSONTimestamp");
    expect(screen.getAllByTestId("tool-link-base64")[0]).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Base64 Decode");
    expect(screen.getByTestId("sidebar-footer")).not.toHaveTextContent(/local only|no uploads/i);
  });

  it("opens accessible drawer, traps focus, and restores menu focus", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="base64" />);
    const menu = screen.getByTestId("menu-button");
    expect(screen.getByTestId("skip-link")).toHaveAttribute("href", "#main-content");
    expect(screen.getByTestId("desktop-home-link")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("mobile-home-link")).toHaveAttribute("href", "/");
    expect(menu).toHaveAttribute("title", "Open tools menu");
    await user.click(menu);
    expect(screen.getByTestId("mobile-drawer")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-backdrop")).toHaveAttribute("title", "Close tools menu");
    expect(screen.getByTestId("drawer-close")).toHaveAttribute("title", "Close tools menu");
    expect(screen.getByTestId("mobile-footer")).not.toHaveTextContent(/local only|no uploads/i);
    expect(screen.getByTestId("drawer-close")).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("mobile-drawer")).not.toBeInTheDocument();
    expect(menu).toHaveFocus();
  });

  it("loads Base64 defaults with contextual complementary formats", () => {
    render(<CodecApp toolId="base64" />);
    expect(screen.getByTestId("base64-top-format")).toHaveValue("plain");
    expect(screen.getByTestId("base64-bottom-format")).toHaveValue("base64");
    expect(screen.getByTestId("base64-top-format")).toHaveAccessibleName("Top channel format");
    expect(screen.getByTestId("base64-bottom-format")).toHaveAccessibleName("Bottom channel format");
    expect(screen.getAllByRole("option", { name: "Plain text" })).toHaveLength(2);
    expect(screen.getAllByRole("option", { name: "Base64 encoded" })).toHaveLength(2);
    expect(screen.getAllByRole("option", { name: "Base64url encoded" })).toHaveLength(2);
    expect(screen.queryByTestId("base64-variant")).not.toBeInTheDocument();
    expect(screen.getByTestId("tool-header")).toHaveTextContent("Base64url: uses - and _");
    expect(screen.getByTestId("base64-input")).toHaveValue("Hello, world!");
    expect(screen.getByTestId("base64-output")).toHaveValue("SGVsbG8sIHdvcmxkIQ==");
    expect(screen.getByTestId("base64-input")).toBeEnabled();
    expect(screen.getByTestId("base64-output")).toBeDisabled();
    expect(screen.getByTestId("base64-input")).toHaveAccessibleName("Input");
    expect(screen.getByTestId("base64-output")).toHaveAccessibleName("Output");
    expect(screen.queryByText("Top channel")).not.toBeInTheDocument();
    expect(screen.queryByText("Bottom channel")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Convert" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Convert" })).toHaveAttribute("data-testid", "action-button");
    expect(screen.getByRole("button", { name: "Convert" })).toHaveAttribute("title", "Convert");
    expect(screen.getByRole("button", { name: "Convert" })).toHaveClass(
      "border-primary",
      "bg-primary",
      "disabled:bg-paper",
    );
    expect(screen.queryByRole("button", { name: "Encode" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decode" })).not.toBeInTheDocument();
  });

  it("groups source, actions, and target as accessible workbench regions", () => {
    render(<CodecApp toolId="base64" />);
    const channels = screen.getByTestId("codec-workspace-channels");
    expect(channels).toHaveClass("workspace-grid");
    expect(screen.getByRole("group", { name: "Source" })).toHaveTextContent("Source");
    expect(screen.getByRole("group", { name: "Target" })).toHaveTextContent("Target");
    expect(screen.getByTestId("codec-workspace-actions")).toHaveAccessibleName("Conversion actions");
    for (const control of screen.getAllByRole("button")) {
      expect(control.className).toMatch(/(?:min-h-11|size-11|icon-button)/);
    }
  });

  it.each([
    ["base64", "Convert"],
    ["url", "Convert"],
    ["query", "Convert"],
    ["python", "Convert"],
    ["timestamp", "Convert"],
    ["jwt", "Decode"],
  ] as const)("loads the %s example with no conversion pending", (toolId, action) => {
    render(<CodecApp toolId={toolId} />);
    expect(screen.getByRole("button", { name: action })).toBeDisabled();
  });

  it("loads Timestamp navigation, content, formats, and defaults", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_784_496_902_987);
    render(<CodecApp toolId="timestamp" />);
    expect(screen.getAllByTestId("tool-link-timestamp")[0]).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Z Time and Unix Timestamp Converter");
    expect(screen.getByTestId("tool-description")).toHaveTextContent("UTC Z time");
    for (const option of ["Z time", "Unix seconds", "Unix milliseconds"]) {
      expect(screen.getAllByRole("option", { name: option })).toHaveLength(2);
    }
    expect(screen.getByTestId("timestamp-top-format")).toHaveValue("ztime");
    expect(screen.getByTestId("timestamp-bottom-format")).toHaveValue("timestamp-seconds");
    expect(screen.getByTestId("timestamp-input")).toHaveValue("2026-07-19T21:35:02Z");
    expect(screen.getByTestId("timestamp-output")).toHaveValue("1784496902");
    expect(screen.getByRole("button", { name: "Convert" })).toBeDisabled();
  });

  it("converts every Timestamp pairing and swaps channels", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_784_496_902_987);
    const user = userEvent.setup();
    render(<CodecApp toolId="timestamp" />);
    const input = screen.getByTestId("timestamp-input");
    const output = screen.getByTestId("timestamp-output");

    await user.selectOptions(screen.getByTestId("timestamp-bottom-format"), "timestamp-milliseconds");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(output).toHaveValue("1784496902000");

    await user.selectOptions(screen.getByTestId("timestamp-top-format"), "timestamp-seconds");
    await user.selectOptions(screen.getByTestId("timestamp-bottom-format"), "ztime");
    await user.clear(input);
    await user.type(input, "1769862896.7899");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(output).toHaveValue("2026-01-31T12:34:56.789Z");

    await user.selectOptions(screen.getByTestId("timestamp-bottom-format"), "timestamp-milliseconds");
    await user.clear(input);
    await user.type(input, "1.5");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(output).toHaveValue("1500");

    await user.click(screen.getByTestId("codec-workspace-swap"));
    expect(input).toHaveValue("1500");
    expect(output).toHaveValue("1.5");
    expect(screen.getByTestId("timestamp-top-format")).toHaveValue("timestamp-milliseconds");
    expect(screen.getByTestId("timestamp-bottom-format")).toHaveValue("timestamp-seconds");
  });

  it("copies, clears, and reports accessible Timestamp errors", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="timestamp" />);
    const input = screen.getByTestId("timestamp-input");

    await user.click(screen.getByRole("button", { name: "Copy output" }));
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    await user.clear(input);
    await user.type(input, "2026-01-31T12:34:56+00:00");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid UTC Z time from 1970 through 9999.");
    expect(screen.getByTestId("timestamp-output")).toHaveValue("");

    await user.clear(input);
    await user.type(input, "1969-12-31T23:59:59.999Z");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid UTC Z time from 1970 through 9999.");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(input).toHaveValue("");
    expect(sessionStorage.length).toBe(0);
  });

  it("enables Convert after an input edit and disables it after successful conversion", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="base64" />);
    const convert = screen.getByRole("button", { name: "Convert" });
    await user.clear(screen.getByTestId("base64-input"));
    await user.type(screen.getByTestId("base64-input"), "fresh");
    expect(convert).toBeEnabled();
    await user.click(convert);
    expect(screen.getByTestId("base64-output")).toHaveValue("ZnJlc2g=");
    expect(convert).toBeDisabled();
  });

  it("settles an invalid conversion until input changes again", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="base64" />);
    const input = screen.getByTestId("base64-input");
    const convert = screen.getByRole("button", { name: "Convert" });
    await user.selectOptions(screen.getByTestId("base64-top-format"), "base64");
    await user.clear(input);
    await user.type(input, "***");
    expect(convert).toBeEnabled();
    await user.click(convert);
    expect(screen.getByRole("alert")).toHaveTextContent("Enter valid Base64.");
    expect(screen.getByTestId("base64-output")).toHaveValue("");
    expect(convert).toBeDisabled();
    await user.type(input, "A");
    expect(convert).toBeEnabled();
  });

  it("enables Convert after either format changes without converting values", async () => {
    const user = userEvent.setup();
    const topChange = render(<CodecApp toolId="base64" />);
    await user.selectOptions(screen.getByTestId("base64-top-format"), "base64url");
    expect(screen.getByTestId("base64-input")).toHaveValue("Hello, world!");
    expect(screen.getByTestId("base64-output")).toHaveValue("SGVsbG8sIHdvcmxkIQ==");
    expect(screen.getByRole("button", { name: "Convert" })).toBeEnabled();

    topChange.unmount();
    render(<CodecApp toolId="base64" />);
    await user.selectOptions(screen.getByTestId("base64-bottom-format"), "base64url");
    expect(screen.getByTestId("base64-input")).toHaveValue("Hello, world!");
    expect(screen.getByTestId("base64-output")).toHaveValue("SGVsbG8sIHdvcmxkIQ==");
    expect(screen.getByRole("button", { name: "Convert" })).toBeEnabled();
  });

  it("keeps Convert settled when the selected format does not change", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="base64" />);
    await user.selectOptions(screen.getByTestId("base64-top-format"), "plain");
    await user.selectOptions(screen.getByTestId("base64-bottom-format"), "base64");
    expect(screen.getByRole("button", { name: "Convert" })).toBeDisabled();
  });

  it("settles swapped channels after a pending edit", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="base64" />);
    const convert = screen.getByRole("button", { name: "Convert" });
    await user.type(screen.getByTestId("base64-input"), " changed");
    expect(convert).toBeEnabled();
    await user.click(screen.getByTestId("codec-workspace-swap"));
    expect(screen.getByTestId("base64-input")).toHaveValue("SGVsbG8sIHdvcmxkIQ==");
    expect(screen.getByTestId("base64-output")).toHaveValue("Hello, world! changed");
    expect(screen.getByTestId("base64-top-format")).toHaveValue("base64");
    expect(screen.getByTestId("base64-bottom-format")).toHaveValue("plain");
    expect(convert).toBeDisabled();
  });

  it("settles cleared channels from settled and pending states", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="base64" />);
    const input = screen.getByTestId("base64-input");
    const output = screen.getByTestId("base64-output");
    const convert = screen.getByRole("button", { name: "Convert" });
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(input).toHaveValue("");
    expect(output).toHaveValue("");
    expect(convert).toBeDisabled();
    await user.type(input, "pending");
    expect(convert).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(input).toHaveValue("");
    expect(output).toHaveValue("");
    expect(convert).toBeDisabled();
  });

  it("preserves conversion freshness after clipboard success and failure", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="base64" />);
    const input = screen.getByTestId("base64-input");
    const convert = screen.getByRole("button", { name: "Convert" });
    const copy = screen.getByRole("button", { name: "Copy output" });
    await user.click(copy);
    expect(convert).toBeDisabled();
    await user.type(input, " pending");
    await user.click(copy);
    expect(convert).toBeEnabled();

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    await user.click(copy);
    expect(screen.getByRole("alert")).toHaveTextContent("Clipboard unavailable. Select output and copy manually.");
    expect(convert).toBeEnabled();
  });

  it("renders Base64 and URL descriptions as explanatory bullet lists", () => {
    const base64 = render(<CodecApp toolId="base64" />);
    expect(screen.getByText("Convert plain text, Base64, or Base64url:")).toBeInTheDocument();
    expect(
      within(screen.getByRole("list"))
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Base64: uses +, /, and = padding", "Base64url: uses - and _ without padding."]);
    base64.unmount();

    render(<CodecApp toolId="url" />);
    expect(screen.getByText("Encode or decode URL values:")).toBeInTheDocument();
    expect(
      within(screen.getByRole("list"))
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      "RFC 3986 components: encode reserved characters",
      "Full URI: preserves URI structure",
      "Form URL encoded: uses + for spaces",
    ]);
  });

  it("changes either Base64 format without changing values or converting", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="base64" />);
    const input = screen.getByTestId("base64-input");
    const output = screen.getByTestId("base64-output");
    await user.click(screen.getByRole("button", { name: "Copy output" }));
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    await user.selectOptions(screen.getByTestId("base64-top-format"), "base64url");
    expect(screen.getByTestId("base64-top-format")).toHaveValue("base64url");
    expect(screen.getByTestId("base64-bottom-format")).toHaveValue("plain");
    expect(input).toHaveValue("Hello, world!");
    expect(output).toHaveValue("SGVsbG8sIHdvcmxkIQ==");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByTestId("base64-bottom-format"), "base64");
    expect(screen.getByTestId("base64-top-format")).toHaveValue("plain");
    expect(screen.getByTestId("base64-bottom-format")).toHaveValue("base64");
    expect(input).toHaveValue("Hello, world!");
    expect(output).toHaveValue("SGVsbG8sIHdvcmxkIQ==");
  });

  it("swaps Base64 values and formats without converting", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="base64" />);
    const swapButton = screen.getByTestId("codec-workspace-swap");
    expect(swapButton).toHaveClass("bg-primary");
    await user.click(swapButton);
    expect(screen.getByTestId("base64-input")).toHaveValue("SGVsbG8sIHdvcmxkIQ==");
    expect(screen.getByTestId("base64-output")).toHaveValue("Hello, world!");
    expect(screen.getByTestId("base64-top-format")).toHaveValue("base64");
    expect(screen.getByTestId("base64-bottom-format")).toHaveValue("plain");
  });

  it("converts Base64 in selected direction, reports errors, copies, and clears", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="base64" />);
    const input = screen.getByTestId("base64-input");
    await user.clear(input);
    await user.type(input, "café 🎵");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByTestId("base64-output")).toHaveValue("Y2Fmw6kg8J+OtQ==");
    await user.click(screen.getByRole("button", { name: "Copy output" }));
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    const channels = screen.getByTestId("codec-workspace-channels");
    const actions = screen.getByTestId("codec-workspace-actions");
    const swapButton = screen.getByTestId("codec-workspace-swap");
    const copyButton = screen.getByRole("button", { name: "Copy output" });
    expect(channels.children[1]).toBe(actions);
    expect([...actions.children]).toEqual([
      swapButton,
      screen.getByRole("button", { name: "Convert" }),
      screen.getByRole("button", { name: "Clear" }),
    ]);
    expect(copyButton).toHaveAttribute("data-testid", "codec-workspace-copy");
    expect(copyButton).toHaveClass("absolute", "top-3", "right-3");
    expect(screen.getByTestId("base64-output")).toHaveClass("pr-16");
    expect(screen.getByTestId("base64-input")).not.toHaveClass("pr-16");
    expect(copyButton).not.toHaveClass("icon-button", "bg-panel");
    expect(screen.getByTestId("base64-bottom-channel")).toContainElement(copyButton);
    expect(copyButton.querySelector(".lucide-copy")).toBeInTheDocument();
    expect(swapButton).toHaveAccessibleName("Swap");
    await user.click(swapButton);
    expect(screen.getByTestId("base64-top-format")).toHaveValue("base64");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByTestId("base64-output")).toHaveValue("café 🎵");
    await user.clear(input);
    await user.type(input, "***");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter valid Base64.");
    expect(screen.getByTestId("base64-output")).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(input).toHaveValue("");
    expect(screen.getByTestId("base64-output")).toHaveValue("");
    expect(screen.getByTestId("base64-top-format")).toHaveValue("base64");
    expect(sessionStorage.getItem("codec-bench:base64:v1")).toBeNull();
  });

  it("resets Base64 state after remount without writing session storage", async () => {
    const user = userEvent.setup();
    const first = render(<CodecApp toolId="base64" />);
    await user.clear(screen.getByTestId("base64-input"));
    await user.type(screen.getByTestId("base64-input"), "ÿÿ");
    await user.selectOptions(screen.getByTestId("base64-bottom-format"), "base64url");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByTestId("base64-output")).toHaveValue("w7_Dvw");
    await user.selectOptions(screen.getByTestId("base64-top-format"), "base64url");
    first.unmount();
    render(<CodecApp toolId="base64" />);
    expect(screen.getByTestId("base64-input")).toHaveValue("Hello, world!");
    expect(screen.getByTestId("base64-output")).toHaveValue("SGVsbG8sIHdvcmxkIQ==");
    expect(screen.getByTestId("base64-top-format")).toHaveValue("plain");
    expect(screen.getByTestId("base64-bottom-format")).toHaveValue("base64");
    expect(screen.getByRole("button", { name: "Convert" })).toBeDisabled();
    expect(sessionStorage.length).toBe(0);
  });

  it("rejects legacy Base64 workspace state without direction", () => {
    sessionStorage.setItem(
      "codec-bench:base64:v1",
      JSON.stringify({ version: 1, state: { input: "legacy", output: "bGVnYWN5", control: "standard" } }),
    );
    render(<CodecApp toolId="base64" />);
    expect(screen.getByTestId("base64-input")).toHaveValue("Hello, world!");
    expect(screen.getByTestId("base64-output")).toHaveValue("SGVsbG8sIHdvcmxkIQ==");
  });

  it("resets URL state after remount", async () => {
    const user = userEvent.setup();
    const first = render(<CodecApp toolId="url" />);
    await user.selectOptions(screen.getByTestId("url-top-format"), "rfc3986");
    await user.clear(screen.getByTestId("url-input"));
    await user.type(screen.getByTestId("url-input"), "hello%20Ada");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    first.unmount();
    render(<CodecApp toolId="url" />);
    expect(screen.getByTestId("url-input")).toHaveValue("https://example.com/search?q=hello world~");
    expect(screen.getByTestId("url-output")).toHaveValue("https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world~");
    expect(screen.getByTestId("url-top-format")).toHaveValue("decoded");
    expect(screen.getByTestId("url-bottom-format")).toHaveValue("rfc3986");
  });

  it("rejects legacy URL and DATA workspace state", () => {
    sessionStorage.setItem(
      "codec-bench:url:v1",
      JSON.stringify({ version: 1, state: { input: "legacy", output: "legacy" } }),
    );
    const url = render(<CodecApp toolId="url" />);
    expect(screen.getByTestId("url-input")).toHaveValue("https://example.com/search?q=hello world~");
    expect(screen.getByTestId("url-output")).toHaveValue("https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world~");
    url.unmount();

    sessionStorage.setItem(
      "codec-bench:query:v1",
      JSON.stringify({ version: 1, state: { input: "?saved=yes", output: "saved", mode: "parse" } }),
    );
    const query = render(<CodecApp toolId="query" />);
    expect(screen.getByTestId("query-input")).toHaveValue("?name=Ada&active=true");
    expect(screen.getByTestId("query-output")).toHaveValue('{\n  "name": "Ada",\n  "active": "true"\n}');
    query.unmount();

    sessionStorage.setItem(
      "codec-bench:python:v1",
      JSON.stringify({ version: 1, state: { input: "{'saved': True}", output: '{"saved":true}' } }),
    );
    render(<CodecApp toolId="python" />);
    expect(screen.getByTestId("python-input")).toHaveValue("{'name': 'Ada', 'active': True}");
    expect(screen.getByTestId("python-output")).toHaveValue('{\n  "name": "Ada",\n  "active": true\n}');
  });

  it("runs URL tool by route identity", async () => {
    render(<CodecApp toolId="url" />);
    expect(screen.getByTestId("url-top-format")).toHaveValue("decoded");
    expect(screen.getByTestId("url-bottom-format")).toHaveValue("rfc3986");
    expect(screen.getByTestId("url-top-format")).toHaveAccessibleName("Top channel format");
    expect(screen.getByTestId("url-bottom-format")).toHaveAccessibleName("Bottom channel format");
    for (const option of ["Plain text", "RFC 3986 component", "Full URI", "Form URL encoded"]) {
      expect(screen.getAllByRole("option", { name: option })).toHaveLength(2);
    }
    expect(screen.getByTestId("url-input")).toHaveValue("https://example.com/search?q=hello world~");
    expect(screen.getByTestId("url-output")).toHaveValue("https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world~");
    expect(screen.getByTestId("url-input")).toBeEnabled();
    expect(screen.getByTestId("url-output")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Copy output" })).toBeEnabled();
  });

  it("changes URL modes without changing values or converting", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="url" />);
    const input = screen.getByTestId("url-input");
    const output = screen.getByTestId("url-output");
    await user.click(screen.getByRole("button", { name: "Copy output" }));
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    await user.selectOptions(screen.getByTestId("url-bottom-format"), "form");
    expect(screen.getByTestId("url-top-format")).toHaveValue("decoded");
    expect(screen.getByTestId("url-bottom-format")).toHaveValue("form");
    expect(input).toHaveValue("https://example.com/search?q=hello world~");
    expect(output).toHaveValue("https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world~");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByTestId("url-top-format"), "uri");
    expect(screen.getByTestId("url-top-format")).toHaveValue("uri");
    expect(screen.getByTestId("url-bottom-format")).toHaveValue("decoded");
    expect(input).toHaveValue("https://example.com/search?q=hello world~");
    expect(output).toHaveValue("https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world~");
  });

  it.each([
    ["rfc3986", "https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world~"],
    ["uri", "https://example.com/search?q=hello%20world~"],
    ["form", "https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello+world%7E"],
  ])("shows how URL mode %s changes the default example", async (format, encoded) => {
    const user = userEvent.setup();
    render(<CodecApp toolId="url" />);
    await user.selectOptions(screen.getByTestId("url-bottom-format"), format);
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByTestId("url-output")).toHaveValue(encoded);
  });

  it.each([
    ["rfc3986", "a+b / c~d!", "a%2Bb%20%2F%20c~d%21"],
    ["uri", "https://example.test/a path?q=café#part 1", "https://example.test/a%20path?q=caf%C3%A9#part%201"],
    ["form", "a+b / c~d", "a%2Bb+%2F+c%7Ed"],
  ])("encodes and decodes URL mode %s", async (format, plain, encoded) => {
    const user = userEvent.setup();
    render(<CodecApp toolId="url" />);
    await user.selectOptions(screen.getByTestId("url-bottom-format"), format);
    await user.clear(screen.getByTestId("url-input"));
    await user.type(screen.getByTestId("url-input"), plain);
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByTestId("url-output")).toHaveValue(encoded);
    await user.click(screen.getByTestId("codec-workspace-swap"));
    expect(screen.getByTestId("url-top-format")).toHaveValue(format);
    expect(screen.getByTestId("url-bottom-format")).toHaveValue("decoded");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByTestId("url-output")).toHaveValue(plain);
  });

  it("uses explicit form plus decoding and preserves invalid-input state", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="url" />);
    await user.selectOptions(screen.getByTestId("url-top-format"), "form");
    await user.clear(screen.getByTestId("url-input"));
    await user.type(screen.getByTestId("url-input"), "a+b%2Bc");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByTestId("url-output")).toHaveValue("a b+c");
    await user.clear(screen.getByTestId("url-input"));
    await user.type(screen.getByTestId("url-input"), "%ZZ");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter valid percent-encoded text.");
    expect(screen.getByTestId("url-output")).toHaveValue("");
    expect(screen.getByTestId("url-input")).toHaveValue("%ZZ");
    expect(screen.getByTestId("url-top-format")).toHaveValue("form");
    expect(screen.getByTestId("url-bottom-format")).toHaveValue("decoded");
    expect(screen.getByRole("button", { name: "Copy output" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByTestId("url-input")).toHaveValue("");
    expect(screen.getByTestId("url-output")).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("loads Query defaults with complementary formats and no example controls", () => {
    render(<CodecApp toolId="query" />);
    expect(screen.getByTestId("query-top-format")).toHaveValue("query");
    expect(screen.getByTestId("query-bottom-format")).toHaveValue("json");
    expect(screen.getByTestId("query-top-format")).toHaveAccessibleName("Top channel format");
    expect(screen.getByTestId("query-bottom-format")).toHaveAccessibleName("Bottom channel format");
    expect(screen.getAllByRole("option", { name: "Query string" })).toHaveLength(2);
    expect(screen.getAllByRole("option", { name: "JSON" })).toHaveLength(2);
    expect(screen.getByTestId("query-input")).toHaveValue("?name=Ada&active=true");
    expect(screen.getByTestId("query-output")).toHaveValue('{\n  "name": "Ada",\n  "active": "true"\n}');
    expect(screen.getByTestId("query-input")).toBeEnabled();
    expect(screen.getByTestId("query-output")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Convert" })).toBeInTheDocument();
    expect(screen.queryByText("Example:")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Try .* example/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("loads Python defaults with complementary formats and no example controls", () => {
    render(<CodecApp toolId="python" />);
    expect(screen.getByTestId("python-top-format")).toHaveValue("python");
    expect(screen.getByTestId("python-bottom-format")).toHaveValue("json");
    expect(screen.getByTestId("python-top-format")).toHaveAccessibleName("Top channel format");
    expect(screen.getByTestId("python-bottom-format")).toHaveAccessibleName("Bottom channel format");
    expect(screen.getAllByRole("option", { name: "Python literal" })).toHaveLength(2);
    expect(screen.getAllByRole("option", { name: "JSON" })).toHaveLength(2);
    expect(screen.getByTestId("python-input")).toHaveValue("{'name': 'Ada', 'active': True}");
    expect(screen.getByTestId("python-output")).toHaveValue('{\n  "name": "Ada",\n  "active": true\n}');
    expect(screen.getByTestId("python-input")).toBeEnabled();
    expect(screen.getByTestId("python-output")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Convert" })).toBeInTheDocument();
    expect(screen.queryByText("Example:")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Try .* example/ })).not.toBeInTheDocument();
  });

  it("changes either Query format without changing values or converting", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="query" />);
    const input = screen.getByTestId("query-input");
    const output = screen.getByTestId("query-output");
    await user.click(screen.getByRole("button", { name: "Copy output" }));
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    await user.selectOptions(screen.getByTestId("query-top-format"), "json");
    expect(screen.getByTestId("query-bottom-format")).toHaveValue("query");
    expect(input).toHaveValue("?name=Ada&active=true");
    expect(output).toHaveValue('{\n  "name": "Ada",\n  "active": "true"\n}');
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByTestId("query-bottom-format"), "json");
    expect(screen.getByTestId("query-top-format")).toHaveValue("query");
    expect(input).toHaveValue("?name=Ada&active=true");
    expect(output).toHaveValue('{\n  "name": "Ada",\n  "active": "true"\n}');
  });

  it("swaps Query values and formats without converting", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="query" />);
    await user.click(screen.getByTestId("codec-workspace-swap"));
    expect(screen.getByTestId("query-input")).toHaveValue('{\n  "name": "Ada",\n  "active": "true"\n}');
    expect(screen.getByTestId("query-output")).toHaveValue("?name=Ada&active=true");
    expect(screen.getByTestId("query-top-format")).toHaveValue("json");
    expect(screen.getByTestId("query-bottom-format")).toHaveValue("query");
  });

  it("converts Query in either direction and reports errors", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="query" />);
    const input = screen.getByTestId("query-input");
    await user.clear(input);
    await user.type(input, "?a=1&a=2");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByTestId("query-output")).toHaveValue('{\n  "a": [\n    "1",\n    "2"\n  ]\n}');
    await user.selectOptions(screen.getByTestId("query-top-format"), "json");
    await user.clear(input);
    await user.click(input);
    await user.paste('{"message":"hello world"}');
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByTestId("query-output")).toHaveValue("message=hello+world");
    await user.clear(input);
    await user.click(input);
    await user.paste("[]");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByRole("alert")).toHaveTextContent("JSON must be an object.");
    expect(screen.getByTestId("query-output")).toHaveValue("");
  });

  it("converts Python in either direction and reports invalid JSON", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="python" />);
    const input = screen.getByTestId("python-input");
    await user.clear(input);
    await user.click(input);
    await user.paste("{'active': True}");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByTestId("python-output")).toHaveValue('{\n  "active": true\n}');
    await user.selectOptions(screen.getByTestId("python-top-format"), "json");
    await user.clear(input);
    await user.click(input);
    await user.paste('{"items":[true,null]}');
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByTestId("python-output")).toHaveValue("{'items': [True, None]}");
    await user.clear(input);
    await user.type(input, "nope");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter valid JSON.");
    expect(screen.getByTestId("python-output")).toHaveValue("");
  });

  it("resets cleared DATA state after remount", async () => {
    const user = userEvent.setup();
    const first = render(<CodecApp toolId="query" />);
    await user.selectOptions(screen.getByTestId("query-top-format"), "json");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(sessionStorage.length).toBe(0);
    first.unmount();
    render(<CodecApp toolId="query" />);
    expect(screen.getByTestId("query-input")).toHaveValue("?name=Ada&active=true");
    expect(screen.getByTestId("query-output")).toHaveValue('{\n  "name": "Ada",\n  "active": "true"\n}');
    expect(screen.getByTestId("query-top-format")).toHaveValue("query");
  });

  it("keeps DATA copy safe when clipboard is unavailable", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    render(<CodecApp toolId="query" />);
    await user.click(screen.getByRole("button", { name: "Copy output" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Clipboard unavailable. Select output and copy manually.");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("button", { name: "Copy output" })).toBeDisabled();
  });

  it("toggles theme with explicit localStorage override", async () => {
    const user = userEvent.setup();
    const local = vi.spyOn(Storage.prototype, "setItem");
    render(<CodecApp toolId="base64" />);
    await user.click(screen.getAllByRole("button", { name: "Use dark theme" })[0]!);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(local).toHaveBeenCalledWith("codec-bench-theme", "dark");
    local.mockRestore();
  });

  it("keeps output actions safe for empty state and clipboard denial", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<CodecApp toolId="base64" />);
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("button", { name: "Copy output" })).toBeDisabled();
    await user.type(screen.getByTestId("base64-input"), "ok");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    await user.click(screen.getByRole("button", { name: "Copy output" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Clipboard unavailable. Select output and copy manually.");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(sessionStorage.getItem("codec-bench:base64:v1")).toBeNull();
  });

  it("uses semantic status tones and contrast-safe disabled controls", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="base64" />);
    const convert = screen.getByRole("button", { name: "Convert" });
    expect(convert).toHaveClass("disabled:bg-paper", "disabled:text-muted");
    expect(convert).not.toHaveClass("disabled:opacity-40");
    await user.click(screen.getByRole("button", { name: "Copy output" }));
    expect(screen.getByRole("status")).toHaveClass("text-success");
  });

  it("loads JWT navigation, header, warning, and decoded synthetic fixture", () => {
    render(<CodecApp toolId="jwt" />);
    expect(screen.getAllByTestId("tool-link-jwt")[0]).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("JWT Decoder");
    expect(screen.getByTestId("jwt-tool")).toBeInTheDocument();
    expect(screen.getByTestId("jwt-input")).toHaveValue(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImFkbWluIjp0cnVlfQ.c3ludGhldGljLXNpZ25hdHVyZQ",
    );
    expect(screen.getByTestId("jwt-header-output")).toHaveValue('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
    expect(screen.getByTestId("jwt-payload-output")).toHaveValue(
      '{\n  "sub": "1234567890",\n  "name": "Ada Lovelace",\n  "admin": true\n}',
    );
    expect(screen.getByTestId("jwt-signature-output")).toHaveValue("c3ludGhldGljLXNpZ25hdHVyZQ");
    expect(screen.getByTestId("jwt-warning")).toHaveTextContent("Decoded only. Signature not verified.");
    expect(screen.queryByText("Token is valid")).not.toBeInTheDocument();
    expect(screen.queryByText("Signature verified")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decode" })).toBeDisabled();
  });

  it("decodes edits, settles attempts, clears stale output, status, and all state", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="jwt" />);
    const input = screen.getByTestId("jwt-input");
    const decode = screen.getByRole("button", { name: "Decode" });
    await user.clear(input);
    await user.paste("eyJhbGciOiJub25lIn0.eyJzdWIiOiJuZXcifQ.");
    expect(decode).toBeEnabled();
    await user.click(decode);
    expect(screen.getByTestId("jwt-header-output")).toHaveValue('{\n  "alg": "none"\n}');
    expect(screen.getByTestId("jwt-payload-output")).toHaveValue('{\n  "sub": "new"\n}');
    expect(screen.getByTestId("jwt-signature-output")).toHaveValue("");
    expect(decode).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Copy Header" }));
    expect(screen.getByRole("status")).toHaveTextContent("Header copied.");
    await user.clear(input);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await user.type(input, "bad");
    await user.click(decode);
    expect(screen.getByRole("alert")).toHaveTextContent("JWT must contain three segments.");
    expect(screen.getByTestId("jwt-header-output")).toHaveValue("");
    expect(screen.getByTestId("jwt-payload-output")).toHaveValue("");
    expect(screen.getByTestId("jwt-signature-output")).toHaveValue("");
    expect(decode).toBeDisabled();
    await user.type(input, "x");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(input).toHaveValue("");
    expect(decode).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it.each([
    ["Header", "jwt-header-output", '{\n  "alg": "HS256",\n  "typ": "JWT"\n}'],
    ["Payload", "jwt-payload-output", '{\n  "sub": "1234567890",\n  "name": "Ada Lovelace",\n  "admin": true\n}'],
    ["Signature", "jwt-signature-output", "c3ludGhldGljLXNpZ25hdHVyZQ"],
  ])("copies only %s output", async (label, testId, value) => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<CodecApp toolId="jwt" />);
    await user.click(screen.getByRole("button", { name: `Copy ${label}` }));
    expect(writeText).toHaveBeenCalledWith(value);
    expect(screen.getByRole("status")).toHaveTextContent(`${label} copied.`);
    expect(screen.getByTestId(testId)).toHaveAttribute("readonly");
    expect(screen.getByTestId(testId)).toBeEnabled();
  });

  it("reports JWT clipboard rejection and preserves decoded output", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    render(<CodecApp toolId="jwt" />);
    await user.click(screen.getByRole("button", { name: "Copy Header" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Copy failed.");
    expect(screen.getByTestId("jwt-header-output")).not.toHaveValue("");
  });

  it("labels selectable JWT fields and output groups with descriptive test IDs", () => {
    render(<CodecApp toolId="jwt" />);
    expect(screen.getByLabelText("JWT token")).toHaveAttribute("data-testid", "jwt-input");
    for (const label of ["Header", "Payload", "Signature"]) {
      expect(screen.getByTestId(`jwt-${label.toLowerCase()}-group`)).toBeInTheDocument();
      expect(screen.getByLabelText(`${label} output`)).toHaveAttribute("readonly");
      expect(screen.getByRole("button", { name: `Copy ${label}` })).toHaveAttribute(
        "data-testid",
        `jwt-copy-${label.toLowerCase()}`,
      );
    }
    expect(screen.getByTestId("jwt-actions")).toBeInTheDocument();
    expect(screen.getByTestId("jwt-guidance")).toBeInTheDocument();
  });
});
