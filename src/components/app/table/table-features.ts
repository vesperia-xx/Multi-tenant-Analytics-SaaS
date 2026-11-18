import { tableFeatures } from "@tanstack/react-table";

export type VortexColumnMeta = {
  align?: "left" | "right";
  className?: string;
  /** Set to `false` to render the plain header label with no sort button. */
  sortable?: boolean;
};

/**
 * The per-table type-only slot carries our column meta type, instead of a
 * global declaration merge that would leak into every table in the app.
 */
export const tableFeaturesRoot = tableFeatures({
  columnMeta: {} as VortexColumnMeta,
});
