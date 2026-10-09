import React, { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { animation, colors, radii, spacing, typography } from "@/theme";

interface ImageGalleryProps {
  images: string[];
  blurhash: string;
  name: string;
  width: number;
  height: number;
}

export function ImageGallery({
  images,
  blurhash,
  name,
  width,
  height,
}: ImageGalleryProps) {
  const isFocused = useIsFocused();
  const listRef = useRef<FlatList<string>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const previousWidth = useRef(width);

  useEffect(() => {
    if (previousWidth.current !== width) {
      listRef.current?.scrollToOffset({ offset: activeIndex * width, animated: false });
      previousWidth.current = width;
    }
  }, [activeIndex, width]);

  const scrollToIndex = useCallback(
    (index: number) => {
      setActiveIndex(index);
      listRef.current?.scrollToOffset({ offset: index * width, animated: true });
    },
    [width],
  );

  useEffect(() => {
    if (!isFocused || dragging || images.length < 2) return;

    const interval = setInterval(() => {
      scrollToIndex((activeIndex + 1) % images.length);
    }, animation.galleryIntervalMs);

    return () => clearInterval(interval);
  }, [activeIndex, dragging, images.length, isFocused, scrollToIndex]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / width);
      setActiveIndex(Math.min(Math.max(index, 0), images.length - 1));
      setDragging(false);
    },
    [images.length, width],
  );

  const markFailed = useCallback((uri: string) => {
    setFailed((current) => new Set(current).add(uri));
  }, []);

  const renderImage = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <View
        accessibilityLabel={`${name} photo ${index + 1} of ${images.length}`}
        style={{ width, height }}
      >
        {failed.has(item) ? (
          <ImageFallback />
        ) : (
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            placeholder={{ blurhash }}
            priority={index === 0 ? "high" : "normal"}
            recyclingKey={item}
            source={{ uri: item }}
            style={StyleSheet.absoluteFill}
            transition={animation.imageTransitionMs}
            onError={() => markFailed(item)}
          />
        )}
      </View>
    ),
    [blurhash, failed, height, images.length, markFailed, name, width],
  );

  if (images.length === 0) {
    return (
      <View style={[styles.wrapper, { height }]}>
        <ImageFallback />
      </View>
    );
  }

  return (
    <View>
      <View style={[styles.wrapper, { height }]}>
        <FlatList
          ref={listRef}
          data={images}
          extraData={failed}
          horizontal
          keyExtractor={(item) => item}
          onMomentumScrollEnd={handleScroll}
          onScrollBeginDrag={() => setDragging(true)}
          onScrollEndDrag={() => setDragging(false)}
          pagingEnabled
          renderItem={renderImage}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          getItemLayout={(_data, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
        <View pointerEvents="none" style={styles.shade} />
        <View pointerEvents="none" style={styles.photoBadge}>
          <Ionicons name="flame" size={spacing.iconSmall} color={colors.accent} />
          <Text style={styles.photoBadgeText}>Customer favourite</Text>
        </View>
        {images.length > 1 ? (
          <>
            <View pointerEvents="none" style={styles.counter}>
              <Ionicons
                name="images-outline"
                size={spacing.iconSmall}
                color={colors.white}
              />
              <Text style={styles.counterText}>
                {activeIndex + 1} / {images.length}
              </Text>
            </View>
            <View pointerEvents="none" style={styles.dots}>
              {images.map((uri, index) => (
                <View
                  key={uri}
                  style={[styles.dot, index === activeIndex && styles.activeDot]}
                />
              ))}
            </View>
          </>
        ) : null}
      </View>

      {images.length > 1 ? (
        <View style={styles.thumbnails}>
          {images.map((uri, index) => (
            <Pressable
              accessibilityLabel={`Show ${name} photo ${index + 1}`}
              accessibilityRole="button"
              accessibilityState={{ selected: index === activeIndex }}
              key={uri}
              onPress={() => scrollToIndex(index)}
              style={[styles.thumbnail, index === activeIndex && styles.activeThumbnail]}
            >
              {failed.has(uri) ? (
                <Ionicons
                  name="restaurant-outline"
                  size={spacing.icon}
                  color={colors.primary}
                />
              ) : (
                <Image
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  placeholder={{ blurhash }}
                  source={{ uri }}
                  style={StyleSheet.absoluteFill}
                  onError={() => markFailed(uri)}
                />
              )}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ImageFallback() {
  return (
    <View style={styles.imageFallback}>
      <Ionicons
        name="restaurant-outline"
        size={spacing.iconXLarge}
        color={colors.primary}
      />
      <Text style={styles.imageFallbackText}>Photo temporarily unavailable</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
    backgroundColor: colors.primaryLight,
  },
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    opacity: spacing.imageOverlayOpacity,
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
  photoBadge: {
    position: "absolute",
    left: spacing.pageHorizontal,
    top: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
  },
  photoBadgeText: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: typography.weightBold,
  },
  counter: {
    position: "absolute",
    right: spacing.pageHorizontal,
    top: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.overlay,
  },
  counterText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: typography.weightBold,
  },
  dots: {
    position: "absolute",
    left: spacing.zero,
    right: spacing.zero,
    bottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  dot: {
    width: spacing.carouselDotSize,
    height: spacing.carouselDotSize,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    opacity: 0.6,
  },
  activeDot: {
    width: spacing.carouselActiveDotWidth,
    opacity: 1,
  },
  thumbnails: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.md,
  },
  thumbnail: {
    width: spacing.categoryTile,
    height: spacing.categoryTile,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radii.md,
    borderWidth: spacing.xxs,
    borderColor: colors.transparent,
    backgroundColor: colors.primaryLight,
  },
  activeThumbnail: {
    borderColor: colors.primary,
  },
});
