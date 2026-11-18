/**
 * RFC 4180 CSV with two safety details:
 * - a UTF-8 BOM so Excel opens accents correctly;
 * - formula-injection neutralising for text cells that start with `=`, `+`,
 *   `@`, tab or CR (numeric values such as `-12.50` are left untouched).
 */
const BOM = "\uFEFF";

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  let text = String(value);
  const numeric = /^-?\d+(\.\d+)?$/.test(text);

  if (!numeric && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\r\n]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ];

  return `${BOM}${lines.join("\r\n")}\r\n`;
}
