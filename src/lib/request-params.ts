import type { NextRequest } from "next/server";

/**
 * URLSearchParams keeps only one value per key when spread; this preserves
 * repeated keys so the Zod schemas see the original request.
 */
export function searchParamsRecord(request: NextRequest): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {};

  request.nextUrl.searchParams.forEach((value, key) => {
    const existing = record[key];
    if (existing === undefined) {
      record[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      record[key] = [existing, value];
    }
  });

  return record;
}
