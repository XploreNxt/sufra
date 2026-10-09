import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { VendorHeader } from "@/components/vendor/VendorHeader";
import { COMMISSION_RATE } from "@/data/mockVendor";
import { useVendor } from "@/context/VendorContext";
import type { EarningsRange, VendorSale } from "@/types/vendor";
import { formatPrice } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

const RANGES: Array<{ key: EarningsRange; label: string; days: number }> = [
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
];

const DAY_MS = 86_400_000;
// Mock "now" matches the mock sales window so ranges have data.
const NOW = Date.UTC(2026, 9, 9, 15);

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
}

/** Earnings & Reports: KPIs, sales vs net chart, top items, commission summary. */
export function VendorEarningsScreen() {
  const { sales } = useVendor();
  const [range, setRange] = useState<EarningsRange>("7d");
  const days = RANGES.find((r) => r.key === range)!.days;

  const inRange = useMemo(
    () => sales.filter((s) => NOW - new Date(s.deliveredAt).getTime() < days * DAY_MS),
    [sales, days]
  );

  const food = (s: VendorSale) => s.subtotal - s.vendorPromo;
  const gross = inRange.reduce((n, s) => n + food(s), 0);
  const promos = inRange.reduce((n, s) => n + s.vendorPromo, 0);
  const commission = (gross * COMMISSION_RATE) / 100;
  const net = gross - commission;

  // Daily Sales vs Net for the chart (oldest → newest).
  const daily = useMemo(() => {
    const map = new Map<string, { gross: number; net: number }>();
    for (const s of inRange) {
      const k = dayKey(s.deliveredAt);
      const cur = map.get(k) ?? { gross: 0, net: 0 };
      cur.gross += food(s);
      cur.net += food(s) * (1 - COMMISSION_RATE / 100);
      map.set(k, cur);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ day: k.slice(5), ...v }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inRange]);

  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; sales: number }>();
    for (const s of inRange) {
      for (const it of s.items) {
        const cur = map.get(it.name) ?? { name: it.name, qty: 0, sales: 0 };
        cur.qty += it.quantity;
        cur.sales += it.quantity * it.price;
        map.set(it.name, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [inRange]);

  const maxGross = Math.max(1, ...daily.map((d) => d.gross));

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <VendorHeader title="Earnings & Reports" subtitle="Net payout = food sales − commission" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.rangeRow}>
          {RANGES.map((r) => (
            <Pressable key={r.key} onPress={() => setRange(r.key)} style={[styles.rangeChip, range === r.key && styles.rangeChipActive]}>
              <Text style={[styles.rangeText, range === r.key && styles.rangeTextActive]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.kpiGrid}>
          <Kpi label="Net payout" value={formatPrice(net)} sub={`${inRange.length} orders`} tone="primary" />
          <Kpi label="Food sales" value={formatPrice(gross)} sub="before commission" tone="light" />
          <Kpi label={`Commission (${COMMISSION_RATE}%)`} value={`−${formatPrice(commission)}`} sub="platform fee" tone="accent" />
          <Kpi label="Vendor promos" value={formatPrice(promos)} sub="discounts you funded" tone="light" />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeadRow}>
            <Text style={styles.cardTitle}>Sales vs Net</Text>
            <Text style={styles.cardMeta}>Daily</Text>
          </View>
          {daily.length === 0 ? (
            <Text style={styles.empty}>No sales in this period.</Text>
          ) : (
            <View style={styles.chart}>
              {daily.map((d) => (
                <View key={d.day} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, styles.barGross, { height: `${(d.gross / maxGross) * 100}%` }]} />
                    <View style={[styles.bar, styles.barNet, { height: `${(d.net / maxGross) * 100}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{d.day}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.legend}>
            <Legend color={colors.primary} label="Food sales" />
            <Legend color={colors.accent} label="Your net" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top selling items</Text>
          {topItems.length === 0 ? (
            <Text style={styles.empty}>No sales in this period.</Text>
          ) : (
            topItems.map((it, i) => (
              <View key={it.name} style={styles.itemRow}>
                <View style={styles.rank}>
                  <Text style={styles.rankText}>{i + 1}</Text>
                </View>
                <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                <Text style={styles.itemQty}>{it.qty} sold</Text>
                <Text style={styles.itemSales}>{formatPrice(it.sales)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Commission summary</Text>
          <SummaryRow label="Food sales" value={formatPrice(gross)} />
          <SummaryRow label="Vendor promos" value={formatPrice(promos)} />
          <SummaryRow label={`Commission (${COMMISSION_RATE}%)`} value={`−${formatPrice(commission)}`} tone="accent" />
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Net payout</Text>
            <Text style={styles.totalValue}>{formatPrice(net)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "primary" | "accent" | "light" }) {
  const bg = tone === "primary" ? colors.primary : tone === "accent" ? colors.accent : colors.surface;
  const fg = tone === "light" ? colors.text : colors.white;
  const sec = tone === "light" ? colors.textSecondary : "rgba(255,255,255,0.8)";
  return (
    <View style={[styles.kpi, { backgroundColor: bg, borderColor: tone === "light" ? colors.border : bg }]}>
      <Text style={[styles.kpiLabel, { color: sec }]}>{label}</Text>
      <Text style={[styles.kpiValue, { color: fg }]}>{value}</Text>
      <Text style={[styles.kpiSub, { color: sec }]}>{sub}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function SummaryRow({ label, value, tone }: { label: string; value: string; tone?: "accent" }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, tone === "accent" && { color: colors.accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageHorizontal, gap: spacing.md, paddingBottom: spacing.xxxl },
  rangeRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  rangeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
  },
  rangeChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  rangeText: { color: colors.text, fontSize: typography.small, fontWeight: typography.weightSemibold },
  rangeTextActive: { color: colors.white },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  kpi: {
    width: "48.5%",
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: spacing.borderHairline,
  },
  kpiLabel: { fontSize: typography.caption, fontWeight: typography.weightSemibold },
  kpiValue: { fontSize: typography.subtitle, fontWeight: typography.weightHeavy, marginTop: spacing.xxs },
  kpiSub: { fontSize: typography.caption, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardHeadRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: colors.text, fontSize: typography.bodyLarge, fontWeight: typography.weightBold },
  cardMeta: { color: colors.textSecondary, fontSize: typography.caption },
  empty: { color: colors.textSecondary, fontSize: typography.small, textAlign: "center", paddingVertical: spacing.lg },
  chart: { flexDirection: "row", alignItems: "flex-end", height: 160, gap: spacing.xs },
  barCol: { flex: 1, alignItems: "center", height: "100%" },
  barTrack: { flex: 1, width: "100%", flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 2 },
  bar: { width: "40%", borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barGross: { backgroundColor: colors.primary },
  barNet: { backgroundColor: colors.accent },
  barLabel: { color: colors.textSecondary, fontSize: 10, marginTop: spacing.xxs },
  legend: { flexDirection: "row", gap: spacing.lg },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: typography.weightSemibold },
  itemRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { color: colors.primaryDark, fontSize: typography.caption, fontWeight: typography.weightBold },
  itemName: { flex: 1, color: colors.text, fontSize: typography.small, fontWeight: typography.weightSemibold },
  itemQty: { color: colors.textSecondary, fontSize: typography.caption },
  itemSales: { color: colors.text, fontSize: typography.small, fontWeight: typography.weightBold, width: 84, textAlign: "right" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { color: colors.textSecondary, fontSize: typography.small },
  summaryValue: { color: colors.text, fontSize: typography.small, fontWeight: typography.weightSemibold },
  summaryTotal: {
    borderTopWidth: spacing.borderHairline,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  totalLabel: { color: colors.text, fontSize: typography.body, fontWeight: typography.weightBold },
  totalValue: { color: colors.primaryDark, fontSize: typography.subtitle, fontWeight: typography.weightHeavy },
});
