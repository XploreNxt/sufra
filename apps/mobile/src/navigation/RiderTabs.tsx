import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { RiderJobsScreen } from "@/screens/rider/RiderJobsScreen";
import { RiderDeliveryScreen } from "@/screens/rider/RiderDeliveryScreen";
import { RiderEarningsScreen } from "@/screens/rider/RiderEarningsScreen";
import { RiderPerformanceScreen } from "@/screens/rider/RiderPerformanceScreen";
import type { RiderTabParamList } from "@/navigation/types";
import { colors, spacing, typography } from "@/theme";

const Tab = createBottomTabNavigator<RiderTabParamList>();

const tabIcons = {
  Jobs: "map",
  Delivery: "navigate",
  Earnings: "wallet",
  Performance: "stats-chart",
} as const;

export function RiderTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Jobs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: typography.caption, fontWeight: typography.weightMedium },
        tabBarStyle: {
          height: spacing.tabBarHeight,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: spacing.borderHairline,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={(focused ? tabIcons[route.name] : `${tabIcons[route.name]}-outline`) as keyof typeof Ionicons.glyphMap}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen name="Jobs" component={RiderJobsScreen} />
      <Tab.Screen name="Delivery" component={RiderDeliveryScreen} />
      <Tab.Screen name="Earnings" component={RiderEarningsScreen} />
      <Tab.Screen name="Performance" component={RiderPerformanceScreen} />
    </Tab.Navigator>
  );
}
