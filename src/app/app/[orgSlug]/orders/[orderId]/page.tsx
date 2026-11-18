import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { OrderStatusBadge } from "@/components/app/table/order-status-badge";
import { formatCurrency } from "@/lib/format";
import { getOrderDetail } from "@/server/orders/queries";
import { requireOrgContext } from "@/server/org/context";

export const metadata: Metadata = {
  title: "Order",
  description: "Order detail for this workspace.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; orderId: string }>;
}) {
  const { orgSlug, orderId } = await params;
  const context = await requireOrgContext(orgSlug);
  const order = await getOrderDetail(context.organization.id, orderId);

  if (!order) notFound();

  const currency = context.organization.currency;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/app/${context.organization.slug}/orders`}
          className="inline-flex items-center gap-2 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden="true" />
          Orders
        </Link>
      </div>

      <header>
        <p className="flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block size-1.5 bg-primary" />
          Workspace / Order
        </p>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-mono text-[2.2rem] leading-none tracking-tight sm:text-[2.6rem]">
              {order.number}
            </h1>
            <p className="tnum mt-3 text-sm text-muted-foreground">
              {format(new Date(order.placedAt), "d MMMM yyyy, HH:mm")} · {order.items.length}{" "}
              {order.items.length === 1 ? "line" : "lines"}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="border border-border bg-card">
          <div className="border-b border-border px-4 py-2.5">
            <h2 className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground">
              Line items
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-mono text-[0.5rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Product
                  </th>
                  <th className="px-4 py-2 text-left font-mono text-[0.5rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    SKU
                  </th>
                  <th className="px-4 py-2 text-right font-mono text-[0.5rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-right font-mono text-[0.5rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Unit
                  </th>
                  <th className="px-4 py-2 text-right font-mono text-[0.5rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Line
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-border/60 last:border-b-0">
                    <td className="px-4 py-3 text-[0.8125rem] font-medium">{item.productName}</td>
                    <td className="px-4 py-3 font-mono text-[0.75rem] text-muted-foreground">
                      {item.sku}
                    </td>
                    <td className="tnum px-4 py-3 text-right">{item.quantity}</td>
                    <td className="tnum px-4 py-3 text-right font-mono text-[0.75rem] text-muted-foreground">
                      {formatCurrency(item.unitPriceCents, currency)}
                    </td>
                    <td className="tnum px-4 py-3 text-right font-mono text-[0.75rem]">
                      {formatCurrency(item.lineTotalCents, currency)}
                    </td>
                  </tr>
                ))}
                {order.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No line items recorded.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="border border-border bg-card p-5">
            <h2 className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground">
              Totals
            </h2>
            <dl className="mt-3">
              <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2">
                <dt className="text-sm text-muted-foreground">Subtotal</dt>
                <dd className="tnum font-mono text-[0.8125rem]">
                  {formatCurrency(order.subtotalCents, currency)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2">
                <dt className="text-sm text-muted-foreground">Discount</dt>
                <dd className="tnum font-mono text-[0.8125rem] text-muted-foreground">
                  {order.discountCents > 0 ? `−${formatCurrency(order.discountCents, currency)}` : formatCurrency(0, currency)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2">
                <dt className="text-sm text-muted-foreground">Tax</dt>
                <dd className="tnum font-mono text-[0.8125rem]">
                  {formatCurrency(order.taxCents, currency)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-sm font-medium">Total</dt>
                <dd className="tnum font-serif text-xl">
                  {formatCurrency(order.totalCents, currency)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="border border-border bg-card p-5">
            <h2 className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground">
              Customer
            </h2>
            <p className="mt-3 text-[0.9375rem] font-medium">{order.customer.name}</p>
            <p className="mt-1 break-all font-mono text-[0.625rem] uppercase tracking-[0.08em] text-muted-foreground">
              {order.customer.email}
            </p>
            <Link
              href={`/app/${context.organization.slug}/customers`}
              className="link-underline mt-4 inline-block text-sm text-primary"
            >
              See their spend
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
