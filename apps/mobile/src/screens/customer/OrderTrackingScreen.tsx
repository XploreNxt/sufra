import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { MemoRouteMap } from "@/components/tracking/RouteMap";
import { useOrder } from "@/context/OrderContext";
import type { CustomerTabParamList } from "@/navigation/types";
import { formatPrice } from "@/types";
import type { ActiveOrder } from "@/types";
import { animation, colors, radii, spacing, typography } from "@/theme";

type Props = BottomTabScreenProps<CustomerTabParamList, "Orders">;
type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface Stage {
  id: string;
  title: string;
  detail: string;
  icon: IconName;
  /** Share of the delivery time at which this stage begins, from 0 to 1. */
  startsAt: number;
}

const ESTIMATED_DELIVERY_MINUTES = 30;
const RIDE_STARTS_AT = 0.5;

const stages: Stage[] = [
  {
    id: "confirmed",
    title: "Order confirmed",
    detail: "The restaurant has your order.",
    icon: "checkmark-circle",
    startsAt: 0,
  },
  {
    id: "preparing",
    title: "Preparing your food",
    detail: "Freshly made, just for you.",
    icon: "restaurant",
    startsAt: 0.1,
  },
  {
    id: "on-the-way",
    title: "Rider is on the way",
    detail: "Your order has been picked up.",
    icon: "bicycle",
    startsAt: RIDE_STARTS_AT,
  },
  {
    id: "delivered",
    title: "Delivered",
    detail: "Enjoy your meal!",
    icon: "home",
    startsAt: 1,
  },
];

function progressOf(order: ActiveOrder, now: number): number {
  return Math.min(Math.max((now - order.placedAt) / animation.deliveryDemoMs, 0), 1);
}

