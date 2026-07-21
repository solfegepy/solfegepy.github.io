import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { getToolDescription, TOOLS } from "../lib/tools";

const TITLE = "Base64 Decode and Encode | Codec Bench";
const DESCRIPTION =
  "Convert plain text, Base64, or Base64url: Base64: uses +, /, and = padding Base64url: uses - and _ without padding.";
const URL = "https://codec64.com/";

function productionDocument(): Document {
  const html = readFileSync(resolve(import.meta.dirname, "../../../docs/index.html"), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function urlDocument(): Document {
  const html = readFileSync(resolve(import.meta.dirname, "../../../docs/url/index.html"), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function timestampDocument(): Document {
  const html = readFileSync(resolve(import.meta.dirname, "../../../docs/timestamp/index.html"), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function jwtDocument(): Document {
  const html = readFileSync(resolve(import.meta.dirname, "../../../docs/jwt/index.html"), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function faqDocument(): Document {
  const html = readFileSync(resolve(import.meta.dirname, "../../../docs/faq/index.html"), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function notFoundDocument(): Document {
  const html = readFileSync(resolve(import.meta.dirname, "../../../docs/404.html"), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

describe("production homepage SEO", () => {
  it("renders every registered route with unique metadata and one heading", () => {
    for (const tool of TOOLS) {
      const output = tool.route === "/" ? "index.html" : `${tool.route.slice(1)}/index.html`;
      const html = readFileSync(resolve(import.meta.dirname, `../../../docs/${output}`), "utf8");
      const document = new DOMParser().parseFromString(html, "text/html");
      expect(document.title).toBe(`${tool.title} | Codec Bench`);
      expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
        getToolDescription(tool),
      );
      expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
        `https://codec64.com${tool.route}`,
      );
      expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(
        `https://codec64.com${tool.route}`,
      );
      expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
      expect(document.querySelectorAll("h1")).toHaveLength(1);
      expect(document.querySelector("h1")?.textContent?.trim()).toBe(tool.title);
    }
  });
  it("renders metadata and useful content in static HTML", () => {
    const document = productionDocument();

    expect(document.title).toBe(TITLE);
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(DESCRIPTION);
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(URL);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1")?.textContent?.trim()).toBe("Base64 Decode and Encode");
    expect(document.body.textContent).toContain("How to use");
    expect(document.body.textContent).toContain("What is Base64?");
    expect(document.body.textContent).not.toContain("Base64 FAQ");
    expect(document.querySelector("noscript")?.textContent).toContain("Enable JavaScript");
    expect(document.body.textContent).not.toMatch(/select (?:Encode|Decode)|Select Encode or Decode/);
    expect(document.body.textContent).toContain("Select channel formats, then convert and copy result.");
    expect(document.querySelector('[data-testid="base64-guidance"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="base64-how-to"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="base64-about"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="base64-faq"]')).toBeNull();
  });

  it("renders one valid WebApplication JSON-LD object", () => {
    const document = productionDocument();
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);

    const schema: unknown = JSON.parse(scripts[0]?.textContent ?? "");
    expect(schema).toEqual({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Codec Bench Base64 Encoder and Decoder",
      url: URL,
      description: DESCRIPTION,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    });
  });

  it("renders URL mode guidance and metadata in static HTML", () => {
    const document = urlDocument();
    const description =
      "Encode or decode URL values: RFC 3986 components: encode reserved characters Full URI: preserves URI structure Form URL encoded: uses + for spaces";

    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(description);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://codec64.com/url");
    expect(document.querySelector("h1")?.textContent?.trim()).toBe("URL Encode and Decode");
    expect(document.body.textContent).toContain("Choose URL encoding mode");
    expect(document.body.textContent).toContain("RFC 3986 component");
    expect(document.body.textContent).toContain("Full URI");
    expect(document.body.textContent).toContain("Form URL encoded");
    expect(document.body.textContent).toContain("a+b / c~d");
    expect(document.body.textContent).toContain("a%2Bb+%2F+c%7Ed");
    expect(document.body.textContent).toContain("Query Params");
    expect(document.body.textContent).not.toMatch(/local(?:ly)?|upload|input leaves|private browser/i);
    expect(document.querySelector('[data-testid="url-guidance"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="url-how-to"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="url-mode-guide"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="url-mode-comparison-section"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="url-privacy"]')).toBeNull();
  });

  it("renders Timestamp metadata, JSON-LD, and guidance in static HTML", () => {
    const document = timestampDocument();
    const canonical = "https://codec64.com/timestamp";

    expect(document.title).toBe("Z Time and Unix Timestamp Converter | Codec Bench");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toContain(
      "UTC Z time, Unix seconds, and Unix milliseconds",
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(canonical);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(canonical);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1")?.textContent?.trim()).toBe("Z Time and Unix Timestamp Converter");
    const schema: unknown = JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent ?? "");
    expect(schema).toMatchObject({ "@type": "WebApplication", url: canonical });
    expect(document.body.textContent).toContain("How to convert timestamps");
    expect(document.body.textContent).toContain("Precision below one millisecond is truncated");
    expect(document.body.textContent).not.toMatch(/local(?:ly)?|upload|private utc/i);
    expect(document.querySelector('[data-testid="timestamp-format-table"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="timestamp-how-to"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="timestamp-range"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="timestamp-formats"]')).not.toBeNull();
  });

  it("renders JWT canonical metadata, warning, guidance, privacy, and one schema object", () => {
    const document = jwtDocument();
    const canonical = "https://codec64.com/jwt";

    expect(document.title).toBe("JWT Decoder | Codec Bench");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Decode JWT headers and payloads without signature verification.",
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(canonical);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(canonical);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1")?.textContent?.trim()).toBe("JWT Decoder");
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
    const schema: unknown = JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent ?? "");
    expect(schema).toMatchObject({ "@type": "WebApplication", url: canonical });
    expect(document.body.textContent).toContain("Decoded only. Signature not verified.");
    expect(document.body.textContent).toContain("How to decode");
    expect(document.body.textContent).toContain("Decoding vs verification");
    expect(document.body.textContent).not.toMatch(/local(?:ly)?|upload|private browser/i);
    expect(document.querySelector('[data-testid="jwt-static-guidance"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="jwt-how-to"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="jwt-verification"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="jwt-privacy"]')).toBeNull();
  });
});

describe("production FAQ SEO", () => {
  it("renders complete static FAQ content and metadata without structured data", () => {
    const document = faqDocument();
    const description =
      "Answers about Base64, URL encoding, query strings, JWT decoding, Python-to-JSON conversion, and Unix timestamps.";
    const canonical = "https://codec64.com/faq";

    expect(document.title).toBe("Encoding and Conversion FAQ | Codec Bench");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(description);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(canonical);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(canonical);
    expect([...document.querySelectorAll("h1")].map((heading) => heading.textContent?.trim())).toEqual([
      "Encoding and Conversion FAQ",
    ]);
    expect([...document.querySelectorAll("h2")].map((heading) => heading.textContent?.trim())).toEqual([
      "Base64",
      "URL encoding",
      "Query parameters",
      "JWT",
      "Python and JSON",
      "Unix timestamps and Z time",
    ]);
    expect(document.querySelectorAll("h3")).toHaveLength(30);
    expect(new Set([...document.querySelectorAll("h3")].map((heading) => heading.textContent?.trim())).size).toBe(30);
    expect(document.querySelectorAll("details[data-testid='faq-item']")).toHaveLength(30);
    expect(document.querySelectorAll("details > summary[data-testid='faq-summary']")).toHaveLength(30);
    expect(document.querySelectorAll("details > [data-testid='faq-answer']")).toHaveLength(30);
    expect(document.body.textContent).toContain("Anyone with a Base64 decoder can recover the original data");
    expect(document.body.textContent).toContain("+ decodes to a space and %2B decodes to a literal plus");
    expect(document.body.textContent).toContain("Never use decoded claims for authentication or authorization");
    expect(document.body.textContent).toContain("does not call Python or eval");
    expect(document.body.textContent).toContain("precision below one millisecond is truncated");
    expect(
      [...document.querySelectorAll('[data-testid="faq-tool-link"]')].map((link) => link.getAttribute("href")),
    ).toEqual(["/", "/url", "/query", "/jwt", "/python-json", "/timestamp"]);
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0);
    expect(document.documentElement.innerHTML).not.toMatch(/FAQPage|QAPage/);
  });
});

describe("production 404", () => {
  it("generates a root fallback document", () => {
    const document = notFoundDocument();

    expect(document.title).toBe("Page Not Found | Codec Bench");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "The requested Codec Bench page could not be found.",
    );
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex");
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1")?.textContent).toContain("404");
    expect(document.body.textContent).toContain("This page could not be found");
    expect(document.body.textContent).toContain("Codec/Bench");
    expect(
      [...document.querySelectorAll('a[href="/"]')].some((link) => link.textContent?.includes("Back to Codec Bench")),
    ).toBe(true);
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('meta[property="og:url"]')).toBeNull();
    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
    expect(document.querySelector('[data-testid="codec-app"]')).toBeNull();
    expect(document.querySelector('[data-testid$="-workspace"]')).toBeNull();
    expect(document.querySelector('[data-testid="not-found-section"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="not-found-brand-link"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="not-found-home"]')).not.toBeNull();
  });
});
