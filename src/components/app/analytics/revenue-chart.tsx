"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency, formatCurrency } from "@/lib/format";

export type RevenueDatum = {
  label: string;
  revenue: number;
};

export function RevenueChart({
  data,
  currency,
}: {
  data: RevenueDatum[];
  currency: string;
}) {
  return (
    <div
      className="h-64 w-full sm:h-72"
      role="img"
      aria-label="Revenue over the selected period"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="2 4"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            width={64}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(value: number) => formatCompactCurrency(value, currency)}
          />
          <Tooltip
            cursor={{ stroke: "var(--foreground)", strokeWidth: 1, strokeDasharray: "2 3" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 2,
              boxShadow: "none",
              fontSize: 12,
              padding: "8px 10px",
            }}
            labelStyle={{
              color: "var(--muted-foreground)",
              fontFamily: "var(--font-ibm-plex-mono)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: 4,
            }}
            formatter={(value) => [formatCurrency(Number(value ?? 0), currency), "Revenue"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--primary)"
            strokeWidth={1.5}
            fill="url(#revenue-fill)"
            activeDot={{ r: 3, strokeWidth: 0, fill: "var(--primary)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