export function OrderTrackingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isFocused = useIsFocused();
  const { activeOrder, clearOrder } = useOrder();
  const [now, setNow] = useState(() => Date.now());

  const progress = activeOrder ? progressOf(activeOrder, now) : 0;
  const delivered = progress >= 1;

  useEffect(() => {
    if (!activeOrder || !isFocused || delivered) return;

    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), animation.trackingTickMs);
    return () => clearInterval(interval);
  }, [activeOrder, delivered, isFocused]);

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.headerTitle}>Live order tracking</Text>
    </View>
  );

  if (!activeOrder) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" backgroundColor={colors.primary} />
        {header}
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bicycle" size={spacing.iconXLarge} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No order on the way</Text>
          <Text style={styles.emptyMessage}>
            Place an order and you can follow it here, from the kitchen to your door.
          </Text>
          <Pressable
            accessibilityLabel="Browse the menu"
            accessibilityRole="button"
            onPress={() => navigation.navigate("Home")}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Browse the menu</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const currentIndex = stages.reduce(
    (current, stage, index) => (progress >= stage.startsAt ? index : current),
    0,
  );
  const currentStage = stages[currentIndex];
  const minutesLeft = Math.max(Math.ceil((1 - progress) * ESTIMATED_DELIVERY_MINUTES), 1);
  const rideProgress = Math.max((progress - RIDE_STARTS_AT) / (1 - RIDE_STARTS_AT), 0);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" backgroundColor={colors.primary} />
      {header}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <MemoRouteMap
            height={spacing.trackingMapHeight}
            progress={rideProgress}
            width={width}
          />
          <View style={styles.addressPill}>
            <Ionicons name="location" size={spacing.iconSmall} color={colors.accent} />
            <Text numberOfLines={1} style={styles.addressText}>
              {activeOrder.restaurantName} to {activeOrder.address}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View accessibilityLiveRegion="polite" style={styles.card}>
            <View style={styles.statusRow}>
              <View style={styles.statusCopy}>
                <Text style={styles.eyebrow}>ORDER {activeOrder.id}</Text>
                <Text style={styles.statusTitle}>{currentStage.title}</Text>
                <Text style={styles.statusDetail}>{currentStage.detail}</Text>
              </View>
              <View style={[styles.eta, delivered && styles.etaDelivered]}>
                {delivered ? (
                  <Ionicons
                    name="checkmark"
                    size={spacing.iconLarge}
                    color={colors.white}
                  />
                ) : (
                  <>
                    <Text style={styles.etaValue}>{minutesLeft}</Text>
                    <Text style={styles.etaUnit}>min</Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>

          <View style={styles.card}>
            {stages.map((stage, index) => {
              const reached = index <= currentIndex;
              return (
                <View key={stage.id} style={styles.step}>
                  <View style={styles.stepRail}>
                    <View style={[styles.stepDot, reached && styles.stepDotReached]}>
                      <Ionicons
                        name={stage.icon}
                        size={spacing.iconSmall}
                        color={reached ? colors.white : colors.muted}
                      />
                    </View>
                    {index < stages.length - 1 ? (
                      <View
                        style={[
                          styles.stepLine,
                          index < currentIndex && styles.stepLineReached,
                        ]}
                      />
                    ) : null}
                  </View>
                  <View style={styles.stepCopy}>
                    <Text style={[styles.stepTitle, !reached && styles.stepTitlePending]}>
                      {stage.title}
                    </Text>
                    {index === currentIndex ? (
                      <Text style={styles.stepDetail}>{stage.detail}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={[styles.card, styles.riderCard]}>
            <View style={styles.riderAvatar}>
              <Ionicons name="person" size={spacing.iconLarge} color={colors.primary} />
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.eyebrow}>YOUR RIDER</Text>
              <Text style={styles.riderName}>{activeOrder.riderName}</Text>
              <Text style={styles.statusDetail}>{activeOrder.riderVehicle}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Order summary</Text>
            {activeOrder.lines.map((line) => (
              <View key={line.id} style={styles.summaryRow}>
                <Text style={styles.summaryQuantity}>{line.quantity}×</Text>
                <Text numberOfLines={1} style={styles.summaryName}>
                  {line.name}
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryName}>{activeOrder.paymentLabel}</Text>
              <Text style={styles.summaryTotal}>{formatPrice(activeOrder.total)}</Text>
            </View>
          </View>

          {delivered ? (
            <Pressable
              accessibilityLabel="I have received my order"
              accessibilityRole="button"
              onPress={() => {
                clearOrder();
                navigation.navigate("Home");
              }}
              style={[styles.primaryButton, styles.receivedButton]}
            >
              <Text style={styles.primaryButtonText}>Order received</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    color: colors.white,
    fontSize: typography.subtitle,
    fontWeight: typography.weightBold,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  addressPill: {
    position: "absolute",
    top: spacing.md,
    left: spacing.pageHorizontal,
    right: spacing.pageHorizontal,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    elevation: spacing.shadowElevation,
  },
  addressText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.small,
    fontWeight: typography.weightSemibold,
  },
  content: {
    gap: spacing.md,
    marginTop: -spacing.xl,
    paddingHorizontal: spacing.pageHorizontal,
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  statusCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: typography.weightBold,
    letterSpacing: spacing.borderHairline,
  },
  statusTitle: {
    color: colors.text,
    fontSize: typography.title,
    lineHeight: typography.lineTitle,
    fontWeight: typography.weightHeavy,
  },
  statusDetail: {
    color: colors.textSecondary,
    fontSize: typography.small,
  },
  eta: {
    width: spacing.categoryTile,
    height: spacing.categoryTile,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.lg,
    backgroundColor: colors.accent,
  },
  etaDelivered: {
    backgroundColor: colors.primary,
  },
  etaValue: {
    color: colors.white,
    fontSize: typography.title,
    lineHeight: typography.lineSubtitle,
    fontWeight: typography.weightHeavy,
  },
  etaUnit: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: typography.weightSemibold,
  },
  progressTrack: {
    height: spacing.sm,
    overflow: "hidden",
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
  },
  progressFill: {
    height: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  step: {
    flexDirection: "row",
    gap: spacing.md,
  },
  stepRail: {
    alignItems: "center",
  },
  stepDot: {
    width: spacing.xxxl,
    height: spacing.xxxl,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  stepDotReached: {
    backgroundColor: colors.primary,
  },
  stepLine: {
    width: spacing.xxs,
    height: spacing.lg,
    backgroundColor: colors.border,
  },
  stepLineReached: {
    backgroundColor: colors.primary,
  },
  stepCopy: {
    flex: 1,
    minHeight: spacing.xxxl,
    justifyContent: "center",
  },
  stepTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: typography.weightBold,
  },
  stepTitlePending: {
    color: colors.muted,
    fontWeight: typography.weightMedium,
  },
  stepDetail: {
    color: colors.textSecondary,
    fontSize: typography.small,
  },
  riderCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  riderAvatar: {
    width: spacing.touchTarget + spacing.sm,
    height: spacing.touchTarget + spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
  },
  riderName: {
    color: colors.text,
    fontSize: typography.bodyLarge,
    fontWeight: typography.weightBold,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.bodyLarge,
    fontWeight: typography.weightBold,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  summaryQuantity: {
    minWidth: spacing.xxl,
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: typography.weightBold,
  },
  summaryName: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
  },
  summaryTotal: {
    color: colors.primaryDark,
    fontSize: typography.bodyLarge,
    fontWeight: typography.weightHeavy,
  },
  divider: {
    height: spacing.borderHairline,
    backgroundColor: colors.border,
  },
  primaryButton: {
    minHeight: spacing.touchTarget + spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  receivedButton: {
    backgroundColor: colors.accent,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: typography.weightBold,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xxxl,
  },
  emptyIcon: {
    width: spacing.emptyCartIconSize,
    height: spacing.emptyCartIconSize,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weightBold,
    textAlign: "center",
  },
  emptyMessage: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: typography.lineBody,
    textAlign: "center",
  },
});
