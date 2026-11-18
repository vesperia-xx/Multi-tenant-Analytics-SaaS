import "server-only";

import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ReactNode } from "react";

/**
 * Printed counterpart of the dashboard. It receives numbers that were already
 * computed and formatted by the same SQL functions as the screen, so the PDF
 * and the chart cannot disagree.
 */
export type AnalyticsReportData = {
  organizationName: string;
  organizationSlug: string;
  currency: string;
  timezone: string;
  rangeLabel: string;
  granularity: string;
  generatedAt: string;
  kpis: Array<{ label: string; value: string; delta: string }>;
  revenueRows: Array<{ bucket: string; revenue: string; orders: number }>;
  topProducts: Array<{ name: string; sku: string; revenue: string; units: number }>;
  statusRows: Array<{ label: string; count: number; share: string; total: string }>;
  summary: Array<{ label: string; value: string }>;
};

const colors = {
  ink: "#211f1b",
  muted: "#6d675e",
  border: "#d8d2c6",
  primary: "#2f3ea0",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingHorizontal: 36,
    paddingBottom: 52,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: colors.ink,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    paddingBottom: 6,
  },
  brand: { fontFamily: "Times-Roman", fontSize: 13, letterSpacing: 0.4 },
  brandAccent: { fontFamily: "Helvetica", fontSize: 8, color: colors.muted, marginLeft: 3 },
  tag: { fontSize: 6.5, letterSpacing: 1.4, textTransform: "uppercase", color: colors.muted },
  title: { fontFamily: "Times-Roman", fontSize: 25, marginTop: 14, lineHeight: 1.05 },
  subtitle: { fontSize: 9, color: colors.muted, marginTop: 4 },
  meta: { fontSize: 7, color: colors.muted, marginTop: 4, marginBottom: 4 },
  sectionTitle: {
    fontSize: 6.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.muted,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingBottom: 3,
    marginTop: 16,
    marginBottom: 6,
  },
  kpiRow: { flexDirection: "row" },
  kpi: {
    flexGrow: 1,
    flexBasis: 0,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 8,
    marginRight: 6,
  },
  kpiLast: {
    flexGrow: 1,
    flexBasis: 0,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 8,
  },
  kpiLabel: { fontSize: 5.5, letterSpacing: 1, textTransform: "uppercase", color: colors.muted },
  kpiValue: { fontFamily: "Times-Roman", fontSize: 15, marginTop: 4 },
  kpiDelta: { fontSize: 6.5, marginTop: 4, color: colors.muted },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingBottom: 3,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingVertical: 3.5,
  },
  th: { fontSize: 5.8, letterSpacing: 1, textTransform: "uppercase", color: colors.muted },
  td: { fontSize: 8 },
  tdMuted: { fontSize: 8, color: colors.muted },
  grow: { flexGrow: 1 },
  num: { width: 82, textAlign: "right" },
  numSmall: { width: 56, textAlign: "right" },
  twoCols: { flexDirection: "row", marginTop: 2 },
  col: { flex: 1 },
  colRight: { flex: 1, marginLeft: 18 },
  empty: { fontSize: 8, color: colors.muted, paddingVertical: 8 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingVertical: 3,
  },
  summaryLabel: { fontSize: 8, color: colors.muted },
  summaryValue: { fontSize: 8 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6.5,
    color: colors.muted,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: 5,
  },
});

function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function AnalyticsReport({ data }: { data: AnalyticsReportData }) {
  return (
    <Document
      title={`Vortex Metrics · ${data.organizationName}`}
      author="Vortex Metrics"
      subject={`Analytics report ${data.rangeLabel}`}
      creator="Vortex Metrics"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>
            VORTEX <Text style={styles.brandAccent}>METRICS</Text>
          </Text>
          <Text style={styles.tag}>Analytics report</Text>
        </View>

        <Text style={styles.title}>{data.organizationName}</Text>
        <Text style={styles.subtitle}>Revenue, orders and acquisition · {data.rangeLabel}</Text>
        <Text style={styles.meta}>
          Currency {data.currency} · Timezone {data.timezone} · Paid revenue only · Grouped by{" "}
          {data.granularity} · Generated {data.generatedAt}
        </Text>

        <SectionTitle>01 / Key figures</SectionTitle>
        <View style={styles.kpiRow}>
          {data.kpis.map((kpi, index) => (
            <View
              key={kpi.label}
              style={index === data.kpis.length - 1 ? styles.kpiLast : styles.kpi}
            >
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiDelta}>{kpi.delta}</Text>
            </View>
          ))}
        </View>

        <SectionTitle>02 / {`Revenue by ${data.granularity}`}</SectionTitle>
        <View style={styles.tableHead}>
          <Text style={[styles.th, styles.grow]}>Period</Text>
          <Text style={[styles.th, styles.num]}>Revenue</Text>
          <Text style={[styles.th, styles.numSmall]}>Orders</Text>
        </View>
        {data.revenueRows.length === 0 ? (
          <Text style={styles.empty}>No orders in this period.</Text>
        ) : (
          data.revenueRows.map((row) => (
            <View key={row.bucket} style={styles.tr} wrap={false}>
              <Text style={[styles.td, styles.grow]}>{row.bucket}</Text>
              <Text style={[styles.td, styles.num]}>{row.revenue}</Text>
              <Text style={[styles.tdMuted, styles.numSmall]}>{row.orders}</Text>
            </View>
          ))
        )}

        <View style={styles.twoCols} wrap={false}>
          <View style={styles.col}>
            <SectionTitle>03 / Top products</SectionTitle>
            <View style={styles.tableHead}>
              <Text style={[styles.th, styles.grow]}>Product</Text>
              <Text style={[styles.th, styles.num]}>Revenue</Text>
            </View>
            {data.topProducts.length === 0 ? (
              <Text style={styles.empty}>No product revenue in this period.</Text>
            ) : (
              data.topProducts.map((product) => (
                <View key={product.sku + product.name} style={styles.tr} wrap={false}>
                  <View style={styles.grow}>
                    <Text style={styles.td}>{product.name}</Text>
                    <Text style={styles.tdMuted}>
                      {product.sku} · {product.units} units
                    </Text>
                  </View>
                  <Text style={[styles.td, styles.num]}>{product.revenue}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.colRight}>
            <SectionTitle>04 / Orders by status</SectionTitle>
            {data.statusRows.map((row) => (
              <View key={row.label} style={styles.summaryRow} wrap={false}>
                <Text style={styles.summaryLabel}>
                  {row.label} · {row.share}
                </Text>
                <Text style={styles.summaryValue}>{row.count}</Text>
              </View>
            ))}

            <SectionTitle>05 / Acquisition</SectionTitle>
            {data.summary.map((row) => (
              <View key={row.label} style={styles.summaryRow} wrap={false}>
                <Text style={styles.summaryLabel}>{row.label}</Text>
                <Text style={styles.summaryValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>
            Vortex Metrics · {data.organizationSlug} · Figures from PostgreSQL
          </Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderAnalyticsReport(data: AnalyticsReportData): Promise<Buffer> {
  return renderToBuffer(<AnalyticsReport data={data} />);
}
