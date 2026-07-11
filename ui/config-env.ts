/** Return required environment value as a positive integer. */
export function requirePositiveInteger(env: Record<string, string>, key: string): number {
  const value = env[key];

  if (value === undefined) throw new Error(`Missing ${key}`);

  const integer = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(integer) || integer < 1) {
    throw new Error(`Invalid ${key}: expected positive integer`);
  }

  return integer;
}
