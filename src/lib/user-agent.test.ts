import { describe, expect, it } from "vitest";

import { describeUserAgent } from "./user-agent";

const edgeWindows =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0";
const chromeMac =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const safariIos =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const firefoxLinux =
  "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0";

describe("describeUserAgent", () => {
  it("names the browser before Safari", () => {
    expect(describeUserAgent(edgeWindows)).toBe("Edge on Windows");
    expect(describeUserAgent(chromeMac)).toBe("Chrome on macOS");
    expect(describeUserAgent(firefoxLinux)).toBe("Firefox on Linux");
  });

  it("detects iOS before macOS", () => {
    expect(describeUserAgent(safariIos)).toBe("Safari on iOS");
  });

  it("falls back for missing or unrecognised agents", () => {
    expect(describeUserAgent(null)).toBe("Unknown device");
    expect(describeUserAgent(undefined)).toBe("Unknown device");
    expect(describeUserAgent("curl/8.0")).toBe("Browser on unknown OS");
  });
});
