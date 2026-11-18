import { z } from "zod";

import {
  dayField,
  directionField,
  pageField,
  pageSizeField,
  searchField,
} from "./common";

/**
 * Table filters are untrusted URL input. Every field has its own fallback, so
 * a mis-typed param degrades that filter alone instead of a 500 or an empty
 * query. `sort` is whitelisted per table — never interpolated blindly.
 */

const base = {
  q: searchField,
  direction: directionField,
  page: pageField,
  pageSize: pageSizeField,
};

export const ORDER_STATUSES = ["PENDING", "PAID", "REFUNDED", "CANCELLED"] as const;

export const ordersParamsSchema = z.object({
  ...base,
  status: z.enum(ORDER_STATUSES).optional().catch(undefined),
  from: dayField.optional().catch(undefined),
  to: dayField.optional().catch(undefined),
  sort: z.enum(["placedAt", "totalCents", "number", "customerName"]).catch("placedAt"),
});

export const CUSTOMER_SORTS = ["createdAt", "name", "ordersCount", "totalSpent"] as const;

export const customersParamsSchema = z.object({
  ...base,
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Use a 2-letter country code.")
    .optional()
    .catch(undefined),
  sort: z.enum(CUSTOMER_SORTS).catch("createdAt"),
});

export const PRODUCT_STATUSES = ["ACTIVE", "ARCHIVED"] as const;

export const productsParamsSchema = z.object({
  ...base,
  status: z.enum(PRODUCT_STATUSES).optional().catch(undefined),
  categoryId: z.string().trim().max(40).optional().catch(undefined),
  sort: z.enum(["name", "sku", "priceCents", "createdAt"]).catch("createdAt"),
});

export type OrdersParams = z.infer<typeof ordersParamsSchema>;
export type CustomersParams = z.infer<typeof customersParamsSchema>;
export type ProductsParams = z.infer<typeof productsParamsSchema>;

export type ListResult<Row> = {
  rows: Row[];
  total: number;
  page: number;
  pageSize: number;
};
