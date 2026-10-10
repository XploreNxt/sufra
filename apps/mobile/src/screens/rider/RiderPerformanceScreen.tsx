import React, { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { RiderHeader } from "@/components/rider/RiderHeader";
import { RIDER_VEHICLE, WEEKLY_STATS } from "@/data/mockRider";
import { useRider } from "@/context/RiderContext";
import { formatPrice } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

const WEEK_MS = 7 * 86_400_000;
const STARS = [1, 2, 3, 4, 5];

/** Weekly performance: deliveries, distance, acceptance, on-time rate and rating. */
export function RiderPerformanceScreen() {
  const { trips, offers } = useRider();

  const week = useMemo(() => {
    const since = Date.now() - WEEK_MS;
    const recent = trips.filter((t) => new Date(t.deliveredAt).getTime() >= since);
    return {
      deliveries: recent.length,
      distanceKm: recent.reduce((n, t) => n + t.distanceKm, 0),
      earned: recent.reduce((n, t) => n + t.basePay + t.tip, 0),
    };
  }, [trips]);

  const offered = offers.accepted + offers.declined;
  const acceptanceRate = offered > 0 ? Math.round((offers.accepted / offered) * 100) : 0;
  const perHour = Math.round(week.earned / WEEKLY_STATS.onlineHours);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <RiderHeader title="Performance" subtitle="Your last 7 days" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statGrid}>
          <Stat icon="bicycle" label="Deliveries" value={String(week.deliveries)} />
          <Stat icon="navigate" label="Distance" value={`${week.distanceKm.toFixed(1)} km`} />
          <Stat icon="time" label="Online" value={`${WEEKLY_STATS.onlineHours} h`} />
          <Stat icon="wallet" label="Per online hour" value={formatPrice(perHour)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Performance metrics</Text>
          <Meter
            label="Acceptance rate"
            value={acceptanceRate}
            note={`${offers.accepted} of ${offered} jobs accepted`}
          />
          <Meter label="On-time deliveries" value={WEEKLY_STATS.onTimeRate} note="Delivered within the promised time" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer rating</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingValue}>{WEEKLY_STATS.rating.toFixed(1)}</Text>
            <View>
              <View style={styles.stars}>
                {STARS.map((n) => (
                  <Ionicons
                    key={n}
                    name={
                      WEEKLY_STATS.rating >= n
                        ? "star"
                        : WEEKLY_STATS.rating >= n - 0.5
                          ? "star-half"
                          : "star-outline"
                    }
                    size={spacing.icon}
                    color={colors.star}
                  />
                ))}
              </View>
              <Text style={styles.ratingSub}>Based on {WEEKLY_STATS.ratingCount} ratings</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rider details</Text>
          <Row label="Vehicle" value={RIDER_VEHICLE} />
          <Row label="Earnings, last 7 days" value={formatPrice(week.earned)} />
          <Row label="Jobs declined" value={String(offers.declined)} />
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={spacing.iconSmall} color={colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Meter({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <View style={styles.meter}>
      <View style={styles.meterHead}>
        <Text style={styles.meterLabel}>{label}</Text>
        <Text style={styles.meterValue}>{value}%</Text>
      </View>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${Math.min(100, Math.max(0, value))}%` }]} />
      </View>
      <Text style={styles.meterNote}>{note}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageHorizontal, gap: spacing.md, paddingBottom: spacing.xxxl },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  stat: {
    width: "48.5%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weightHeavy, marginTop: spacing.sm },
  statLabel: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: typography.weightSemibold, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: { color: colors.text, fontSize: typography.bodyLarge, fontWeight: typography.weightBold },
  meter: { gap: spacing.xs },
  meterHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meterLabel: { color: colors.text, fontSize: typography.small, fontWeight: typography.weightSemibold },
  meterValue: { color: colors.primaryDark, fontSize: typography.body, fontWeight: typography.weightHeavy },
  meterTrack: { height: 8, borderRadius: radii.pill, backgroundColor: colors.primaryLight, overflow: "hidden" },
  meterFill: { height: "100%", borderRadius: radii.pill, backgroundColor: colors.primary },
  meterNote: { color: colors.textSecondary, fontSize: typography.caption },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  ratingValue: { color: colors.text, fontSize: typography.display, fontWeight: typography.weightHeavy },
  stars: { flexDirection: "row", gap: spacing.xxs },
  ratingSub: { color: colors.textSecondary, fontSize: typography.caption, marginTop: spacing.xxs },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { color: colors.textSecondary, fontSize: typography.small },
  rowValue: { color: colors.text, fontSize: typography.small, fontWeight: typography.weightSemibold },
});
