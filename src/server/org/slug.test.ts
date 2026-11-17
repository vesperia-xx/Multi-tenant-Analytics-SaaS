import { describe, expect, it } from "vitest";

import { slugify } from "./slug";

describe("slugify", () => {
  it("builds readable, URL-safe slugs", () => {
    expect(slugify("Acme Inc.")).toBe("acme-inc");
    expect(slugify("Nordwind Studio")).toBe("nordwind-studio");
    expect(slugify("  Many   spaces  ")).toBe("many-spaces");
  });

  it("strips accents and apostrophes", () => {
    expect(slugify("Café Ñandú")).toBe("cafe-nandu");
    expect(slugify("O'Neill & Sons")).toBe("oneill-sons");
  });

  it("never starts or ends with a hyphen", () => {
    expect(slugify("--Hello--World--")).toBe("hello-world");
    expect(slugify("!!!")).toBe("");
  });

  it("caps the length at 48 characters", () => {
    expect(slugify("a".repeat(80)).length).toBe(48);
  });
});
