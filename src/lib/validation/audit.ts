import { z } from "zod";

import {
  dayField,
  directionField,
  pageField,
  pageSizeField,
  searchField,
} from "./common";

export const auditParamsSchema = z.object({
  q: searchField,
  action: z.string().trim().max(80).optional().catch(undefined),
  from: dayField.optional().catch(undefined),
  to: dayField.optional().catch(undefined),
  direction: directionField,
  page: pageField,
  pageSize: pageSizeField,
});

export type AuditParams = z.infer<typeof auditParamsSchema>;
