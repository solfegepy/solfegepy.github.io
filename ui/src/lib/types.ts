export type QueryValue = string | string[];

export type QueryObject = Record<string, QueryValue>;

export type ConversionResult = { ok: true; value: string } | { ok: false; error: string };

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export type JwtDecodeResult = { ok: true; value: DecodedJwt } | { ok: false; error: string };
