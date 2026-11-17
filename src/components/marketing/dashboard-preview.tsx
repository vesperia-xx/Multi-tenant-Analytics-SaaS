import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Download,
  FileText,
  History,
  LayoutDashboard,
  Lock,
  Package,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Analytics", icon: BarChart3 },
  { label: "Orders", icon: ShoppingCart },
  { label: "Customers", icon: Users },
  { label: "Products", icon: Package },
  { label: "Reports", icon: FileText },
  { label: "Audit log", icon: History },
];

const metrics = [
  { label: "Revenue", value: "$128,430", delta: "+18.2%", positive: true },
  { label: "Orders", value: "1,842", delta: "+9.4%", positive: true },
  { label: "Customers", value: "326", delta: "+12.1%", positive: true },
  { label: "Avg. order", value: "$69.72", delta: "-2.8%", positive: false },
];

const topProducts = [
  { name: "Aurora Desk Lamp", category: "Lighting", value: "$18.4k", width: "92%" },
  { name: "Kite Standing Desk", category: "Furniture", value: "$14.1k", width: "74%" },
  { name: "Fold Acoustic Panel", category: "Office", value: "$9.8k", width: "56%" },
  { name: "Orbit Monitor Arm", category: "Accessories", value: "$7.2k", width: "41%" },
];

