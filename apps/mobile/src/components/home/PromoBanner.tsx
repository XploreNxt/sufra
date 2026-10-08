import React, { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import type { PromoSlide } from "@/types";
import { animation, colors, radii, spacing, typography } from "@/theme";

interface PromoBannerProps {
  slides: PromoSlide[];
  onPress: (foodId: string) => void;
}

export function PromoBanner({ slides, onPress }: PromoBannerProps) {
  const { width } = useWindowDimensions();
  const isFocused = useIsFocused();
  const carouselRef = useRef<FlatList<PromoSlide>>(null);
  const pageWidth = Math.max(width - spacing.pageHorizontal * 2, spacing.touchTarget);
  const previousPageWidth = useRef(pageWidth);
  const [activeIndex, setActiveIndex] = useState(0);
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (previousPageWidth.current !== pageWidth) {
      carouselRef.current?.scrollToOffset({
        offset: activeIndex * pageWidth,
        animated: false,
      });
      previousPageWidth.current = pageWidth;
    }
  }, [activeIndex, pageWidth]);

  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      const nextIndex = (index + slides.length) % slides.length;
      setActiveIndex(nextIndex);
      carouselRef.current?.scrollToOffset({
        offset: nextIndex * pageWidth,
        animated,
      });
    },
    [pageWidth, slides.length],
  );

  useEffect(() => {
    if (!isFocused || slides.length < 2) return;

    const interval = setInterval(() => {
      scrollToIndex(activeIndex + 1, true);
    }, animation.carouselIntervalMs);

    return () => clearInterval(interval);
  }, [activeIndex, isFocused, scrollToIndex, slides.length]);

  useEffect(() => {
    if (activeIndex === 0) return;

    contentOpacity.setValue(0);
    contentOffset.setValue(spacing.md);
    const transition = Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: animation.carouselTransitionMs,
        useNativeDriver: true,
      }),
      Animated.timing(contentOffset, {
        toValue: spacing.zero,
        duration: animation.carouselTransitionMs,
        useNativeDriver: true,
      }),
    ]);
    transition.start();

    return () => transition.stop();
  }, [activeIndex, contentOffset, contentOpacity]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
      setActiveIndex(Math.min(Math.max(index, 0), slides.length - 1));
    },
    [pageWidth, slides.length],
  );

  const renderSlide = useCallback(
    ({ item, index }: { item: PromoSlide; index: number }) => (
      <View
        accessibilityLabel={`${item.title}. ${item.offer}`}
        style={[styles.slide, { width: pageWidth }]}
      >
        <Image
          accessibilityElementsHidden
          cachePolicy="memory-disk"
          contentFit="cover"
          placeholder={{ blurhash: item.food.image_blurhash }}
          source={{ uri: item.food.image_url ?? undefined }}
          style={styles.image}
          transition={animation.imageTransitionMs}
        />
        <LinearGradient
          colors={[colors.primaryDark, colors.promoGradient, colors.transparent]}
          end={{ x: 1, y: 0.5 }}
          start={{ x: 0, y: 0.5 }}
          style={styles.gradient}
        />
        <Animated.View
          style={[
            styles.content,
            index === activeIndex && {
              opacity: contentOpacity,
              transform: [{ translateX: contentOffset }],
            },
          ]}
        >
          <View style={styles.offerPill}>
            <Ionicons name="sparkles" size={spacing.iconSmall} color={colors.accent} />
            <Text style={styles.offerText}>{item.offer}</Text>
          </View>
          <Text numberOfLines={1} style={styles.eyebrow}>
            {item.eyebrow}
          </Text>
          <Text numberOfLines={2} style={styles.title}>
            {item.title}
          </Text>
          <Pressable
            accessibilityLabel={`Explore ${item.food.name}`}
            accessibilityRole="button"
            onPress={() => onPress(item.food.id)}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Order now</Text>
            <Ionicons
              name="arrow-forward"
              size={spacing.iconSmall}
              color={colors.primaryDark}
            />
          </Pressable>
        </Animated.View>
      </View>
    ),
    [activeIndex, contentOffset, contentOpacity, onPress, pageWidth],
  );

  if (slides.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <Animated.FlatList
        ref={carouselRef}
        data={slides}
        horizontal
        initialNumToRender={1}
        keyExtractor={(item) => item.id}
        maxToRenderPerBatch={2}
        onMomentumScrollEnd={handleScrollEnd}
        pagingEnabled
        removeClippedSubviews
        renderItem={renderSlide}
        showsHorizontalScrollIndicator={false}
        windowSize={3}
        getItemLayout={(_data, index) => ({
          length: pageWidth,
          offset: pageWidth * index,
          index,
        })}
      />
      <View style={styles.pagination}>
        <Text style={styles.paginationLabel}>
          {String(activeIndex + 1).padStart(2, "0")} /{" "}
          {String(slides.length).padStart(2, "0")}
        </Text>
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <Pressable
              accessibilityLabel={`Show offer ${index + 1}: ${slide.title}`}
              accessibilityRole="button"
              accessibilityState={{ selected: index === activeIndex }}
              key={slide.id}
              onPress={() => scrollToIndex(index, true)}
              style={styles.dotButton}
            >
              <View style={[styles.dot, index === activeIndex && styles.activeDot]} />
            </Pressable>
          ))}
        </View>
        <Ionicons
          name="swap-horizontal"
          size={spacing.icon}
          color={colors.textSecondary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  slide: {
    height: spacing.carouselHeight,
    overflow: "hidden",
    borderRadius: radii.lg,
    backgroundColor: colors.primaryDark,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    paddingRight: spacing.carouselTextWidth,
  },
  offerPill: {
    minHeight: spacing.touchTarget - spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
  },
  offerText: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: typography.weightBold,
  },
  eyebrow: {
    color: colors.primaryLight,
    fontSize: typography.caption,
    fontWeight: typography.weightBold,
    letterSpacing: spacing.xs,
  },
  title: {
    color: colors.white,
    fontSize: typography.title,
    lineHeight: typography.lineTitle,
    fontWeight: typography.weightHeavy,
  },
  cta: {
    minHeight: spacing.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
  },
  ctaText: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: typography.weightBold,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
  },
  paginationLabel: {
    minWidth: spacing.cartQtyMinWidth * 2,
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: typography.weightSemibold,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dot: {
    width: spacing.carouselDotSize,
    height: spacing.carouselDotSize,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  activeDot: {
    width: spacing.carouselActiveDotWidth,
    backgroundColor: colors.primary,
  },
  dotButton: {
    minWidth: spacing.touchTarget,
    minHeight: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
