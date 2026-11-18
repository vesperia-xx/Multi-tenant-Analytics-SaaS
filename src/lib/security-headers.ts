/**
 * Response headers applied to every route.
 *
 * The CSP keeps a strict default and allows the inline script/style tags that
 * Next.js, next-themes and Recharts need. `unsafe-eval` is development-only
 * (Turbopack HMR); production drops it. A nonce-based CSP is the next step once
 * the inline bootstrapping is isolated.
 */
export type SecurityHeader = { key: string; value: string };

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "manifest-src 'self'",
];

export function buildSecurityHeaders(isProduction: boolean): SecurityHeader[] {
  const scriptSources = isProduction
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  const headers: SecurityHeader[] = [
    { key: "Content-Security-Policy", value: [...CSP_DIRECTIVES, scriptSources].join("; ") },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
  ];

  if (isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
    headers[0]!.value += "; upgrade-insecure-requests";
  }

  return headers;
}
