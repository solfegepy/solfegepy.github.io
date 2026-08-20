import { describe, expect, it } from "vitest";

import { CONSENT_MAX_AGE_MS, CONSENT_STORAGE_KEY, parseConsentRecord, shouldShowBanner } from "./consent";

describe("consent contract", () => {
  it("names the storage key with the project prefix and a version suffix", () => {
    expect(CONSENT_STORAGE_KEY).toBe("codec-bench-consent-v1");
  });

  it("round-trips a valid granted record", () => {
    const raw = JSON.stringify({ status: "granted", decidedAt: 1_000 });
    expect(parseConsentRecord(raw)).toEqual({ status: "granted", decidedAt: 1_000 });
  });

  it("round-trips a valid denied record", () => {
    const raw = JSON.stringify({ status: "denied", decidedAt: 1_000 });
    expect(parseConsentRecord(raw)).toEqual({ status: "denied", decidedAt: 1_000 });
  });

  it("treats a missing record as undecided", () => {
    expect(parseConsentRecord(null)).toBeNull();
  });

  it("treats non-JSON as undecided", () => {
    expect(parseConsentRecord("not-json")).toBeNull();
  });

  it("treats an unknown status as undecided", () => {
    expect(parseConsentRecord(JSON.stringify({ status: "maybe", decidedAt: 1_000 }))).toBeNull();
  });

  it("treats a missing decidedAt as undecided", () => {
    expect(parseConsentRecord(JSON.stringify({ status: "granted" }))).toBeNull();
  });

  it("treats a NaN decidedAt as undecided", () => {
    expect(parseConsentRecord(JSON.stringify({ status: "granted", decidedAt: Number.NaN }))).toBeNull();
  });

  it("treats a future decidedAt as undecided", () => {
    const future = Date.now() + 60_000;
    expect(parseConsentRecord(JSON.stringify({ status: "granted", decidedAt: future }))).toBeNull();
  });

  it("shows the banner when there is no record", () => {
    expect(shouldShowBanner(null, Date.now())).toBe(true);
  });

  it("hides the banner for a fresh granted record", () => {
    const now = 10_000_000;
    expect(shouldShowBanner({ status: "granted", decidedAt: now }, now)).toBe(false);
  });

  it("hides the banner for a fresh denied record", () => {
    const now = 10_000_000;
    expect(shouldShowBanner({ status: "denied", decidedAt: now }, now)).toBe(false);
  });

  it("re-shows the banner once a record is older than the max age", () => {
    const decidedAt = 0;
    const now = CONSENT_MAX_AGE_MS + 1;
    expect(shouldShowBanner({ status: "granted", decidedAt }, now)).toBe(true);
  });
});
