import { Badge } from "@/components/ui/badge";
import { ORDER_STATUSES } from "@/lib/validation/table";

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const config: Record<OrderStatus, { label: string; variant: "success" | "warning" | "outline" | "destructive" }> = {
  PAID: { label: "Paid", variant: "success" },
  PENDING: { label: "Pending", variant: "warning" },
  REFUNDED: { label: "Refunded", variant: "outline" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = config[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
