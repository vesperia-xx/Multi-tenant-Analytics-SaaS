"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatNumber } from "@/lib/format";

export type TrafficDatum = {
  label: string;
  visitors: number;
  sessions: number;
};

export function TrafficChart({ data }: { data: TrafficDatum[] }) {
  return (
    <div
      className="h-56 w-full sm:h-64"
      role="img"
      aria-label="Visitors and sessions over the selected period"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
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
            width={44}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(value: number) => formatNumber(value)}
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
            formatter={(value, name) => [
              formatNumber(Number(value ?? 0)),
              name === "visitors" ? "Visitors" : "Sessions",
            ]}
          />
          <Line
            type="monotone"
            dataKey="visitors"
            stroke="var(--chart-1)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="sessions"
            stroke="var(--chart-4)"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
