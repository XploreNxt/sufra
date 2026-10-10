import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { RiderHeader } from "@/components/rider/RiderHeader";
import { MemoRouteMap } from "@/components/tracking/RouteMap";
import { useRider } from "@/context/RiderContext";
import type { RiderTabParamList } from "@/navigation/types";
import type { RiderTrip } from "@/types/rider";
import { formatPrice } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

const MAP_HEIGHT = 190;
type StepState = "current" | "done" | "upcoming";

/** Order management: the active delivery, with pickup and dropoff steps. */
export function RiderDeliveryScreen() {
  const { active, confirmPickup, confirmDelivery } = useRider();
  const navigation = useNavigation<BottomTabNavigationProp<RiderTabParamList>>();
  const { width } = useWindowDimensions();
  const [lastTrip, setLastTrip] = useState<RiderTrip | null>(null);

  if (!active) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <RiderHeader title="Order Management" subtitle="Pickup & dropoff" />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {lastTrip ? (
            <View style={styles.doneCard}>
              <Ionicons name="checkmark-circle" size={spacing.iconXLarge} color={colors.primary} />
              <Text style={styles.doneTitle}>Delivery complete</Text>
              <Text style={styles.doneSub}>
                {lastTrip.id} · {lastTrip.restaurantName}
              </Text>
              <Text style={styles.doneEarned}>{formatPrice(lastTrip.basePay + lastTrip.tip)}</Text>
              <Text style={styles.doneSub}>
                {formatPrice(lastTrip.basePay)} base pay + {formatPrice(lastTrip.tip)} tip
              </Text>
            </View>
          ) : (
            <View style={styles.doneCard}>
              <Ionicons name="bicycle-outline" size={spacing.iconXLarge} color={colors.muted} />
              <Text style={styles.doneTitle}>No active delivery</Text>
              <Text style={styles.doneSub}>Accept a job from the dashboard to start a delivery.</Text>
            </View>
          )}
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Jobs")} style={styles.primaryBtn}>
            <Text style={styles.primaryText}>Find jobs</Text>
            <Ionicons name="arrow-forward" size={spacing.iconSmall} color={colors.white} />
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const { job, stage } = active;
  const pickedUp = stage === "to_dropoff";
  const isCash = job.paymentMethod === "cash";

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <RiderHeader title="Order Management" subtitle={`${job.id} · ${pickedUp ? "Heading to customer" : "Heading to pickup"}`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mapCard}>
          <MemoRouteMap
            width={width - spacing.pageHorizontal * 2}
            height={MAP_HEIGHT}
            progress={pickedUp ? 0.55 : 0}
            label={`Route from ${job.restaurantName} to ${job.customerName}`}
          />
          <View style={styles.mapMeta}>
            <Meta icon="navigate-outline" text={`${job.distanceKm.toFixed(1)} km`} />
            <Meta icon="time-outline" text={`${job.etaMinutes} min`} />
            <Meta icon="wallet-outline" text={`${formatPrice(job.basePay)} + tip`} />
          </View>
        </View>

        <StepCard number={1} title="Pickup details" state={pickedUp ? "done" : "current"}>
          <Detail icon="restaurant" title={job.restaurantName} text={job.pickupAddress} />
          <View style={styles.itemsBox}>
            <Text style={styles.itemsTitle}>Order {job.id}</Text>
            {job.items.map((item) => (
              <Text key={item.name} style={styles.itemLine}>
                {item.quantity} × {item.name}
              </Text>
            ))}
          </View>
          {pickedUp ? (
            <DoneLine text="Order picked up" />
          ) : (
            <Pressable accessibilityRole="button" onPress={confirmPickup} style={styles.primaryBtn}>
              <Text style={styles.primaryText}>Confirm pickup</Text>
            </Pressable>
          )}
        </StepCard>

        <StepCard number={2} title="Dropoff details" state={pickedUp ? "current" : "upcoming"}>
          <Detail icon="home" title={job.customerName} text={job.dropoffAddress} />
          <View style={[styles.payBox, isCash && styles.payBoxCash]}>
            <Ionicons
              name={isCash ? "cash-outline" : "card-outline"}
              size={spacing.icon}
              color={isCash ? colors.accent : colors.primary}
            />
            <Text style={styles.payText}>
              {isCash ? `Collect ${formatPrice(job.orderTotal)} in cash` : "Paid online. Nothing to collect."}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={!pickedUp}
            onPress={() => setLastTrip(confirmDelivery())}
            style={[styles.primaryBtn, styles.deliverBtn, !pickedUp && styles.btnDisabled]}
          >
            <Text style={styles.primaryText}>Confirm delivery</Text>
          </Pressable>
          {!pickedUp ? <Text style={styles.note}>Confirm the pickup first.</Text> : null}
        </StepCard>
      </ScrollView>
    </View>
  );
}

