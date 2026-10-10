import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { RiderHeader } from "@/components/rider/RiderHeader";
import { MemoRouteMap } from "@/components/tracking/RouteMap";
import { useRider } from "@/context/RiderContext";
import type { RiderTabParamList } from "@/navigation/types";
import type { RiderJob } from "@/types/rider";
import { formatPrice } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

const MAP_HEIGHT = 170;

/** Rider dashboard: go online, preview the next route, accept or decline jobs. */
export function RiderJobsScreen() {
  const { online, setOnline, jobs, active, acceptJob, declineJob } = useRider();
  const navigation = useNavigation<BottomTabNavigationProp<RiderTabParamList>>();
  const { width } = useWindowDimensions();
  const mapWidth = width - spacing.pageHorizontal * 2;
  const nextJob = jobs[0];

  function accept(job: RiderJob) {
    acceptJob(job.id);
    navigation.navigate("Delivery");
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <RiderHeader
        title="Rider Dashboard"
        subtitle={online ? `${jobs.length} ${jobs.length === 1 ? "job" : "jobs"} available near you` : "You are offline"}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusCard, !online && styles.statusCardOff]}>
          <View style={[styles.statusDot, !online && styles.statusDotOff]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>{online ? "You are online" : "You are offline"}</Text>
            <Text style={styles.statusSub}>
              {online ? "New delivery jobs will appear here." : "Go online to receive delivery jobs."}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Online status"
            value={online}
            onValueChange={setOnline}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        {active ? (
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Delivery")} style={styles.activeBanner}>
            <Ionicons name="navigate" size={spacing.icon} color={colors.white} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeTitle}>Delivery in progress</Text>
              <Text style={styles.activeSub} numberOfLines={1}>
                {active.job.id} · {active.job.restaurantName}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={spacing.icon} color={colors.white} />
          </Pressable>
        ) : null}

        {!online ? (
          <EmptyState icon="moon-outline" title="You are offline" text="Switch on the toggle above when you are ready to deliver." />
        ) : !nextJob ? (
          <EmptyState icon="time-outline" title="No jobs right now" text="Stay online. New jobs will show up here as orders come in." />
        ) : (
          <>
            <View style={styles.mapCard}>
              <MemoRouteMap
                width={mapWidth}
                height={MAP_HEIGHT}
                progress={0}
                label={`Route preview from ${nextJob.restaurantName} to the customer`}
              />
              <View style={styles.mapCaption}>
                <Ionicons name="map-outline" size={spacing.iconSmall} color={colors.textSecondary} />
                <Text style={styles.mapCaptionText} numberOfLines={1}>
                  Route preview · {nextJob.restaurantName}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Available jobs</Text>
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                busy={active !== null}
                onAccept={() => accept(job)}
                onDecline={() => declineJob(job.id)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function JobCard({
  job,
  busy,
  onAccept,
  onDecline,
}: {
  job: RiderJob;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <View style={styles.jobCard}>
      <View style={styles.jobHead}>
        <Text style={styles.jobId}>{job.id}</Text>
        <View style={styles.payout}>
          <Text style={styles.payoutValue}>{formatPrice(job.basePay)}</Text>
          <Text style={styles.payoutTip}>+ {formatPrice(job.tipEstimate)} tip est.</Text>
        </View>
      </View>

      <View style={styles.stops}>
        <Stop icon="restaurant" label="Pickup" title={job.restaurantName} address={job.pickupAddress} />
        <View style={styles.stopLine} />
        <Stop icon="home" label="Dropoff" title={job.customerName} address={job.dropoffAddress} accent />
      </View>

      <View style={styles.metaRow}>
        <Meta icon="navigate-outline" text={`${job.distanceKm.toFixed(1)} km`} />
        <Meta icon="time-outline" text={`${job.etaMinutes} min`} />
        <Meta
          icon={job.paymentMethod === "cash" ? "cash-outline" : "card-outline"}
          text={job.paymentMethod === "cash" ? "Cash on delivery" : "Paid online"}
        />
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Decline job ${job.id}`} onPress={onDecline} style={styles.declineBtn}>
          <Text style={styles.declineText}>Decline</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Accept job ${job.id}`}
          disabled={busy}
          onPress={onAccept}
          style={[styles.acceptBtn, busy && styles.btnDisabled]}
        >
          <Text style={styles.acceptText}>Accept</Text>
        </Pressable>
      </View>
      {busy ? <Text style={styles.busyNote}>Finish your current delivery before accepting another job.</Text> : null}
    </View>
  );
}

function Stop({
  icon,
  label,
  title,
  address,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  title: string;
  address: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.stop}>
      <View style={[styles.stopIcon, accent && styles.stopIconAccent]}>
        <Ionicons name={icon} size={spacing.iconSmall} color={accent ? colors.white : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.stopLabel}>{label}</Text>
        <Text style={styles.stopTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.stopAddress} numberOfLines={1}>{address}</Text>
      </View>
    </View>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={spacing.iconSmall} color={colors.textSecondary} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function EmptyState({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={spacing.iconXLarge} color={colors.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageHorizontal, paddingBottom: spacing.xxxl, gap: spacing.md },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: spacing.borderHairline,
    borderColor: colors.primary,
  },
  statusCardOff: { backgroundColor: colors.surface, borderColor: colors.border },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  statusDotOff: { backgroundColor: colors.muted },
  statusTitle: { color: colors.text, fontSize: typography.bodyLarge, fontWeight: typography.weightBold },
  statusSub: { color: colors.textSecondary, fontSize: typography.small, marginTop: 2 },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primaryDark,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  activeTitle: { color: colors.white, fontSize: typography.body, fontWeight: typography.weightBold },
  activeSub: { color: "rgba(255,255,255,0.8)", fontSize: typography.small, marginTop: 2 },
  mapCard: {
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
  },
  mapCaption: { flexDirection: "row", alignItems: "center", gap: spacing.xs, padding: spacing.md },
  mapCaptionText: { flex: 1, color: colors.textSecondary, fontSize: typography.small, fontWeight: typography.weightSemibold },
  sectionTitle: { marginTop: spacing.sm, color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weightBold },
  jobCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
    gap: spacing.md,
  },
  jobHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  jobId: { color: colors.textSecondary, fontSize: typography.small, fontWeight: typography.weightBold },
  payout: { alignItems: "flex-end" },
  payoutValue: { color: colors.primaryDark, fontSize: typography.subtitle, fontWeight: typography.weightHeavy },
  payoutTip: { color: colors.accent, fontSize: typography.caption, fontWeight: typography.weightBold },
  stops: { gap: spacing.xs },
  stop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  stopIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stopIconAccent: { backgroundColor: colors.accent },
  stopLine: { width: 2, height: spacing.md, marginLeft: 15, backgroundColor: colors.border },
  stopLabel: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: typography.weightSemibold },
  stopTitle: { color: colors.text, fontSize: typography.body, fontWeight: typography.weightBold },
  stopAddress: { color: colors.textSecondary, fontSize: typography.small },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metaText: { color: colors.textSecondary, fontSize: typography.small, fontWeight: typography.weightSemibold },
  actions: { flexDirection: "row", gap: spacing.sm },
  declineBtn: {
    flex: 1,
    minHeight: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    borderWidth: spacing.borderHairline,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  declineText: { color: colors.danger, fontSize: typography.body, fontWeight: typography.weightBold },
  acceptBtn: {
    flex: 2,
    minHeight: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  acceptText: { color: colors.white, fontSize: typography.body, fontWeight: typography.weightBold },
  btnDisabled: { opacity: 0.45 },
  busyNote: { color: colors.textSecondary, fontSize: typography.caption },
  empty: {
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
  },
  emptyTitle: { color: colors.text, fontSize: typography.bodyLarge, fontWeight: typography.weightBold, marginTop: spacing.xs },
  emptyText: { color: colors.textSecondary, fontSize: typography.small, textAlign: "center" },
});
