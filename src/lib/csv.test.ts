import { describe, expect, it } from "vitest";

import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell("Lovelace, Ada")).toBe('"Lovelace, Ada"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("two\nlines")).toBe('"two\nlines"');
  });

  it("neutralises formula injection but keeps numbers", () => {
    expect(csvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(csvCell("+34 600")).toBe("'+34 600");
    expect(csvCell("@user")).toBe("'@user");
    expect(csvCell("-12.50")).toBe("-12.50");
    expect(csvCell("-12.50 EUR")).toBe("'-12.50 EUR");
  });

  it("renders empty values as empty cells", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });
});

describe("toCsv", () => {
  it("writes a BOM, CRLF line endings and escaped rows", () => {
    const csv = toCsv(["Name", "Total"], [["Ada, Lovelace", "189.00"]]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Ada, Lovelace",189.00');
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csv.split("\r\n")).toHaveLength(3);
  });
});
