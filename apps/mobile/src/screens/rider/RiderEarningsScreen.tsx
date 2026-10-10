import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { RiderHeader } from "@/components/rider/RiderHeader";
import { useRider } from "@/context/RiderContext";
import type { RiderEarningsRange, RiderTrip } from "@/types/rider";
import { formatPrice } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

const RANGES: Array<{ key: RiderEarningsRange; label: string }> = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
];

const DAY_MS = 86_400_000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const RECENT_LIMIT = 6;

function startOfDay(time: number) {
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const earned = (t: RiderTrip) => t.basePay + t.tip;

/** Daily and weekly earnings: totals, base pay vs tips, and recent deliveries. */
export function RiderEarningsScreen() {
  const { trips } = useRider();
  const [range, setRange] = useState<RiderEarningsRange>("today");

  // The last seven calendar days, oldest first, each with its own totals.
  const week = useMemo(() => {
    const today = startOfDay(Date.now());
    return Array.from({ length: 7 }, (_, i) => {
      const from = today - (6 - i) * DAY_MS;
      const dayTrips = trips.filter((t) => startOfDay(new Date(t.deliveredAt).getTime()) === from);
      return {
        label: WEEKDAYS[new Date(from).getDay()],
        trips: dayTrips,
        total: dayTrips.reduce((n, t) => n + earned(t), 0),
      };
    });
  }, [trips]);

  const inRange = range === "today" ? week[6].trips : week.flatMap((d) => d.trips);
  const basePay = inRange.reduce((n, t) => n + t.basePay, 0);
  const tips = inRange.reduce((n, t) => n + t.tip, 0);
  const total = basePay + tips;
  const perTrip = inRange.length > 0 ? Math.round(total / inRange.length) : 0;
  const maxDay = Math.max(1, ...week.map((d) => d.total));
  const recent = [...inRange]
    .sort((a, b) => b.deliveredAt.localeCompare(a.deliveredAt))
    .slice(0, RECENT_LIMIT);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <RiderHeader title="Earnings" subtitle="Base pay + tips" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.rangeRow}>
          {RANGES.map((r) => (
            <Pressable key={r.key} onPress={() => setRange(r.key)} style={[styles.rangeChip, range === r.key && styles.rangeChipActive]}>
              <Text style={[styles.rangeText, range === r.key && styles.rangeTextActive]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>{range === "today" ? "Today's earnings" : "Earnings, last 7 days"}</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          <Text style={styles.totalSub}>
            {inRange.length} {inRange.length === 1 ? "delivery" : "deliveries"}
          </Text>
        </View>

        <View style={styles.kpiRow}>
          <Kpi label="Base pay" value={formatPrice(basePay)} />
          <Kpi label="Tips" value={formatPrice(tips)} accent />
          <Kpi label="Per delivery" value={formatPrice(perTrip)} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeadRow}>
            <Text style={styles.cardTitle}>Daily earnings</Text>
            <Text style={styles.cardMeta}>Last 7 days</Text>
          </View>
          <View style={styles.chart}>
            {week.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, i === 6 && styles.barToday, { height: `${(d.total / maxDay) * 100}%` }]} />
                </View>
                <Text style={[styles.barLabel, i === 6 && styles.barLabelToday]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent deliveries</Text>
          {recent.length === 0 ? (
            <Text style={styles.empty}>No deliveries in this period yet.</Text>
          ) : (
            recent.map((t) => (
              <View key={t.id} style={styles.tripRow}>
                <View style={styles.tripIcon}>
                  <Ionicons name="bicycle" size={spacing.iconSmall} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tripTitle} numberOfLines={1}>{t.restaurantName}</Text>
                  <Text style={styles.tripSub} numberOfLines={1}>
                    {t.dropoffAddress} · {t.distanceKm.toFixed(1)} km
                  </Text>
                </View>
                <View style={styles.tripPay}>
                  <Text style={styles.tripTotal}>{formatPrice(earned(t))}</Text>
                  <Text style={styles.tripTip}>{t.tip > 0 ? `incl. ${formatPrice(t.tip)} tip` : "no tip"}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, accent && { color: colors.accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageHorizontal, gap: spacing.md, paddingBottom: spacing.xxxl },
  rangeRow: { flexDirection: "row", gap: spacing.sm },
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
  totalCard: { backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing.xl },
  totalLabel: { color: "rgba(255,255,255,0.8)", fontSize: typography.small, fontWeight: typography.weightSemibold },
  totalValue: { color: colors.white, fontSize: typography.display, fontWeight: typography.weightHeavy, marginTop: spacing.xxs },
  totalSub: { color: "rgba(255,255,255,0.8)", fontSize: typography.small, marginTop: 2 },
  kpiRow: { flexDirection: "row", gap: spacing.sm },
  kpi: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
  },
  kpiLabel: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: typography.weightSemibold },
  kpiValue: { color: colors.text, fontSize: typography.bodyLarge, fontWeight: typography.weightHeavy, marginTop: spacing.xxs },
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
  chart: { flexDirection: "row", alignItems: "flex-end", height: 140, gap: spacing.sm },
  barCol: { flex: 1, alignItems: "center", height: "100%" },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end", alignItems: "center" },
  bar: { width: "60%", minHeight: 2, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: colors.primary },
  barToday: { backgroundColor: colors.accent },
  barLabel: { color: colors.textSecondary, fontSize: typography.caption, marginTop: spacing.xxs },
  barLabelToday: { color: colors.text, fontWeight: typography.weightBold },
  empty: { color: colors.textSecondary, fontSize: typography.small, textAlign: "center", paddingVertical: spacing.lg },
  tripRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  tripIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  tripTitle: { color: colors.text, fontSize: typography.small, fontWeight: typography.weightBold },
  tripSub: { color: colors.textSecondary, fontSize: typography.caption, marginTop: 2 },
  tripPay: { alignItems: "flex-end" },
  tripTotal: { color: colors.text, fontSize: typography.small, fontWeight: typography.weightBold },
  tripTip: { color: colors.textSecondary, fontSize: typography.caption },
});
