export interface ApiKeyAuthConfig {
  type: "apikey";
  keys: string[];
}

/**
 * Build the auth config from the environment.
 * - Keys are comma separated; entries are trimmed and empty ones dropped.
 * - If TTS_API_KEY is set but yields no keys, startup fails.
 * - In production (NODE_ENV=production) a non-empty key list is required.
 */
export function buildAuthConfig(
  env: NodeJS.ProcessEnv = process.env
): ApiKeyAuthConfig | undefined {
  const raw = env.TTS_API_KEY;
  const keys = (raw ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  if (keys.length === 0) {
    if (raw !== undefined && raw !== "") {
      throw new Error("TTS_API_KEY is set but contains no usable keys");
    }
    if (env.NODE_ENV === "production") {
      throw new Error("TTS_API_KEY must be set when NODE_ENV=production");
    }
    return undefined;
  }
  return { type: "apikey", keys };
}
