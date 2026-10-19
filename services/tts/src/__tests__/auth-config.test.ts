import { buildAuthConfig } from "../authConfig";

describe("buildAuthConfig", () => {
  it("returns undefined outside production when unset", () => {
    expect(buildAuthConfig({})).toBeUndefined();
  });
  it("throws in production when unset", () => {
    expect(() => buildAuthConfig({ NODE_ENV: "production" })).toThrow();
  });
  it("throws when the key list is empty after trimming", () => {
    expect(() => buildAuthConfig({ TTS_API_KEY: " , " })).toThrow();
  });
  it("trims and drops empty entries", () => {
    expect(buildAuthConfig({ TTS_API_KEY: "a, b,," })).toEqual({
      type: "apikey",
      keys: ["a", "b"],
    });
  });
});
