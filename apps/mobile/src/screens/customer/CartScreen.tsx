import React, { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MemoCartItemRow } from "@/components/cart/CartItemRow";
import { useCart } from "@/context/CartContext";
import type { CartItem } from "@/context/CartContext";
import { formatPrice } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

export function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, itemCount, subtotal, addItem, decrementItem } = useCart();

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <MemoCartItemRow
        item={item}
        onAdd={() => addItem(item.food)}
        onRemove={() => decrementItem(item.food.id)}
      />
    ),
    [addItem, decrementItem],
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.title}>Your cart</Text>
        <Text style={styles.subtitle}>
          {itemCount === 0
            ? "A good meal is just around the corner."
            : `${itemCount} ${itemCount === 1 ? "item" : "items"} picked just for you`}
        </Text>
      </View>
      <FlatList
        contentContainerStyle={[
          styles.list,
          items.length === 0 && styles.emptyList,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        data={items}
        ItemSeparatorComponent={CartItemSeparator}
        keyExtractor={(item) => item.food.id}
        ListEmptyComponent={<EmptyCart />}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
      {items.length > 0 ? (
        <View style={[styles.summary, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.subtotalRow}>
            <View>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalNote}>
                Delivery and taxes calculated at checkout
              </Text>
            </View>
            <Text style={styles.subtotalValue}>{formatPrice(subtotal)}</Text>
          </View>
          <Pressable
            accessibilityLabel="Continue to checkout"
            accessibilityRole="button"
            onPress={() =>
              Alert.alert(
                "Checkout is coming soon",
                "Your items are safely in your cart. Checkout will be available in a future update.",
              )
            }
            style={styles.checkoutButton}
          >
            <Text style={styles.checkoutText}>Continue to checkout</Text>
            <Ionicons name="arrow-forward" size={spacing.icon} color={colors.white} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function CartItemSeparator() {
  return <View style={styles.separator} />;
}

function EmptyCart() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="bag-handle-outline"
          size={spacing.iconXLarge}
          color={colors.primary}
        />
      </View>
      <Text style={styles.emptyTitle}>Your next favourite is waiting</Text>
      <Text style={styles.emptyMessage}>
        Explore the menu and add something delicious to your cart.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    gap: spacing.xs,
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
  },
  title: {
    color: colors.text,
    fontSize: typography.display,
    lineHeight: typography.lineDisplay,
    fontWeight: typography.weightHeavy,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  list: {
    flexGrow: 1,
    padding: spacing.pageHorizontal,
  },
  emptyList: {
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
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
    lineHeight: typography.lineSubtitle,
    fontWeight: typography.weightBold,
    textAlign: "center",
  },
  emptyMessage: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: typography.lineBody,
    textAlign: "center",
  },
  separator: {
    height: spacing.md,
  },
  summary: {
    gap: spacing.lg,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.lg,
    borderTopColor: colors.border,
    borderTopWidth: spacing.borderHairline,
    backgroundColor: colors.surface,
  },
  subtotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  subtotalLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: typography.weightBold,
  },
  subtotalNote: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  subtotalValue: {
    color: colors.primaryDark,
    fontSize: typography.subtitle,
    fontWeight: typography.weightBold,
  },
  checkoutButton: {
    minHeight: spacing.touchTarget + spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  checkoutText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: typography.weightBold,
  },
});
