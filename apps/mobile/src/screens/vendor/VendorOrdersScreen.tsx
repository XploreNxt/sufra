import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { VendorHeader } from "@/components/vendor/VendorHeader";
import { useVendor } from "@/context/VendorContext";
import type { VendorOrder, VendorOrderStatus } from "@/types/vendor";
import { formatPrice } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

type Tab = "active" | "history";

const NEXT: Partial<Record<VendorOrderStatus, { to: VendorOrderStatus; label: string }>> = {
  pending: { to: "accepted", label: "Accept order" },
  accepted: { to: "preparing", label: "Start preparing" },
  preparing: { to: "ready", label: "Mark ready" },
  ready: { to: "delivered", label: "Confirm pickup" },
};

const STATUS_LABEL: Record<VendorOrderStatus, string> = {
  pending: "Waiting for you",
  accepted: "Confirmed",
  preparing: "Preparing",
  ready: "Ready for pickup",
  delivered: "Delivered",
};

const STATUS_COLOR: Record<VendorOrderStatus, string> = {
  pending: colors.accent,
  accepted: colors.primary,
  preparing: colors.primary,
  ready: colors.primaryDark,
  delivered: colors.muted,
};

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Karachi" });
}

/** Order fulfilment: live orders to move through the kitchen, plus history. */
export function VendorOrdersScreen() {
  const { orders, advanceOrder } = useVendor();
  const [tab, setTab] = useState<Tab>("active");

  const active = orders.filter((o) => o.status !== "delivered");
  const history = orders.filter((o) => o.status === "delivered");
  const list = tab === "active" ? active : history;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <VendorHeader title="Order Fulfilment" subtitle={`${active.length} active · ${history.length} completed`} />

      <View style={styles.segment}>
        {(["active", "history"] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.segBtn, tab === t && styles.segBtnActive]}>
            <Text style={[styles.segText, tab === t && styles.segTextActive]}>
              {t === "active" ? "Active orders" : "Order history"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {list.length === 0 ? (
          <Text style={styles.empty}>
            {tab === "active" ? "No active orders right now." : "No completed orders yet."}
          </Text>
        ) : null}
        {list.map((order) => (
          <OrderCard key={order.id} order={order} onAdvance={advanceOrder} />
        ))}
      </ScrollView>
    </View>
  );
}

function OrderCard({
  order,
  onAdvance,
}: {
  order: VendorOrder;
  onAdvance: (id: string, to: VendorOrderStatus) => void;
}) {
  const next = NEXT[order.status];
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View>
          <Text style={styles.orderId}>#{order.id}</Text>
          <Text style={styles.meta}>
            {timeLabel(order.placedAt)} · {order.paymentMethod === "cash" ? "Cash" : "Card"}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[order.status] }]}>
          <Text style={styles.statusText}>{STATUS_LABEL[order.status]}</Text>
        </View>
      </View>

      <View style={styles.lines}>
        {order.items.map((line) => (
          <View key={line.name} style={styles.line}>
            <Text style={styles.lineText}>
              {line.quantity}× {line.name}
            </Text>
            <Text style={styles.lineText}>{formatPrice(line.price * line.quantity)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.total}>{formatPrice(order.total)}</Text>
        {next ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onAdvance(order.id, next.to)}
            style={[styles.actionBtn, order.status === "pending" ? styles.actionAccept : styles.actionPrimary]}
          >
            <Text style={styles.actionText}>{next.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  segment: {
    flexDirection: "row",
    marginHorizontal: spacing.pageHorizontal,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.xxs,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
  },
  segBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.sm, alignItems: "center" },
  segBtnActive: { backgroundColor: colors.primary },
  segText: { color: colors.textSecondary, fontSize: typography.small, fontWeight: typography.weightBold },
  segTextActive: { color: colors.white },
  list: { padding: spacing.pageHorizontal, gap: spacing.md, paddingBottom: spacing.xxxl },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: spacing.borderHairline,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  orderId: { color: colors.primary, fontSize: typography.body, fontWeight: typography.weightBold },
  meta: { color: colors.textSecondary, fontSize: typography.caption, marginTop: 2 },
  statusPill: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  statusText: { color: colors.white, fontSize: typography.caption, fontWeight: typography.weightBold },
  lines: { gap: spacing.xs, borderTopWidth: spacing.borderHairline, borderTopColor: colors.border, paddingTop: spacing.md },
  line: { flexDirection: "row", justifyContent: "space-between" },
  lineText: { color: colors.text, fontSize: typography.small },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  total: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weightHeavy },
  actionBtn: { borderRadius: radii.md, paddingHorizontal: spacing.lg, minHeight: spacing.touchTarget, justifyContent: "center" },
  actionAccept: { backgroundColor: colors.accent },
  actionPrimary: { backgroundColor: colors.primary },
  actionText: { color: colors.white, fontSize: typography.small, fontWeight: typography.weightBold },
});
