import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site";

export const alt = "Vortex Metrics — Multi-tenant analytics with strict tenant isolation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0b0910",
          backgroundImage:
            "radial-gradient(60% 80% at 15% 0%, rgba(139,92,246,0.38) 0%, transparent 60%), radial-gradient(45% 60% at 100% 100%, rgba(34,211,238,0.16) 0%, transparent 65%)",
          padding: "64px 72px",
          fontFamily: "sans-serif",
          color: "#f4f2f9",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            opacity: 0.5,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundImage: "linear-gradient(135deg, #8b5cf6 0%, #4f46e5 50%, #22d3ee 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 26,
              fontWeight: 700,
              boxShadow: "0 0 40px rgba(139,92,246,0.45)",
            }}
          >
            V
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.4 }}>
              {siteConfig.name}
            </span>
            <span
              style={{
                fontSize: 12,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "#a99fc4",
              }}
            >
              Multi-tenant analytics
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <span
            style={{
              fontSize: 64,
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: -2.4,
              maxWidth: 960,
            }}
          >
            Analytics that never
            <br />
            <span style={{ color: "#b9a4ff" }}>cross the tenant boundary.</span>
          </span>
          <span style={{ fontSize: 22, color: "#b4acc7", maxWidth: 760, lineHeight: 1.5 }}>
            PostgreSQL-native metrics, RBAC, reports and audit trails — with isolation enforced
            at the application layer and in the database.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            {["PostgreSQL 16", "RLS with FORCE", "Next.js 16", "Prisma 7"].map((item) => (
              <span
                key={item}
                style={{
                  fontSize: 14,
                  color: "#cfc7e2",
                  border: "1px solid rgba(255,255,255,0.16)",
                  borderRadius: 999,
                  padding: "7px 14px",
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
              >
                {item}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 14, color: "#8f86a8" }}>app.vortexmetrics.io</span>
        </div>
      </div>
    ),
    ofetchOptions(),
  );
}

function ofetchOptions() {
  return { ...size };
}
