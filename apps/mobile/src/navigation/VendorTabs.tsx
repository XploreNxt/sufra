import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { VendorDashboardScreen } from "@/screens/vendor/VendorDashboardScreen";
import { VendorMenuScreen } from "@/screens/vendor/VendorMenuScreen";
import { VendorOrdersScreen } from "@/screens/vendor/VendorOrdersScreen";
import { VendorEarningsScreen } from "@/screens/vendor/VendorEarningsScreen";
import type { VendorTabParamList } from "@/navigation/types";
import { colors, spacing, typography } from "@/theme";

const Tab = createBottomTabNavigator<VendorTabParamList>();

const tabIcons = {
  Dashboard: "home",
  Menu: "restaurant",
  Orders: "receipt",
  Earnings: "stats-chart",
} as const;

export function VendorTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
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
      <Tab.Screen name="Dashboard" component={VendorDashboardScreen} />
      <Tab.Screen name="Menu" component={VendorMenuScreen} />
      <Tab.Screen name="Orders" component={VendorOrdersScreen} />
      <Tab.Screen name="Earnings" component={VendorEarningsScreen} />
    </Tab.Navigator>
  );
}
