export const CONSENT_STORAGE_KEY = "codec-bench-consent-v1";
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1_000;

export type ConsentStatus = "granted" | "denied";

export interface ConsentRecord {
  status: ConsentStatus;
  decidedAt: number;
}

/** Parse a stored consent record; unreadable or tampered input means undecided. */
export function parseConsentRecord(raw: string | null): ConsentRecord | null {
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const { status, decidedAt } = parsed as Record<string, unknown>;

  if (status !== "granted" && status !== "denied") return null;
  // A future timestamp means a tampered or clock-skewed record: treat as undecided.
  if (typeof decidedAt !== "number" || !Number.isFinite(decidedAt) || decidedAt > Date.now()) return null;

  return { status, decidedAt };
}

/** True when the visitor has not decided, or their decision has expired. */
export function shouldShowBanner(record: ConsentRecord | null, now: number): boolean {
  if (record === null) return true;
  return now - record.decidedAt > CONSENT_MAX_AGE_MS;
}