export function DashboardPreview() {
  return (
    <div className="relative mx-auto mt-14 w-full max-w-6xl sm:mt-20">
      <div
        aria-hidden="true"
        className="absolute inset-x-6 -top-6 bottom-6 -z-10 rounded-[2.5rem] bg-primary/25 blur-3xl"
      />

      <div className="shadow-glow overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="flex h-10 items-center gap-2 border-b border-border/80 bg-muted/40 px-4">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-warning/70" />
          <span className="size-2.5 rounded-full bg-success/70" />
          <div className="mx-auto flex h-6 w-full max-w-72 items-center justify-center gap-1.5 rounded-md border border-border/70 bg-background/70 px-3 text-[0.625rem] text-muted-foreground">
            <Lock className="size-2.5" />
            <span className="truncate">app.vortexmetrics.io/acme/dashboard</span>
          </div>
          <Badge variant="outline" className="hidden text-[0.5625rem] sm:inline-flex">
            Preview
          </Badge>
        </div>

        <div className="flex">
          <aside className="hidden w-52 shrink-0 flex-col border-r border-border/70 bg-muted/15 p-3 lg:flex">
            <div className="flex items-center gap-2 px-2 py-2">
              <Logo showWordmark={false} markClassName="size-6 rounded-md" />
              <span className="text-xs font-semibold">Vortex Metrics</span>
            </div>

            <button
              type="button"
              tabIndex={-1}
              className="mt-3 flex w-full items-center gap-2.5 rounded-lg border border-border/70 bg-background/60 px-2.5 py-2 text-left"
            >
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/15 text-[0.625rem] font-semibold text-primary">
                A
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.6875rem] font-medium">Acme Inc</span>
                <span className="block text-[0.5625rem] text-muted-foreground">Owner</span>
              </span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>

            <nav className="mt-4 flex flex-col gap-0.5">
              {navItems.map((item) => (
                <span
                  key={item.label}
                  className={
                    item.active
                      ? "flex items-center gap-2 rounded-md bg-primary/12 px-2.5 py-1.5 text-[0.6875rem] font-medium text-primary"
                      : "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[0.6875rem] text-muted-foreground"
                  }
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </span>
              ))}
            </nav>

            <div className="mt-auto flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-chart-1 to-chart-2 text-[0.5625rem] font-semibold text-white">
                RM
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.625rem] font-medium">Ricardo M.</span>
                <span className="block text-[0.5625rem] text-muted-foreground">
                  owner@acme.test
                </span>
              </span>
              <Settings className="size-3 text-muted-foreground" />
            </div>
          </aside>

          <div className="min-w-0 flex-1 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold sm:text-base">Dashboard</h3>
                  <Badge variant="success" className="text-[0.5625rem]">
                    Live
                  </Badge>
                </div>
                <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                  Acme Inc · last 30 days vs previous period
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex h-7 items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2 text-[0.625rem] text-muted-foreground">
                  Last 30 days <ChevronDown className="size-2.5" />
                </span>
                <span className="hidden h-7 items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2 text-[0.625rem] text-muted-foreground sm:flex">
                  All categories <ChevronDown className="size-2.5" />
                </span>
                <span className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[0.625rem] font-medium text-primary-foreground">
                  <Download className="size-2.5" /> Export
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-border/70 bg-background/45 p-3"
                >
                  <p className="text-[0.5625rem] font-medium uppercase tracking-wider text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="mt-1.5 text-base font-semibold tracking-tight sm:text-lg">
                    {metric.value}
                  </p>
                  <p
                    className={
                      metric.positive
                        ? "mt-1 flex items-center gap-0.5 text-[0.5625rem] font-medium text-success"
                        : "mt-1 flex items-center gap-0.5 text-[0.5625rem] font-medium text-destructive"
                    }
                  >
                    {metric.positive ? (
                      <ArrowUpRight className="size-2.5" />
                    ) : (
                      <ArrowDownRight className="size-2.5" />
                    )}
                    {metric.delta}
                    <span className="ml-0.5 font-normal text-muted-foreground">vs prev.</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-[1.65fr_1fr]">
              <div className="rounded-lg border border-border/70 bg-background/45 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.6875rem] font-medium">Revenue over time</p>
                    <p className="text-[0.5625rem] text-muted-foreground">
                      Daily net revenue, paid orders
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[0.5625rem] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-chart-1" /> Current
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-muted-foreground/50" /> Previous
                    </span>
                  </div>
                </div>

                <svg
                  viewBox="0 0 640 210"
                  role="img"
                  aria-label="Revenue chart preview"
                  className="mt-3 h-auto w-full"
                >
                  <defs>
                    <linearGradient id="preview-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {[36, 78, 120, 162].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="640"
                      y2={y}
                      stroke="var(--border)"
                      strokeWidth="1"
                      strokeDasharray="3 5"
                    />
                  ))}

                  <path
                    d="M0,172 C34,166 56,132 92,138 C128,144 146,108 186,114 C226,120 242,84 282,94 C322,104 338,62 380,70 C422,78 444,50 486,42 C528,34 556,58 600,30 L640,34 L640,210 L0,210 Z"
                    fill="url(#preview-area)"
                  />
                  <path
                    d="M0,172 C34,166 56,132 92,138 C128,144 146,108 186,114 C226,120 242,84 282,94 C322,104 338,62 380,70 C422,78 444,50 486,42 C528,34 556,58 600,30 L640,34"
                    fill="none"
                    stroke="var(--chart-1)"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0,186 C40,182 58,160 96,164 C134,168 152,140 194,146 C236,152 252,122 294,128 C336,134 354,104 396,110 C438,116 456,88 498,84 C540,80 574,96 616,78 L640,80"
                    fill="none"
                    stroke="var(--muted-foreground)"
                    strokeOpacity="0.55"
                    strokeWidth="1.5"
                    strokeDasharray="5 6"
                    strokeLinecap="round"
                  />

                  <circle cx="486" cy="42" r="4" fill="var(--card)" stroke="var(--chart-1)" strokeWidth="2" />
                  <g transform="translate(430 8)">
                    <rect
                      width="112"
                      height="26"
                      rx="6"
                      fill="var(--popover)"
                      stroke="var(--border)"
                    />
                    <text x="10" y="16" fontSize="9" fill="var(--muted-foreground)">
                      May 18
                    </text>
                    <text x="58" y="16" fontSize="9" fontWeight="600" fill="var(--foreground)">
                      $32,418
                    </text>
                  </g>

                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => (
                    <text
                      key={month}
                      x={20 + index * 120}
                      y="204"
                      fontSize="8.5"
                      fill="var(--muted-foreground)"
                    >
                      {month}
                    </text>
                  ))}
                </svg>
              </div>

              <div className="rounded-lg border border-border/70 bg-background/45 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[0.6875rem] font-medium">Top products</p>
                  <span className="text-[0.5625rem] text-muted-foreground">By revenue</span>
                </div>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {topProducts.map((product) => (
                    <li key={product.name}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[0.625rem] font-medium">{product.name}</span>
                        <span className="shrink-0 text-[0.5625rem] text-muted-foreground">
                          {product.value}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-chart-1 to-chart-2"
                            style={{ width: product.width }}
                          />
                        </div>
                        <span className="w-16 truncate text-[0.5rem] text-muted-foreground">
                          {product.category}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between rounded-md border border-border/60 bg-background/60 px-2.5 py-2">
                  <div>
                    <p className="text-[0.5625rem] text-muted-foreground">Conversion rate</p>
                    <p className="text-sm font-semibold">3.42%</p>
                  </div>
                  <Badge variant="success" className="text-[0.5rem]">
                    <ArrowUpRight className="size-2.5" /> +0.31
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-3 hidden items-center justify-between rounded-lg border border-border/70 bg-background/45 px-3 py-2 md:flex">
              <div className="flex items-center gap-2 text-[0.5625rem] text-muted-foreground">
                <Search className="size-3" />
                Search orders, customers or products…
              </div>
              <span className="rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 font-mono text-[0.5rem] text-muted-foreground">
                ⌘ K
              </span>
            </div>
          </div>
        </div>
      </div>

      <ul className="mt-5 grid gap-2 sm:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            tone: "text-success bg-success/12",
            title: "Row-Level Security",
            detail: "tenant_id = current_setting()",
          },
          {
            icon: Lock,
            tone: "text-primary bg-primary/12",
            title: "Tenant isolated",
            detail: "Acme Inc · 2 memberships",
          },
          {
            icon: History,
            tone: "text-chart-2 bg-chart-2/12",
            title: "Audit logged",
            detail: "before → after, per field",
          },
        ].map((fact) => (
          <li
            key={fact.title}
            className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 px-3 py-2.5"
          >
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${fact.tone}`}
            >
              <fact.icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.6875rem] font-semibold">{fact.title}</span>
              <span className="block truncate font-mono text-[0.5625rem] text-muted-foreground">
                {fact.detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
