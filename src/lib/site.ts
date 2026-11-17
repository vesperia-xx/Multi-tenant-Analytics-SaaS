export const siteConfig = {
  name: "Vortex Metrics",
  shortName: "Vortex",
  tagline: "Multi-tenant analytics for modern teams",
  description:
    "A multi-tenant analytics SaaS with strict tenant isolation, role-based access control, SQL-native reporting and a complete audit trail.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  locale: "en_US",
} as const;

export const marketingNav = [
  { label: "Product", href: "#product" },
  { label: "Security", href: "#security" },
  { label: "Architecture", href: "#architecture" },
  { label: "Stack", href: "#stack" },
] as const;
