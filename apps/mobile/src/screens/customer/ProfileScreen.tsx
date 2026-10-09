import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCart } from "@/context/CartContext";
import { mockFavorites, mockUser } from "@/data/mockFood";
import type { CustomerTabParamList } from "@/navigation/types";
import { formatPrice } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

type Props = BottomTabScreenProps<CustomerTabParamList, "Profile">;
type IconName = React.ComponentProps<typeof Ionicons>["name"];

function comingSoon(feature: string) {
  Alert.alert(`${feature} is coming soon`, "This will be available in a future update.");
}

export function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { itemCount, subtotal } = useCart();
  const initials = mockUser.name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toLocaleUpperCase();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" backgroundColor={colors.primary} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.identity}>
            <Text numberOfLines={1} style={styles.name}>
              {mockUser.name}
            </Text>
            <Text numberOfLines={1} style={styles.contact}>
              {mockUser.email}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Edit profile"
            accessibilityRole="button"
            onPress={() => comingSoon("Profile editing")}
            style={styles.editButton}
          >
            <Ionicons
              name="create-outline"
              size={spacing.icon}
              color={colors.primaryDark}
            />
          </Pressable>
        </View>

        <View style={styles.stats}>
          <StatTile label="In your cart" value={String(itemCount)} />
          <View style={styles.statDivider} />
          <StatTile label="Cart total" value={formatPrice(subtotal)} />
          <View style={styles.statDivider} />
          <StatTile label="Favourites" value={String(mockFavorites.length)} />
        </View>

        <View style={styles.content}>
          <Section title="My account">
            <ProfileRow
              icon="location-outline"
              label="Delivery address"
              detail={mockUser.address}
              onPress={() => comingSoon("Address management")}
            />
            <ProfileRow
              icon="card-outline"
              label="Payment methods"
              detail="Cash on delivery"
              onPress={() => comingSoon("Payment methods")}
            />
            <ProfileRow
              icon="bicycle-outline"
              label="Track my order"
              onPress={() => navigation.navigate("Orders")}
            />
            <ProfileRow
              icon="bag-handle-outline"
              label="My cart"
              detail={itemCount > 0 ? `${itemCount} in cart` : undefined}
              onPress={() => navigation.navigate("Cart")}
              isLast
            />
          </Section>

          <Section title="Support">
            <ProfileRow
              icon="help-circle-outline"
              label="Help centre"
              onPress={() => comingSoon("The help centre")}
            />
            <ProfileRow
              icon="document-text-outline"
              label="Terms and privacy"
              onPress={() => comingSoon("Terms and privacy")}
              isLast
            />
          </Section>

          <Pressable
            accessibilityLabel="Sign out"
            accessibilityRole="button"
            onPress={() => comingSoon("Sign out")}
            style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
          >
            <Ionicons name="log-out-outline" size={spacing.icon} color={colors.danger} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
          <Text style={styles.version}>Surfa · Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

interface StatTileProps {
  label: string;
  value: string;
}

function StatTile({ label, value }: StatTileProps) {
  return (
    <View style={styles.statTile}>
      <Text numberOfLines={1} style={styles.statValue}>
        {value}
      </Text>
      <Text numberOfLines={1} style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title.toLocaleUpperCase()}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

interface ProfileRowProps {
  icon: IconName;
  label: string;
  detail?: string;
  isLast?: boolean;
  onPress: () => void;
}

function ProfileRow({ icon, label, detail, isLast = false, onPress }: ProfileRowProps) {
  return (
    <Pressable
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowBorder,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={spacing.icon} color={colors.primary} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail ? (
          <Text numberOfLines={1} style={styles.rowDetail}>
            {detail}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={spacing.icon} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.xxxl + spacing.xl,
    backgroundColor: colors.primary,
  },
  avatar: {
    width: spacing.categoryTile,
    height: spacing.categoryTile,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.white,
  },
  avatarText: {
    color: colors.primaryDark,
    fontSize: typography.title,
    fontWeight: typography.weightHeavy,
  },
  identity: {
    flex: 1,
    gap: spacing.xxs,
  },
  name: {
    color: colors.white,
    fontSize: typography.title,
    lineHeight: typography.lineTitle,
    fontWeight: typography.weightHeavy,
  },
  contact: {
    color: colors.primaryLight,
    fontSize: typography.small,
  },
  editButton: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.white,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -spacing.xxxl,
    marginHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOffset: { width: spacing.zero, height: spacing.xs },
    shadowOpacity: spacing.shadowOpacity,
    shadowRadius: spacing.shadowRadius,
    elevation: spacing.shadowElevation,
  },
  statTile: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
  },
  statValue: {
    color: colors.primaryDark,
    fontSize: typography.bodyLarge,
    fontWeight: typography.weightHeavy,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  statDivider: {
    width: spacing.borderHairline,
    height: spacing.xxxl,
    backgroundColor: colors.border,
  },
  content: {
    gap: spacing.xxl,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.xxl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: typography.weightBold,
    letterSpacing: spacing.borderHairline,
  },
  card: {
    overflow: "hidden",
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  row: {
    minHeight: spacing.categoryTile,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: spacing.borderHairline,
  },
  rowIcon: {
    width: spacing.touchTarget - spacing.sm,
    height: spacing.touchTarget - spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: typography.weightSemibold,
  },
  rowDetail: {
    color: colors.textSecondary,
    fontSize: typography.small,
  },
  pressed: {
    opacity: 0.7,
  },
  signOut: {
    minHeight: spacing.touchTarget + spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: spacing.borderHairline,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  signOutText: {
    color: colors.danger,
    fontSize: typography.body,
    fontWeight: typography.weightBold,
  },
  version: {
    color: colors.muted,
    fontSize: typography.caption,
    textAlign: "center",
  },
});
