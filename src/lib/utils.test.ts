import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });

  it("drops falsy values", () => {
    expect(cn("flex", false, undefined, null, "gap-2")).toBe("flex gap-2");
  });

  it("lets later Tailwind utilities win over earlier ones", () => {
    expect(cn("p-2 text-sm", "p-4")).toBe("text-sm p-4");
  });
});
