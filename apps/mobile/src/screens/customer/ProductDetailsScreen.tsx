import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PriceTag } from "@/components/common/PriceTag";
import { Rating } from "@/components/common/Rating";
import { useCart } from "@/context/CartContext";
import type { RootStackParamList } from "@/navigation/types";
import { colors, radii, spacing, typography } from "@/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ProductDetails">;

export function ProductDetailsScreen({ route }: Props) {
  const { food } = route.params;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { items, addItem, decrementItem } = useCart();
  const [imageFailed, setImageFailed] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const quantity = items.find((item) => item.food.id === food.id)?.quantity ?? 0;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" backgroundColor={colors.surface} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          accessibilityLabel={`${food.name} food photo`}
          style={[
            styles.hero,
            {
              height:
                width >= spacing.cardWidthMax * 1.5
                  ? spacing.detailHeroHeightLarge
                  : spacing.detailHeroHeight,
            },
          ]}
        >
          {!imageFailed && food.image_url ? (
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              placeholder={{ blurhash: food.image_blurhash }}
              source={{ uri: food.image_url }}
              style={StyleSheet.absoluteFill}
              transition={300}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={styles.imageFallback}>
              <Ionicons
                name="restaurant-outline"
                size={spacing.iconXLarge}
                color={colors.primary}
              />
              <Text style={styles.imageFallbackText}>Photo temporarily unavailable</Text>
            </View>
          )}
          <View style={styles.imageShade} />
          <View style={styles.photoBadge}>
            <Ionicons name="flame" size={spacing.iconSmall} color={colors.accent} />
            <Text style={styles.photoBadgeText}>CUSTOMER FAVORITE</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.restaurantRow}>
            <View style={styles.restaurantIcon}>
              <Ionicons name="restaurant" size={spacing.icon} color={colors.primary} />
            </View>
            <View style={styles.restaurantCopy}>
              <Text style={styles.restaurantEyebrow}>FROM THE KITCHEN OF</Text>
              <Text style={styles.restaurantName}>{food.restaurant_name}</Text>
            </View>
            <View style={styles.cuisinePill}>
              <Text style={styles.cuisineText}>{food.cuisine}</Text>
            </View>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>{food.name}</Text>
            <Rating value={food.rating_avg} count={food.rating_count} />
          </View>

          <View style={styles.priceBlock}>
            <PriceTag price={food.price} />
            <Text style={styles.priceNote}>Inclusive of all taxes</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.descriptionBlock}>
            <Text style={styles.sectionTitle}>Made to make your day</Text>
            <Text style={styles.description}>
              {food.description ??
                "Made fresh to order with thoughtfully selected ingredients. Comforting, full of flavour, and ready to enjoy."}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <InfoTile icon="time-outline" label="Freshly made" />
            <InfoTile icon="leaf-outline" label="Quality ingredients" />
            <InfoTile icon="bicycle-outline" label="Delivered with care" />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        {quantity > 0 ? (
          <View style={styles.quantityControls}>
            <Pressable
              accessibilityLabel={`Remove one ${food.name} from cart`}
              accessibilityRole="button"
              onPress={() => {
                decrementItem(food.id);
                setJustAdded(false);
              }}
              style={styles.quantityButton}
            >
              <Ionicons name="remove" size={spacing.icon} color={colors.primary} />
            </Pressable>
            <Text style={styles.quantityText}>{quantity}</Text>
            <Pressable
              accessibilityLabel={`Add one ${food.name} to cart`}
              accessibilityRole="button"
              onPress={() => {
                addItem(food);
                setJustAdded(true);
              }}
              style={styles.quantityButton}
            >
              <Ionicons name="add" size={spacing.icon} color={colors.primary} />
            </Pressable>
          </View>
        ) : null}
        <Pressable
          accessibilityLabel={`Add ${food.name} to cart for ${food.price} rupees`}
          accessibilityRole="button"
          onPress={() => {
            addItem(food);
            setJustAdded(true);
          }}
          style={styles.addButton}
        >
          <Ionicons name="bag-add-outline" size={spacing.icon} color={colors.white} />
          <Text style={styles.addButtonText}>
            {quantity > 0 ? "Add another" : "Add to cart"}
          </Text>
          <View style={styles.buttonDivider} />
          <Text style={styles.addButtonPrice}>
            Rs {food.price.toLocaleString("en-PK")}
          </Text>
        </Pressable>
        {justAdded ? (
          <Text accessibilityRole="alert" style={styles.addedMessage}>
            Added to your cart
          </Text>
        ) : null}
      </View>
    </View>
  );
}

interface InfoTileProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}

function InfoTile({ icon, label }: InfoTileProps) {
  return (
    <View style={styles.infoTile}>
      <Ionicons name={icon} size={spacing.icon} color={colors.primary} />
      <Text style={styles.infoText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.primaryLight,
  },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
  },
  imageFallbackText: {
    color: colors.primaryDark,
    fontSize: typography.small,
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    opacity: spacing.imageOverlayOpacity,
  },
  photoBadge: {
    position: "absolute",
    left: spacing.pageHorizontal,
    bottom: spacing.lg,
    minHeight: spacing.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
  },
  photoBadgeText: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: typography.weightBold,
    letterSpacing: spacing.xs,
  },
  content: {
    gap: spacing.detailSectionGap,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.xl,
  },
  restaurantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  restaurantIcon: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
  },
  restaurantCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  restaurantEyebrow: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: typography.weightSemibold,
    letterSpacing: spacing.xs,
  },
  restaurantName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: typography.weightBold,
  },
  cuisinePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
  },
  cuisineText: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: typography.weightSemibold,
  },
  titleBlock: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.display,
    lineHeight: typography.lineDisplay,
    fontWeight: typography.weightHeavy,
  },
  priceBlock: {
    gap: spacing.xs,
  },
  priceNote: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  divider: {
    height: spacing.borderHairline,
    backgroundColor: colors.border,
  },
  descriptionBlock: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    lineHeight: typography.lineSubtitle,
    fontWeight: typography.weightBold,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.bodyLarge,
    lineHeight: typography.lineBody,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  infoTile: {
    flex: 1,
    minHeight: spacing.touchTarget * 2,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: typography.weightMedium,
    textAlign: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: spacing.borderHairline,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
  },
  quantityButton: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.white,
  },
  quantityText: {
    minWidth: spacing.cartQtyMinWidth,
    color: colors.primaryDark,
    fontSize: typography.bodyLarge,
    fontWeight: typography.weightBold,
    textAlign: "center",
  },
  addButton: {
    flex: 1,
    minHeight: spacing.touchTarget + spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  addButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: typography.weightBold,
  },
  buttonDivider: {
    width: spacing.borderHairline,
    height: spacing.icon,
    backgroundColor: colors.primaryLight,
    opacity: 0.55,
  },
  addButtonPrice: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: typography.weightSemibold,
  },
  addedMessage: {
    position: "absolute",
    right: spacing.pageHorizontal,
    bottom: spacing.touchTarget + spacing.xxxl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    overflow: "hidden",
    backgroundColor: colors.primaryDark,
    color: colors.white,
    fontSize: typography.small,
    fontWeight: typography.weightSemibold,
  },
});