function StepCard({
  number,
  title,
  state,
  children,
}: {
  number: number;
  title: string;
  state: StepState;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.stepCard, state === "current" && styles.stepCardCurrent, state === "upcoming" && styles.stepCardUpcoming]}>
      <View style={styles.stepHead}>
        <View style={[styles.stepBadge, state !== "upcoming" && styles.stepBadgeActive]}>
          {state === "done" ? (
            <Ionicons name="checkmark" size={spacing.iconSmall} color={colors.white} />
          ) : (
            <Text style={[styles.stepNumber, state === "current" && styles.stepNumberActive]}>{number}</Text>
          )}
        </View>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Detail({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={spacing.icon} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.detailTitle}>{title}</Text>
        <Text style={styles.detailText}>{text}</Text>
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

function DoneLine({ text }: { text: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name="checkmark-circle" size={spacing.icon} color={colors.primary} />
      <Text style={styles.doneLineText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageHorizontal, paddingBottom: spacing.xxxl, gap: spacing.md },
  mapCard: {
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
  },
  mapMeta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, padding: spacing.md },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metaText: { color: colors.textSecondary, fontSize: typography.small, fontWeight: typography.weightSemibold },
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
    gap: spacing.md,
  },
  stepCardCurrent: { borderColor: colors.primary },
  stepCardUpcoming: { opacity: 0.75 },
  stepHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNumber: { color: colors.textSecondary, fontSize: typography.small, fontWeight: typography.weightBold },
  stepNumberActive: { color: colors.white },
  stepTitle: { color: colors.text, fontSize: typography.bodyLarge, fontWeight: typography.weightBold },
  detail: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  detailTitle: { color: colors.text, fontSize: typography.body, fontWeight: typography.weightBold },
  detailText: { color: colors.textSecondary, fontSize: typography.small, marginTop: 2 },
  itemsBox: { backgroundColor: colors.background, borderRadius: radii.md, padding: spacing.md, gap: spacing.xxs },
  itemsTitle: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: typography.weightBold },
  itemLine: { color: colors.text, fontSize: typography.small },
  payBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  payBoxCash: { backgroundColor: colors.accentLight },
  payText: { flex: 1, color: colors.text, fontSize: typography.small, fontWeight: typography.weightBold },
  primaryBtn: {
    minHeight: spacing.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  deliverBtn: { backgroundColor: colors.accent },
  btnDisabled: { opacity: 0.45 },
  primaryText: { color: colors.white, fontSize: typography.body, fontWeight: typography.weightBold },
  note: { color: colors.textSecondary, fontSize: typography.caption },
  doneLineText: { color: colors.primaryDark, fontSize: typography.small, fontWeight: typography.weightBold },
  doneCard: {
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
  },
  doneTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weightBold, marginTop: spacing.xs },
  doneSub: { color: colors.textSecondary, fontSize: typography.small, textAlign: "center" },
  doneEarned: { color: colors.primaryDark, fontSize: typography.display, fontWeight: typography.weightHeavy, marginTop: spacing.sm },
});
