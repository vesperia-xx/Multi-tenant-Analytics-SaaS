/**
 * Turns URLSearchParams into a plain record, preserving repeated keys so Zod's
 * union/array fields (and our per-field `.catch` fallbacks) still see them.
 */
export function multiValueParams(
  searchParams: URLSearchParams,
): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
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
