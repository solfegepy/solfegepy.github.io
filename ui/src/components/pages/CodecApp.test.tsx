import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WebMcpTool } from "../../lib/webmcp";
import { CodecApp } from "./CodecApp";

function installModelContext(registerTool = vi.fn()): typeof registerTool {
  Object.defineProperty(document, "modelContext", { configurable: true, value: { registerTool } });
  return registerTool;
}

beforeEach(() => {
  Reflect.deleteProperty(document, "modelContext");
  sessionStorage.clear();
  localStorage.clear();
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({ matches: false })) });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

afterEach(() => {
  Reflect.deleteProperty(document, "modelContext");
  vi.restoreAllMocks();
});

const FAQ_SECTIONS = [
  {
    heading: "Base64",
    route: "/",
    link: "Open Base64 encoder and decoder",
    questions: [
      "How do I encode text to Base64?",
      "How do I decode Base64 to text?",
      "Is Base64 encryption?",
      "What is the difference between Base64 and Base64url?",
      "Why does Base64 end with =?",
    ],
  },
  {
    heading: "URL encoding",
    route: "/url",
    link: "Open URL encoder and decoder",
    questions: [
      "What is URL encoding or percent-encoding?",
      "How do I URL-encode a string?",
      "Should a URL space be %20 or +?",
      "What is the difference between encodeURI and encodeURIComponent?",
      "Why does URL decoding fail?",
    ],
  },
  {
    heading: "Query parameters",
    route: "/query",
    link: "Open query parameter parser and builder",
    questions: [
      "How do I parse URL query parameters into JSON?",
      "How do I convert JSON into a URL query string?",
      "How are duplicate query parameters converted to JSON?",
      "Does a query string need a leading question mark?",
      "How are spaces and plus signs handled in query parameters?",
    ],
  },
  {
    heading: "JWT",
    route: "/jwt",
    link: "Open JWT decoder",
    questions: [
      "Can I decode a JWT without a secret key?",
      "Does decoding a JWT verify its signature?",
      "What are the three parts of a JWT?",
      "Can an expired JWT still be decoded?",
      "Is a JWT encrypted?",
    ],
  },
  {
    heading: "Python and JSON",
    route: "/python-json",
    link: "Open Python literal to JSON converter",
    questions: [
      "How do I convert a Python dictionary to JSON?",
      "Why is a Python dictionary not valid JSON?",
      "How do Python True, False, and None convert to JSON?",
      "Can nested Python dictionaries and lists convert to JSON?",
      "Does the Python-to-JSON converter execute Python code?",
    ],
  },
  {
    heading: "Unix timestamps and Z time",
    route: "/timestamp",
    link: "Open Unix timestamp and Z time converter",
    questions: [
      "How do I convert a Unix timestamp to a UTC date?",
      "Is a Unix timestamp in seconds or milliseconds?",
      "What is the Unix epoch?",
      "What does Z mean in a date and time?",
      "Why is my Unix timestamp invalid?",
    ],
  },
] as const;

