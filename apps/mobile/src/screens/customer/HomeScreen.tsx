import React, { useCallback, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "@/context/CartContext";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CategoryList } from "@/components/home/CategoryList";
import { FavoritesList } from "@/components/home/FavoritesList";
import { HomeHeader } from "@/components/home/HomeHeader";
import { PopularList } from "@/components/home/PopularList";
import { PromoBanner } from "@/components/home/PromoBanner";
import { promoSlides } from "@/data/mockFood";
import { useHomeData } from "@/hooks/useHomeData";
import type { CustomerTabParamList, RootStackParamList } from "@/navigation/types";
import type { FoodItem } from "@/types";
import { colors, spacing, typography } from "@/theme";

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<CustomerTabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;
type HomeSection = "categories" | "popular" | "favorites";

const sections: HomeSection[] = ["categories", "popular", "favorites"];

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNavigation>();
  const { popular, favorites, categories, loading, error, refresh } = useHomeData();
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string> | null>(null);
  const { itemCount, addItem } = useCart();

  const matchesFilter = useCallback(
    (food: FoodItem) => {
      const query = search.trim().toLocaleLowerCase();
      const matchesSearch =
        query.length === 0 ||
        food.name.toLocaleLowerCase().includes(query) ||
        food.restaurant_name.toLocaleLowerCase().includes(query) ||
        food.cuisine.toLocaleLowerCase().includes(query);
      const matchesCategory =
        selectedCategoryId === null || food.category_id === selectedCategoryId;
      return matchesSearch && matchesCategory;
    },
    [search, selectedCategoryId],
  );

  const visiblePopular = useMemo(
    () => popular.filter(matchesFilter),
    [matchesFilter, popular],
  );
  const visibleFavorites = useMemo(
    () =>
      [...favorites, ...popular]
        .filter(matchesFilter)
        .filter(
          (food, index, foods) =>
            foods.findIndex((candidate) => candidate.id === food.id) === index,
        ),
    [favorites, matchesFilter, popular],
  );

  const isFavorite = useCallback(
    (food: FoodItem) =>
      favoriteIds
        ? favoriteIds.has(food.id)
        : favorites.some((favorite) => favorite.id === food.id),
    [favoriteIds, favorites],
  );

  const toggleFavorite = useCallback(
    (food: FoodItem) => {
      setFavoriteIds((current) => {
        const next = new Set(current ?? favorites.map((favorite) => favorite.id));
        if (next.has(food.id)) {
          next.delete(food.id);
        } else {
          next.add(food.id);
        }
        return next;
      });
    },
    [favorites],
  );

  const openFood = useCallback(
    (food: FoodItem) => navigation.navigate("ProductDetails", { food }),
    [navigation],
  );

  const addToCart = addItem;

  const renderSection = useCallback(
    ({ item }: { item: HomeSection }) => {
      if (item === "categories") {
        return (
          <CategoryList
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        );
      }
      if (item === "popular") {
        return (
          <PopularList
            foods={visiblePopular}
            isFavorite={isFavorite}
            onFoodPress={openFood}
            onAdd={addToCart}
            onToggleFavorite={toggleFavorite}
            onViewAll={() => {
              setSearch("");
              setSelectedCategoryId(null);
            }}
          />
        );
      }
      return (
        <FavoritesList
          foods={visibleFavorites.filter(isFavorite)}
          onFoodPress={openFood}
          onAdd={addToCart}
          onToggleFavorite={toggleFavorite}
        />
      );
    },
    [
      addToCart,
      categories,
      isFavorite,
      openFood,
      selectedCategoryId,
      toggleFavorite,
      visibleFavorites,
      visiblePopular,
    ],
  );

  const showInitialLoading = loading && popular.length === 0 && error === null;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" backgroundColor={colors.primaryDark} />
      <HomeHeader
        topInset={insets.top}
        search={search}
        onSearchChange={setSearch}
        cartCount={itemCount}
        onCartPress={() => navigation.navigate("Cart")}
      />
      <FlatList
        contentContainerStyle={[
          styles.content,
          insets.bottom > spacing.zero && {
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
        data={error ? [] : showInitialLoading ? [] : sections}
        keyExtractor={(item) => item}
        ListEmptyComponent={
          error ? (
            <HomeError message={error.message} onRetry={() => void refresh()} />
          ) : showInitialLoading ? (
            <HomeLoading />
          ) : (
            <Text style={styles.emptyInline}>No menu items are available.</Text>
          )
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.welcomeEyebrow}>MADE FRESH, JUST FOR YOU</Text>
            <Text style={styles.welcomeTitle}>Good food. Good mood.</Text>
            <Text style={styles.welcomeSubtitle}>
              Find your next favourite, delivered with care.
            </Text>
            <View style={styles.carousel}>
              <PromoBanner
                slides={promoSlides}
                onPress={(foodId) => {
                  const food = promoSlides.find(
                    (slide) => slide.food.id === foodId,
                  )?.food;
                  if (food) openFood(food);
                }}
              />
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void refresh()}
            refreshing={loading && popular.length > 0}
            tintColor={colors.primary}
          />
        }
        renderItem={renderSection}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={SectionSeparator}
      />
    </View>
  );
}

function SectionSeparator() {
  return <View style={styles.sectionSeparator} />;
}

function HomeLoading() {
  return (
    <View accessibilityRole="progressbar" style={styles.state}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.stateText}>Finding something delicious…</Text>
    </View>
  );
}

interface HomeErrorProps {
  message: string;
  onRetry: () => void;
}

function HomeError({ message, onRetry }: HomeErrorProps) {
  return (
    <View style={styles.state}>
      <Ionicons
        name="cloud-offline-outline"
        size={spacing.iconXLarge}
        color={colors.danger}
      />
      <Text style={styles.stateTitle}>We couldn't load the menu</Text>
      <Text style={styles.stateText}>{message}</Text>
      <Pressable
        accessibilityLabel="Retry loading the menu"
        accessibilityRole="button"
        onPress={onRetry}
        style={styles.retryButton}
      >
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  listHeader: {
    marginBottom: spacing.section,
    gap: spacing.xs,
  },
  welcomeEyebrow: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: typography.weightBold,
    letterSpacing: spacing.xs,
  },
  welcomeTitle: {
    color: colors.text,
    fontSize: typography.title,
    lineHeight: typography.lineTitle,
    fontWeight: typography.weightHeavy,
  },
  welcomeSubtitle: {
    marginBottom: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  carousel: {
    marginTop: spacing.sm,
  },
  sectionSeparator: {
    height: spacing.section,
  },
  emptyInline: {
    paddingVertical: spacing.lg,
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  state: {
    minHeight: spacing.promoHeight,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  stateTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weightBold,
    textAlign: "center",
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    textAlign: "center",
  },
  retryButton: {
    minHeight: spacing.touchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.touchTarget,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: typography.weightSemibold,
  },
});
