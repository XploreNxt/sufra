import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          onPress={onActionPress}
          style={styles.action}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.subtitle,
    lineHeight: typography.lineSubtitle,
    fontWeight: typography.weightBold,
  },
  action: {
    minHeight: spacing.touchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: typography.weightSemibold,
  },
});
