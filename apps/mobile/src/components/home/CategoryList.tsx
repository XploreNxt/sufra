import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SectionHeader } from "@/components/common/SectionHeader";
import type { FoodCategory } from "@/types";
import { colors, radii, spacing, typography } from "@/theme";

interface CategoryListProps {
  categories: FoodCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

interface CategoryChipProps {
  category: FoodCategory;
  selected: boolean;
  onPress: () => void;
}

function CategoryChip({ category, selected, onPress }: CategoryChipProps) {
  return (
    <Pressable
      accessibilityLabel={`${category.name} category`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.chip}
    >
      <View style={[styles.imageTile, selected && styles.imageTileSelected]}>
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          placeholder={{ blurhash: category.image_blurhash }}
          source={{ uri: category.image_url ?? undefined }}
          style={styles.image}
          transition={200}
        />
        <View style={styles.imageOverlay} />
        {selected ? (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark" size={spacing.iconSmall} color={colors.primary} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const MemoCategoryChip = React.memo(CategoryChip);

export function CategoryList({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryListProps) {
  const renderItem = React.useCallback(
    ({ item }: { item: FoodCategory }) => (
      <MemoCategoryChip
        category={item}
        selected={item.id === selectedCategoryId}
        onPress={() => onSelectCategory(item.id === selectedCategoryId ? null : item.id)}
      />
    ),
    [onSelectCategory, selectedCategoryId],
  );

  return (
    <View>
      <SectionHeader title="Explore by category" />
      <FlatList
        data={categories}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={CategorySeparator}
        ListFooterComponent={
          selectedCategoryId ? (
            <Pressable
              accessibilityLabel="Clear category filter"
              accessibilityRole="button"
              onPress={() => onSelectCategory(null)}
              style={styles.clearButton}
            >
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}

function CategorySeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  chip: {
    width: spacing.categoryTile + spacing.xs * 2,
    alignItems: "center",
    gap: spacing.sm,
  },
  imageTile: {
    position: "relative",
    width: spacing.categoryTile + spacing.xs * 2,
    height: spacing.categoryTile + spacing.xs * 2,
    overflow: "hidden",
    borderRadius: radii.lg,
    backgroundColor: colors.primaryLight,
  },
  imageTileSelected: {
    borderColor: colors.primary,
    borderWidth: spacing.borderHairline * 2,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  selectedBadge: {
    position: "absolute",
    right: spacing.xs,
    bottom: spacing.xs,
    width: spacing.iconLarge,
    height: spacing.iconLarge,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.white,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: typography.weightMedium,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: typography.weightBold,
  },
  separator: {
    width: spacing.lg,
  },
  clearButton: {
    minHeight: spacing.touchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  clearText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: typography.weightSemibold,
  },
});
