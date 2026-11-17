import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

const paper = "#f8f5ee";
const ink = "#1b1a16";
const klein = "#1f3fd8";
const vermilion = "#d6452f";
const muted = "#6f6a5e";
const rule = "#dcd6c8";

const serif = "Instrument Serif";
const mono = "IBM Plex Mono";

export const alt = "Vortex Metrics — Multi-tenant analytics with strict tenant isolation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Fonts are read once at module scope: how Next.js expects static OG routes to
 * declare assets, and it keeps the route prerendered at build time.
 */
const [serifRegular, serifItalic, plexMono] = await Promise.all([
  readFile(path.join(process.cwd(), "src/app/fonts/InstrumentSerif-Regular.ttf")),
  readFile(path.join(process.cwd(), "src/app/fonts/InstrumentSerif-Italic.ttf")),
  readFile(path.join(process.cwd(), "src/app/fonts/IBMPlexMono-Regular.ttf")),
]);

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
          backgroundColor: paper,
          color: ink,
          padding: "56px 64px 48px",
          fontFamily: mono,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 64,
            right: 64,
            top: 118,
            height: 1,
            backgroundColor: rule,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 46,
                height: 46,
                backgroundColor: ink,
                color: paper,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: serif,
                fontSize: 30,
                lineHeight: 1,
              }}
            >
              V
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: serif, fontSize: 28 }}>Vortex</span>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: muted,
                }}
              >
                Metrics
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: mono,
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: muted,
            }}
          >
            <span style={{ width: 7, height: 7, backgroundColor: vermilion, display: "flex" }} />
            Specimen 04 / Multi-tenant analytics
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: serif,
              fontSize: 82,
              lineHeight: 1.02,
              letterSpacing: -1,
              maxWidth: 1000,
            }}
          >
            Analytics that never cross
            <div style={{ display: "flex", fontFamily: serif, fontStyle: "italic", color: klein }}>
              the tenant boundary.
            </div>
          </div>
          <div
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: muted,
              maxWidth: 960,
              fontFamily: mono,
            }}
          >
            PostgreSQL-native metrics, RBAC, reports and audit trails — with isolation enforced at
            the application layer and in the database.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${rule}`,
            paddingTop: 20,
          }}
        >
          <div style={{ display: "flex", gap: 26, fontFamily: mono, fontSize: 13, color: muted }}>
            {["PostgreSQL 16", "RLS with FORCE", "Next.js 16", "Prisma 7"].map((item) => (
              <span key={item} style={{ display: "flex" }}>
                {item}
              </span>
            ))}
          </div>
          <span style={{ fontFamily: mono, fontSize: 13, color: muted }}>app.vortexmetrics.io</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: serif, data: serifRegular, weight: 400, style: "normal" },
        { name: serif, data: serifItalic, weight: 400, style: "italic" },
        { name: mono, data: plexMono, weight: 400, style: "normal" },
      ],
    },
  );
}
