/**
 * Strict environment variable parsing (issue #1798).
 * Rejects non-integer / non-positive values instead of silently yielding NaN.
 */
export function parsePositiveIntEnv(
  name: string,
  defaultValue: number,
  env: NodeJS.ProcessEnv = process.env,
): number {
  const raw = env[name];
  if (raw === undefined || raw.trim() === "") {
    return defaultValue;
  }
  const trimmed = raw.trim();
  if (!/^[0-9]+$/.test(trimmed)) {
    throw new Error(`Invalid ${name}: expected a positive integer, got "${raw}"`);
  }
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid ${name}: expected a positive integer, got "${raw}"`);
  }
  return value;
}
