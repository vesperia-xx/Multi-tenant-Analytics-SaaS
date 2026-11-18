export type DiffKind = "added" | "removed" | "changed";

export type DiffRow = {
  field: string;
  before: unknown;
  after: unknown;
  kind: DiffKind;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function comparable(value: unknown): string {
  return JSON.stringify(value) ?? "null";
}

function equals(before: unknown, after: unknown): boolean {
  return comparable(before) === comparable(after);
}

/**
 * Field-level diff for the audit ledger. Only changed fields are returned, in
 * the order they appear in `after` first and then `before`.
 */
export function diffObjects(before: unknown, after: unknown): DiffRow[] {
  const beforeObject = isRecord(before) ? before : before == null ? {} : { value: before };
  const afterObject = isRecord(after) ? after : after == null ? {} : { value: after };

  const keys = Array.from(
    new Set([...Object.keys(afterObject), ...Object.keys(beforeObject)]),
  );

  const rows: DiffRow[] = [];

  for (const field of keys) {
    const hasBefore = Object.prototype.hasOwnProperty.call(beforeObject, field);
    const hasAfter = Object.prototype.hasOwnProperty.call(afterObject, field);
    const beforeValue = beforeObject[field];
    const afterValue = afterObject[field];

    if (hasBefore && hasAfter) {
      if (!equals(beforeValue, afterValue)) {
        rows.push({ field, before: beforeValue, after: afterValue, kind: "changed" });
      }
      continue;
    }

    if (hasAfter) {
      rows.push({ field, before: undefined, after: afterValue, kind: "added" });
    } else {
      rows.push({ field, before: beforeValue, after: undefined, kind: "removed" });
    }
  }

  return rows;
}

/** Human-readable cell for a JSON value. */
export function formatDiffValue(value: unknown): string {
  if (value === undefined) return "—";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  try {
    return JSON.stringify(value, null, 0);
  } catch {
    return String(value);
  }
}
