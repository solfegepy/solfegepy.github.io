import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { TAILWIND_VERSION } from "../lib/tailwind";
import { TOOLS } from "../lib/tools";

const TITLE = "Base64 Decode and Encode | Codec64";
const DESCRIPTION =
  "Free Base64 encoder and decoder. Convert UTF-8 text to and from standard Base64 or unpadded Base64url in your browser.";
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

function privacyDocument(): Document {
  const html = readFileSync(resolve(import.meta.dirname, "../../../docs/privacy/index.html"), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function aboutDocument(): Document {
  const html = readFileSync(resolve(import.meta.dirname, "../../../docs/about/index.html"), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function asciiDocument(): Document {
  const html = readFileSync(resolve(import.meta.dirname, "../../../docs/ascii/index.html"), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function openSslDocument(): Document {
  const html = readFileSync(resolve(import.meta.dirname, "../../../docs/cheatsheets/openssl/index.html"), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function sshDocument(): Document {
  const html = readFileSync(resolve(import.meta.dirname, "../../../docs/cheatsheets/ssh/index.html"), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function tailwindDocument(): Document {
  const html = readFileSync(resolve(import.meta.dirname, "../../../docs/tailwind/index.html"), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function builtDocument(page: string): Document {
  const html = readFileSync(resolve(import.meta.dirname, "../../../docs", page), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function notFoundDocument(): Document {
  const html = readFileSync(resolve(import.meta.dirname, "../../../docs/404.html"), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

const ROUTES = [
  "/",
  "/url/",
  "/query/",
  "/jwt/",
  "/python-json/",
  "/timestamp/",
  "/tailwind/",
  "/faq/",
  "/privacy/",
  "/about/",
  "/ascii/",
  "/cheatsheets/openssl/",
  "/cheatsheets/ssh/",
];

// Fontsource ships 6 subsets per weight file; both families preload weight 400 in every subset.
const FONT_PRELOAD_COUNT = 2 * 6;

describe("production homepage SEO", () => {
  it("uses GitHub Pages directory URLs in metadata and internal links", () => {
    for (const route of ROUTES) {
      const html = readFileSync(resolve(import.meta.dirname, "../../../docs", `.${route}index.html`), "utf8");
      const document = new DOMParser().parseFromString(html, "text/html");
      const canonical = `https://codec64.com${route}`;

      expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href"), route).toBe(canonical);
      expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content"), route).toBe(canonical);
      expect(document.querySelector('meta[property="og:site_name"]')?.getAttribute("content"), route).toBe("Codec64");
      const schema = document.querySelector('script[type="application/ld+json"]');
      if (schema) {
        const parsed = JSON.parse(schema.textContent ?? "") as { "@graph"?: { url: string }[]; url?: string };
        for (const entity of parsed["@graph"] ?? [parsed]) expect(entity.url, route).toBe(canonical);
      }

      for (const link of document.querySelectorAll('a[href^="/"]')) {
        expect(ROUTES, `${route}: ${link.getAttribute("href")}`).toContain(link.getAttribute("href"));
      }
    }
  });

  it("lists every indexable route in the sitemap and points robots.txt to it", () => {
    const docs = resolve(import.meta.dirname, "../../../docs");
    const parseXml = (file: string) =>
      new DOMParser().parseFromString(readFileSync(resolve(docs, file), "utf8"), "application/xml");
    const sitemapFiles = [...parseXml("sitemap-index.xml").querySelectorAll("sitemap > loc")].map((loc) =>
      new globalThis.URL(loc.textContent ?? "").pathname.slice(1),
    );
    const sitemaps = sitemapFiles.map(parseXml);
    const urls = sitemaps.flatMap((sitemap) =>
      [...sitemap.querySelectorAll("url > loc")].map((loc) => loc.textContent),
    );

    expect(new Set(urls)).toEqual(new Set(ROUTES.map((route) => `https://codec64.com${route}`)));
    expect(urls).toHaveLength(ROUTES.length);
    for (const sitemap of sitemaps) expect(sitemap.querySelector("lastmod")).toBeNull();
    expect(readFileSync(resolve(docs, "robots.txt"), "utf8")).toContain(
      "Sitemap: https://codec64.com/sitemap-index.xml",
    );
  });

  it("serves web fonts from the site's own origin", () => {
    const pages = [
      "",
      "url/",
      "query/",
      "jwt/",
      "python-json/",
      "timestamp/",
      "tailwind/",
      "faq/",
      "privacy/",
      "about/",
      "ascii/",
      "cheatsheets/openssl/",
      "cheatsheets/ssh/",
    ];
    const builtPages = [...pages.map((page) => `${page}index.html`), "404.html"].map((page) =>
      new DOMParser().parseFromString(
        readFileSync(resolve(import.meta.dirname, "../../../docs", page), "utf8"),
        "text/html",
      ),
    );
    for (const document of builtPages) {
      const linksAndStyles = [...document.querySelectorAll("link, style")].map((element) => element.outerHTML);
      expect(linksAndStyles.join("\n")).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);

      const fontFaceCss = [...document.querySelectorAll("style")]
        .map((style) => style.textContent ?? "")
        .filter((css) => css.includes("@font-face"))
        .join("\n");
      const fontUrls = [...fontFaceCss.matchAll(/url\(["']?([^"')]+)/g)].map((match) => match[1]);
      expect(fontUrls.length).toBeGreaterThan(0);
      for (const fontUrl of fontUrls) expect(fontUrl).toMatch(/^\/_astro\//);

      const preloads = [...document.querySelectorAll('link[rel="preload"][as="font"][crossorigin]')];
      expect(preloads).toHaveLength(FONT_PRELOAD_COUNT);
      for (const link of preloads) expect(link.getAttribute("href")).toMatch(/^\/_astro\//);
    }
  });

  it("links the favicon from every built page", () => {
    const pages = ["", "url/", "faq/", "cheatsheets/ssh/"].map((page) => `${page}index.html`);
    for (const page of [...pages, "404.html"]) {
      const html = readFileSync(resolve(import.meta.dirname, "../../../docs", page), "utf8");
      const document = new DOMParser().parseFromString(html, "text/html");
      expect(document.querySelectorAll('link[rel="icon"][href="/favicon.ico"]'), page).toHaveLength(1);
    }
  });

  it("renders every registered route with unique metadata and one heading", () => {
    for (const tool of TOOLS) {
      const output = tool.route === "/" ? "index.html" : `${tool.route.slice(1)}index.html`;
      const html = readFileSync(resolve(import.meta.dirname, `../../../docs/${output}`), "utf8");
      const document = new DOMParser().parseFromString(html, "text/html");
      expect(document.title).toBe(`${tool.title} | Codec64`);
      const description = document.querySelector('meta[name="description"]')?.getAttribute("content");
      expect(description).toBe(tool.metaDescription);
      // Search engines truncate snippets past roughly 160 characters.
      expect(description?.length, tool.route).toBeLessThanOrEqual(160);
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
    expect(document.querySelector('[data-testid="codec-app"]')?.getAttribute("data-hydrated")).toBe("false");
    expect(document.querySelector('[data-testid="codec-app"]')?.hasAttribute("inert")).toBe(true);
    expect(document.querySelector('[data-testid="codec-app"]')?.getAttribute("aria-busy")).toBe("true");
  });

  it("gates analytics behind consent and links the footer to the privacy page in static HTML", () => {
    const document = productionDocument();

    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull();
    expect(document.querySelector('[data-testid="privacy-link"]')?.getAttribute("href")).toBe("/privacy/");
    expect(document.querySelector('[data-testid="cookie-settings-button"]')?.textContent).toBe("Cookie settings");
  });

  it("renders one JSON-LD graph with WebSite and WebApplication entities", () => {
    const document = productionDocument();
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);

    const schema: unknown = JSON.parse(scripts[0]?.textContent ?? "");
    expect(schema).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", name: "Codec64", url: URL },
        {
          "@type": "WebApplication",
          name: "Codec64 Base64 Encoder and Decoder",
          url: URL,
          description: DESCRIPTION,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
      ],
    });
  });

  it("renders URL mode guidance and metadata in static HTML", () => {
    const document = urlDocument();
    const description =
      "Free URL encoder and decoder for RFC 3986 components, full URIs, and form URL-encoded values, with clear + and %20 handling.";

    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(description);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://codec64.com/url/");
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
    const canonical = "https://codec64.com/timestamp/";

    expect(document.title).toBe("Z Time and Unix Timestamp Converter | Codec64");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toContain(
      "Unix timestamps in seconds or milliseconds to UTC Z time",
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
    const canonical = "https://codec64.com/jwt/";

    expect(document.title).toBe("JWT Decoder | Codec64");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Decode JWT headers and payloads into formatted JSON to inspect token claims. Decoding only: signatures are not verified.",
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

  it("renders Tailwind discovery content, metadata, and one WebApplication schema before hydration", () => {
    const document = tailwindDocument();
    const canonical = "https://codec64.com/tailwind/";

    expect(document.title).toBe("Tailwind Color Converter | Codec64");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Browse Tailwind CSS 4 colors and convert any hex color to the closest Tailwind token using OKLab distance.",
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(canonical);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(canonical);
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
    const schema: unknown = JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent ?? "");
    expect(schema).toMatchObject({ "@type": "WebApplication", url: canonical });
    expect(document.querySelector("h1")?.textContent?.trim()).toBe("Tailwind Color Converter");
    expect(document.body.textContent).toContain("Includes colors introduced in Tailwind CSS 4.2 on Feb 2026.");
    expect(
      document.querySelector(`a[href="https://github.com/tailwindlabs/tailwindcss/releases/tag/v${TAILWIND_VERSION}"]`)
        ?.textContent,
    ).toBe("Tailwind CSS 4.2");
    expect(document.body.textContent).toContain("Closest colors are selected using OKLab distance");
    expect(document.body.textContent).toContain("Hex values are sRGB approximations of Tailwind's OKLCH colors.");
    expect(document.querySelector('[data-testid="tailwind-hex-input"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="tailwind-family-select"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="tailwind-shade-select"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="codec-app"]')?.getAttribute("data-hydrated")).toBe("false");
  });
  it("renders Query guidance for parsing and building query strings in static HTML", () => {
    const document = builtDocument("query/index.html");

    expect(document.body.textContent).toContain("How to parse and build query strings");
    expect(document.body.textContent).toContain('{ "tag": ["one", "two"] }');
    expect(document.body.textContent).toContain("Build a query string from JSON");
    expect(document.querySelector('[data-testid="query-guidance"]')).not.toBeNull();
  });

  it("renders Python-to-JSON guidance and a syntax table in static HTML", () => {
    const document = builtDocument("python-json/index.html");

    expect(document.body.textContent).toContain("How to convert a Python dict to JSON");
    expect(document.body.textContent).toContain("never calls Python or eval");
    expect(document.querySelectorAll('[data-testid="python-syntax-table"] tbody tr')).toHaveLength(4);
    expect(document.querySelector('[data-testid="python-guidance"]')).not.toBeNull();
  });
});

describe("production FAQ SEO", () => {
  it("renders complete static FAQ content and metadata without structured data", () => {
    const document = faqDocument();
    const description =
      "Answers about Base64, URL encoding, query strings, JWT decoding, Python-to-JSON conversion, and Unix timestamps.";
    const canonical = "https://codec64.com/faq/";

    expect(document.title).toBe("Encoding and Conversion FAQ | Codec64");
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
    ).toEqual(["/", "/url/", "/query/", "/jwt/", "/python-json/", "/timestamp/"]);
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0);
    expect(document.documentElement.innerHTML).not.toMatch(/FAQPage|QAPage/);
  });
});

describe("production Privacy SEO", () => {
  it("renders the policy, cookie table, and vendor name in static HTML", () => {
    const document = privacyDocument();
    const canonical = "https://codec64.com/privacy/";

    expect(document.title).toBe("Privacy & Cookies Policy | Codec64");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "How Codec64 uses Google Analytics cookies, what data is collected, and how to withdraw consent.",
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(canonical);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(canonical);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1")?.textContent?.trim()).toBe("Privacy & Cookies Policy");
    expect(document.body.textContent).toContain("Google Analytics");
    expect(document.querySelector('[data-testid="privacy-cookie-table"]')?.textContent).toContain("_ga");
    expect(document.querySelector('[data-testid="privacy-cookie-table"]')?.textContent).toContain("_ga_J0WPVDJ942");
    expect(document.querySelector('[data-testid="privacy-cookie-table"]')?.textContent).toContain("cc_cookie");
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0);
  });
});

describe("production About SEO", () => {
  it("renders metadata and a lead linking the privacy policy in static HTML", () => {
    const document = aboutDocument();
    const canonical = "https://codec64.com/about/";

    expect(document.title).toBe("About Codec64");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(canonical);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(canonical);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1")?.textContent?.trim()).toBe("About Codec64");
    expect(document.querySelector('[data-testid="about-lead"] a')?.getAttribute("href")).toBe("/privacy/");
  });
});

describe("production ASCII reference SEO", () => {
  it("renders the searchable reference and metadata in static HTML without converter structured data", () => {
    const document = asciiDocument();
    const canonical = "https://codec64.com/ascii/";

    expect(document.title).toBe("ASCII & Latin Codes | Codec64");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Search ASCII and Unicode Latin characters by letter, decimal, hexadecimal, or UTF-8 URL code.",
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(canonical);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(canonical);
    expect(document.querySelector("h1")?.textContent?.trim()).toBe("ASCII & Latin Codes");
    expect(document.body.textContent).toContain("ASCII covers U+0000–U+007F");
    expect(document.querySelectorAll('[data-testid="ascii-table"] tbody tr')).toHaveLength(848);
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0);
  });
});

describe("production OpenSSL cheatsheet SEO", () => {
  it("renders command examples, guidance, and unique metadata in static HTML", () => {
    const document = openSslDocument();
    const canonical = "https://codec64.com/cheatsheets/openssl/";

    expect(document.title).toBe("OpenSSL Cheatsheet | Codec64");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toContain("OpenSSL");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(canonical);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(canonical);
    expect(document.querySelector("h1")?.textContent?.trim()).toBe("OpenSSL Cheatsheet");
    expect(document.body.textContent).toContain("openssl rand -base64 32 | tr '+/' '-_' | tr -d '=\\n'");
    expect(document.body.textContent).toContain("openssl rand -hex 32");
    expect(document.body.textContent).toContain(
      "(openssl rand -base64 32)\n  .Replace('+', '-')\n  .Replace('/', '_')\n  .TrimEnd('=')",
    );
    expect(document.body.textContent).toContain("32 random bytes (256 bits)");
    expect(document.querySelector('[data-testid="codec-workspace"]')).toBeNull();
  });
});

describe("production SSH cheatsheet SEO", () => {
  it("renders shell commands, version guidance, and unique metadata in static HTML", () => {
    const document = sshDocument();
    const canonical = "https://codec64.com/cheatsheets/ssh/";

    expect(document.title).toBe("SSH Cheatsheet | Codec64");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toContain("SSH");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(canonical);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(canonical);
    expect(document.querySelector("h1")?.textContent?.trim()).toBe("SSH Cheatsheet");
    expect(document.body.textContent).toContain(
      'ssh-keygen \\\n  -t ed25519 \\\n  -N "" \\\n  -C "ci_github 2026-10-29" \\\n  -f ~/.ssh/id_ed25519_ci_github',
    );
    expect(document.body.textContent).toContain("PowerShell 7.3+");
    expect(document.body.textContent).toContain("-i ~/.ssh/id_ed25519_ci_github.pub \\\n  user@server.example.com");
    expect(document.body.textContent).toContain(".pub");
    expect(document.body.textContent).toContain("Keep it protected on the source machine");
    expect(document.querySelector('[data-testid="codec-workspace"]')).toBeNull();
  });
});

describe("production 404", () => {
  it("generates a root fallback document", () => {
    const document = notFoundDocument();

    expect(document.title).toBe("Page Not Found | Codec64");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "The requested Codec64 page could not be found.",
    );
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex");
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1")?.textContent).toContain("404");
    expect(document.body.textContent).toContain("This page could not be found");
    expect(document.body.textContent).toContain("Codec64");
    expect(
      [...document.querySelectorAll('a[href="/"]')].some((link) => link.textContent?.includes("Back to Codec64")),
    ).toBe(true);
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('meta[property="og:url"]')).toBeNull();
    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
    expect(document.querySelector('[data-testid="codec-app"]')).toBeNull();
    expect(document.querySelector('[data-testid$="-workspace"]')).toBeNull();
    expect(document.querySelector('[data-testid="not-found-section"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="not-found-brand-link"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="not-found-brand-link"]')?.getAttribute("aria-label")).toBeNull();
    expect(
      document.querySelector('[data-testid="not-found-brand-link"] [data-testid="brand-logo"]')?.getAttribute("alt"),
    ).toBe("");
    expect(document.querySelector('[data-testid="not-found-home"]')).not.toBeNull();
  });
});