const APPROVED_ANSWER_TEXT = [
  "Enter UTF-8 text in the Base64 tool, choose Plain text as the source and Base64 encoded as the target, then select Convert. For example, Hello becomes SGVsbG8=.",
  "Paste Base64, choose Base64 encoded as the source and Plain text as the target, then select Convert. The decoded bytes must be valid UTF-8 text; binary files are outside this tool's scope.",
  "No. Base64 changes bytes into a text-safe representation and adds no confidentiality. Anyone with a Base64 decoder can recover the original data, so never treat encoding as secret protection.",
  "Standard Base64 uses + and / and commonly uses = padding. Base64url uses - and _ so values fit URLs and file names more safely, and it commonly omits padding.",
  "One or two = characters pad the final Base64 group when input length does not divide evenly into three-byte blocks. Padding carries no secret data; whether it may be omitted depends on the format using Base64.",
  "Percent-encoding represents characters as % followed by hexadecimal byte values, such as a space written as %20. It lets text travel safely in URL components while preserving URL syntax.",
  "Use RFC 3986 component mode for one path, query, or fragment value. Use Full URI only for a complete URI whose structural characters, such as :, /, ?, and #, must remain intact.",
  "Use %20 in ordinary URL percent-encoding. + represents a space in form URL encoding; a literal plus in that format must be %2B.",
  "encodeURI preserves delimiters belonging to a complete URI. encodeURIComponent encodes delimiters inside one value; Codec Bench's Full URI and RFC 3986 component modes provide those respective behaviors.",
  "Common causes include incomplete % escapes, non-hex escape characters, invalid UTF-8, or choosing form decoding for a value that uses a different convention. Confirm whether input is a full URI, component, or form value.",
  "Paste a full URL, a query beginning with ?, or the query text alone. Choose Query string as the source and JSON as the target, then select Convert.",
  "Use a JSON object whose values are strings or arrays of strings, choose JSON as the source, and convert. The result omits the leading ?, ready to append after one.",
  'Repeated names become arrays in encounter order. For example, tag=one&tag=two becomes { "tag": ["one", "two"] }.',
  "No. Codec Bench accepts name=Ada, ?name=Ada, or a full URL. Built query output intentionally excludes the leading question mark.",
  "Query parsing follows form-style URL rules: + decodes to a space and %2B decodes to a literal plus. Building a query writes spaces as + and literal plus signs as %2B.",
  "Yes, when it is a signed three-part JWT with readable Base64url header and payload. A key is required to verify its signature, not to inspect those encoded fields.",
  "No. Codec Bench displays header, payload, and encoded signature only. Never use decoded claims for authentication or authorization until trusted server-side code verifies signature, issuer, audience, expiry, and other required claims.",
  "A compact signed JWT contains a JOSE header, claims payload, and signature separated by periods. The first two parts are Base64url-encoded JSON objects.",
  "Yes. Expiry does not prevent Base64url decoding, and this decoder does not evaluate the exp claim. A decoded expired token remains expired and must not be accepted.",
  "A typical three-part signed JWT is encoded and readable, not encrypted. Encrypted JWE tokens use a different structure and are not supported by this decoder.",
  "Paste a supported Python literal, choose Python literal as the source and JSON as the target, then select Convert. String keys, nested dictionaries, lists, tuples, finite numbers, booleans, and None are supported.",
  "Python and JSON use similar containers but different literal syntax. JSON requires double-quoted object keys and strings, and uses true, false, and null instead of Python's True, False, and None.",
  "They become JSON true, false, and null. Converting back restores True, False, and None.",
  "Yes. Supported dictionaries, lists, and tuples can nest; tuples become JSON arrays. Sets, bytes, object constructors, and executable expressions are not supported.",
  "No. It parses a limited literal grammar in the browser and does not call Python or eval. Function calls, imports, comprehensions, and other executable expressions are rejected.",
  "Choose Unix seconds or Unix milliseconds as the source and Z time as the target, enter the value, then select Convert. Output uses UTC ISO 8601, such as 2026-07-21T12:00:00.000Z.",
  "Traditional Unix time uses seconds; browsers and many APIs use milliseconds. Around current dates seconds commonly have 10 digits and milliseconds 13, but Codec Bench requires explicit format selection instead of guessing.",
  "The Unix epoch is 1970-01-01T00:00:00Z. Unix timestamps count elapsed seconds or, in some systems, milliseconds from that UTC instant while ignoring leap seconds.",
  "A trailing Z identifies zero-offset UTC, sometimes called Zulu time. Codec Bench accepts strict UTC ISO 8601 Z time and does not convert local time-zone names or offsets.",
  "Check seconds vs milliseconds, remove signs or non-numeric text, and use a non-negative value within years 1970–9999. Decimal input is accepted, but precision below one millisecond is truncated and Unix output is an integer.",
] as const;

