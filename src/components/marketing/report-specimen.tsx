const products = [
  { name: "Aurora Desk Lamp", category: "Lighting", revenue: "$18,420", share: "14.3%" },
  { name: "Kite Standing Desk", category: "Furniture", revenue: "$14,080", share: "11.0%" },
  { name: "Fold Acoustic Panel", category: "Office", revenue: "$9,760", share: "7.6%" },
];

const points = [
  [6, 98],
  [35, 92],
  [65, 95],
  [94, 84],
  [124, 78],
  [153, 82],
  [182, 70],
  [212, 64],
  [241, 58],
  [271, 60],
  [300, 46],
  [330, 34],
] as const;

const linePath = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x},${y}`).join(" ");
const areaPath = `${linePath} L330,120 L6,120 Z`;
const lastPoint = points[points.length - 1];

/**
 * A printed report sheet, not an app window: no browser chrome, no glow.
 * It previews the density and typography the real dashboard will ship with.
 */
export function ReportSpecimen() {
  return (
    <figure className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-muted-foreground">
          Specimen 04 / Revenue
        </span>
        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-muted-foreground">
          Acme Inc. · USD
        </span>
      </div>

      <div className="px-5 pb-5 pt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-muted-foreground">
              Net revenue · 12 months
            </p>
            <p className="tnum mt-2 font-serif text-[2.75rem] leading-none tracking-tight">
              $128,430
            </p>
          </div>
          <div className="pb-1 text-right">
            <p className="tnum font-mono text-[0.75rem] font-medium text-success">+18.2%</p>
            <p className="mt-1 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
              vs. prior period
            </p>
          </div>
        </div>

        <svg
          viewBox="0 0 340 138"
          role="img"
          aria-label="Monthly net revenue trending upward over twelve months"
          className="mt-6 h-auto w-full"
        >
          <defs>
            <linearGradient id="specimen-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[34, 56, 78, 100].map((y) => (
            <line
              key={y}
              x1="6"
              y1={y}
              x2="330"
              y2={y}
              stroke="var(--border)"
              strokeWidth="0.75"
              strokeDasharray="2 4"
            />
          ))}

          <path d={areaPath} fill="url(#specimen-area)" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={lastPoint[0]} cy={lastPoint[1]} r="2.4" fill="var(--card)" stroke="var(--chart-1)" strokeWidth="1.4" />

          {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((month, index) => (
            <text
              key={month}
              x={6 + index * 59}
              y="132"
              fontSize="6.5"
              fontFamily="var(--font-ibm-plex-mono), monospace"
              fill="var(--muted-foreground)"
            >
              {month}
            </text>
          ))}
        </svg>

        <table className="mt-5 w-full border-t border-border text-left">
          <thead>
            <tr className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
              <th className="py-2 font-normal">Product</th>
              <th className="py-2 text-right font-normal">Revenue</th>
              <th className="hidden py-2 text-right font-normal sm:table-cell">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {products.map((product) => (
              <tr key={product.name} className="text-xs">
                <td className="py-2 pr-3">
                  <span className="block truncate font-medium">{product.name}</span>
                  <span className="mt-0.5 block font-mono text-[0.5rem] uppercase tracking-[0.12em] text-muted-foreground">
                    {product.category}
                  </span>
                </td>
                <td className="tnum py-2 text-right font-mono text-[0.6875rem]">{product.revenue}</td>
                <td className="tnum hidden py-2 text-right font-mono text-[0.6875rem] text-muted-foreground sm:table-cell">
                  {product.share}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <figcaption className="border-t border-border px-5 py-3 font-mono text-[0.5rem] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground">
        Source: orders where status = &apos;paid&apos; · grouped by month
      </figcaption>
    </figure>
  );
}
