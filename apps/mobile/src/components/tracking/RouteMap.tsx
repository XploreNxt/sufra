import React, { useEffect, useMemo, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { animation, colors, radii, spacing } from "@/theme";

interface RouteMapProps {
  width: number;
  height: number;
  /** How far along the route the rider is, from 0 (restaurant) to 1 (customer). */
  progress: number;
  /** Screen-reader description. Defaults to the customer's tracking wording. */
  label?: string;
}

interface Point {
  x: number;
  y: number;
}

// Route corners as fractions of the map size, from the restaurant to the customer.
const routeCorners: Point[] = [
  { x: 0.16, y: 0.8 },
  { x: 0.16, y: 0.52 },
  { x: 0.5, y: 0.52 },
  { x: 0.5, y: 0.26 },
  { x: 0.84, y: 0.26 },
];
const sideStreets = { vertical: [0.33, 0.68], horizontal: [0.12, 0.66] };

function pointAt(points: Point[], progress: number): Point {
  const lengths = points
    .slice(1)
    .map(
      (point, index) =>
        Math.abs(point.x - points[index].x) + Math.abs(point.y - points[index].y),
    );
  let remaining =
    Math.min(Math.max(progress, 0), 1) * lengths.reduce((sum, length) => sum + length, 0);

  for (let index = 0; index < lengths.length; index += 1) {
    if (remaining <= lengths[index]) {
      const ratio = lengths[index] === 0 ? 0 : remaining / lengths[index];
      return {
        x: points[index].x + (points[index + 1].x - points[index].x) * ratio,
        y: points[index].y + (points[index + 1].y - points[index].y) * ratio,
      };
    }
    remaining -= lengths[index];
  }
  return points[points.length - 1];
}

function RouteMap({
  width,
  height,
  progress,
  label = "Map showing your rider's route from the restaurant to you",
}: RouteMapProps) {
  const points = useMemo(
    () => routeCorners.map((corner) => ({ x: corner.x * width, y: corner.y * height })),
    [height, width],
  );
  const rider = useMemo(() => pointAt(points, progress), [points, progress]);
  const riderX = useRef(new Animated.Value(rider.x)).current;
  const riderY = useRef(new Animated.Value(rider.y)).current;

  useEffect(() => {
    const move = Animated.parallel([
      Animated.timing(riderX, {
        toValue: rider.x,
        duration: animation.trackingTickMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(riderY, {
        toValue: rider.y,
        duration: animation.trackingTickMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);
    move.start();

    return () => move.stop();
  }, [rider.x, rider.y, riderX, riderY]);

  const start = points[0];
  const end = points[points.length - 1];
  const half = spacing.mapMarker / 2;

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="image"
      style={[styles.map, { width, height }]}
    >
      {sideStreets.vertical.map((x) => (
        <View
          key={`v${x}`}
          style={[styles.street, styles.vertical, { left: x * width }]}
        />
      ))}
      {sideStreets.horizontal.map((y) => (
        <View
          key={`h${y}`}
          style={[styles.street, styles.horizontal, { top: y * height }]}
        />
      ))}
      {points.slice(1).map((point, index) => {
        const previous = points[index];
        return (
          <View
            key={`${point.x}-${point.y}`}
            style={[
              styles.route,
              {
                left: Math.min(previous.x, point.x) - spacing.mapRoute / 2,
                top: Math.min(previous.y, point.y) - spacing.mapRoute / 2,
                width: Math.abs(point.x - previous.x) + spacing.mapRoute,
                height: Math.abs(point.y - previous.y) + spacing.mapRoute,
              },
            ]}
          />
        );
      })}

      <View style={[styles.marker, { left: start.x - half, top: start.y - half }]}>
        <Ionicons name="restaurant" size={spacing.iconSmall} color={colors.primary} />
      </View>
      <View
        style={[
          styles.marker,
          styles.homeMarker,
          { left: end.x - half, top: end.y - half },
        ]}
      >
        <Ionicons name="home" size={spacing.iconSmall} color={colors.white} />
      </View>
      <Animated.View
        style={[
          styles.marker,
          styles.riderMarker,
          {
            left: -half,
            top: -half,
            transform: [{ translateX: riderX }, { translateY: riderY }],
          },
        ]}
      >
        <Ionicons name="bicycle" size={spacing.icon} color={colors.white} />
      </Animated.View>
    </View>
  );
}

export const MemoRouteMap = React.memo(RouteMap);

const styles = StyleSheet.create({
  map: {
    overflow: "hidden",
    backgroundColor: colors.primaryLight,
  },
  street: {
    position: "absolute",
    backgroundColor: colors.white,
  },
  vertical: {
    top: spacing.zero,
    bottom: spacing.zero,
    width: spacing.mapStreet,
  },
  horizontal: {
    left: spacing.zero,
    right: spacing.zero,
    height: spacing.mapStreet,
  },
  route: {
    position: "absolute",
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  marker: {
    position: "absolute",
    width: spacing.mapMarker,
    height: spacing.mapMarker,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    borderWidth: spacing.xxs,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  homeMarker: {
    borderColor: colors.white,
    backgroundColor: colors.accent,
  },
  riderMarker: {
    borderColor: colors.white,
    backgroundColor: colors.primaryDark,
    elevation: spacing.shadowElevation,
  },
});