describe("CodecApp", () => {
  it("renders the complete static FAQ contract without a converter or WebMCP registration", async () => {
    const registerTool = installModelContext();
    const user = userEvent.setup();
    render(<CodecApp page="faq" />);

    expect(screen.getByRole("heading", { level: 1, name: "Encoding and Conversion FAQ" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(
      FAQ_SECTIONS.map(({ heading }) => heading),
    );
    const questions = screen.getAllByRole("heading", { level: 3 });
    expect(questions.map((heading) => heading.textContent)).toEqual(FAQ_SECTIONS.flatMap(({ questions }) => questions));
    expect(new Set(questions.map((heading) => heading.textContent)).size).toBe(30);
    expect(screen.getAllByTestId("faq-item")).toHaveLength(30);
    expect(screen.getAllByTestId("faq-summary")).toHaveLength(30);
    expect(screen.getAllByTestId("faq-accordion")).toHaveLength(6);
    for (const accordion of screen.getAllByTestId("faq-accordion")) {
      const items = within(accordion).getAllByTestId("faq-item");
      expect(items).toHaveLength(5);
      expect(new Set(items.map((item) => item.getAttribute("name"))).size).toBe(1);
      expect(items[0]).toHaveAttribute("name");
    }
    for (const summary of screen.getAllByTestId("faq-summary"))
      expect(summary.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    for (const answer of APPROVED_ANSWER_TEXT) expect(screen.getByTestId("faq-content")).toHaveTextContent(answer);
    for (const { route, link } of FAQ_SECTIONS)
      expect(screen.getByRole("link", { name: link })).toHaveAttribute("href", route);
    for (const item of screen.getAllByTestId("faq-item")) expect(item).not.toHaveAttribute("open");
    await user.click(screen.getAllByTestId("faq-summary")[0]!);
    expect(screen.getAllByTestId("faq-item")[0]).toHaveAttribute("open");
    expect(registerTool).not.toHaveBeenCalled();
    expect(screen.queryByTestId("codec-workspace")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /convert|decode/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it.each([
    ["base64", "Base64 Decode and Encode", "base64-workspace"],
    ["url", "URL Encode and Decode", "url-workspace"],
    ["query", "Query Parameter Parser and Builder", "query-workspace"],
    ["jwt", "JWT Decoder", "jwt-tool"],
    ["python", "Python Literal to JSON Converter", "python-workspace"],
    ["timestamp", "Z Time and Unix Timestamp Converter", "timestamp-workspace"],
  ] as const)("retains the %s tool identity", (toolId, heading, workspace) => {
    render(<CodecApp toolId={toolId} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(heading);
    expect(screen.getByTestId(workspace)).toBeInTheDocument();
  });

  it("registers isolated Base64 WebMCP execution without changing workspace state", async () => {
    const registerTool = installModelContext();
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    const view = render(<CodecApp toolId="base64" />);

    expect(registerTool).toHaveBeenCalledOnce();
    const [tool, options] = registerTool.mock.calls[0] as unknown as [WebMcpTool, { signal: AbortSignal }];
    expect(tool.name).toBe("decode_base64");
    const input = screen.getByTestId("base64-input");
    const output = screen.getByTestId("base64-output");
    const before = {
      input: (input as HTMLTextAreaElement).value,
      output: (output as HTMLTextAreaElement).value,
      top: (screen.getByTestId("base64-top-format") as HTMLSelectElement).value,
      bottom: (screen.getByTestId("base64-bottom-format") as HTMLSelectElement).value,
      storage: { ...localStorage, ...sessionStorage },
    };

    await expect(tool.execute({ value: "aGVsbG8=", variant: "standard" })).resolves.toEqual({
      ok: true,
      value: "hello",
      variant: "standard",
    });
    expect(input).toHaveValue(before.input);
    expect(output).toHaveValue(before.output);
    expect(screen.getByTestId("base64-top-format")).toHaveValue(before.top);
    expect(screen.getByTestId("base64-bottom-format")).toHaveValue(before.bottom);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect({ ...localStorage, ...sessionStorage }).toEqual(before.storage);
    expect(writeText).not.toHaveBeenCalled();

    await user.type(input, "x");
    view.rerender(<CodecApp toolId="base64" />);
    expect(registerTool).toHaveBeenCalledOnce();
    expect(options.signal.aborted).toBe(false);
    view.unmount();
    expect(options.signal.aborted).toBe(true);
  });

  it("registers isolated JWT WebMCP execution without changing visible output", async () => {
    const registerTool = installModelContext();
    const view = render(<CodecApp toolId="jwt" />);

    expect(registerTool).toHaveBeenCalledOnce();
    const [tool, options] = registerTool.mock.calls[0] as unknown as [WebMcpTool, { signal: AbortSignal }];
    expect(tool.name).toBe("decode_jwt");
    const token = screen.getByTestId("jwt-input");
    const header = screen.getByTestId("jwt-header-output");
    const payload = screen.getByTestId("jwt-payload-output");
    const signature = screen.getByTestId("jwt-signature-output");
    const before = [token, header, payload, signature].map((field) => (field as HTMLTextAreaElement).value);

    await expect(tool.execute({ value: "eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZ2VudCJ9." })).resolves.toEqual({
      ok: true,
      header: { alg: "none" },
      payload: { sub: "agent" },
      signature: "",
      signatureVerified: false,
    });
    expect([token, header, payload, signature].map((field) => (field as HTMLTextAreaElement).value)).toEqual(before);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);

    view.rerender(<CodecApp toolId="jwt" />);
    expect(registerTool).toHaveBeenCalledOnce();
    view.unmount();
    expect(options.signal.aborted).toBe(true);
  });

  it.each(["url", "query", "python", "timestamp"] as const)("registers no decoding tool for %s", (toolId) => {
    const registerTool = installModelContext();

    render(<CodecApp toolId={toolId} />);

    expect(registerTool).not.toHaveBeenCalled();
  });

  it("keeps human Base64 controls usable without WebMCP", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="base64" />);

    const input = screen.getByTestId("base64-input");
    await user.clear(input);
    await user.type(input, "human");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(screen.getByTestId("base64-output")).toHaveValue("aHVtYW4=");
  });

  it("keeps human JWT controls usable when registration rejects", async () => {
    installModelContext(vi.fn().mockRejectedValue(new Error("denied")));
    const user = userEvent.setup();
    render(<CodecApp toolId="jwt" />);
    await Promise.resolve();

    const input = screen.getByTestId("jwt-input");
    await user.clear(input);
    await user.type(input, "bad");
    await user.click(screen.getByRole("button", { name: "Decode" }));
    expect(screen.getByRole("alert")).toHaveTextContent("JWT must contain three segments.");
  });

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

  it("shows inactive Help/FAQ navigation on every tool identity", () => {
    for (const toolId of ["base64", "url", "query", "jwt", "python", "timestamp"] as const) {
      const view = render(<CodecApp toolId={toolId} />);
      const faqLink = screen.getByTestId("faq-link");
      expect(faqLink).toHaveAttribute("href", "/faq");
      expect(faqLink).not.toHaveAttribute("aria-current");
      expect(faqLink.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByTestId(`tool-link-${toolId}`)).toHaveAttribute("aria-current", "page");
      view.unmount();
    }
  });

  it("marks only Help/FAQ current on FAQ identity", () => {
    render(<CodecApp page="faq" />);
    expect(screen.getByTestId("faq-link")).toHaveAttribute("aria-current", "page");
    for (const toolId of ["base64", "url", "query", "jwt", "python", "timestamp"])
      expect(screen.getByTestId(`tool-link-${toolId}`)).not.toHaveAttribute("aria-current");
  });

  it("renders Help/FAQ in the mobile drawer and closes through the shared callback", async () => {
    const user = userEvent.setup();
    render(<CodecApp toolId="base64" />);
    await user.click(screen.getByTestId("menu-button"));
    const drawer = screen.getByTestId("mobile-drawer");
    const faqLink = within(drawer).getByTestId("faq-link");
    expect(faqLink).toHaveAttribute("href", "/faq");
    await user.click(faqLink);
    expect(screen.queryByTestId("mobile-drawer")).not.toBeInTheDocument();
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
