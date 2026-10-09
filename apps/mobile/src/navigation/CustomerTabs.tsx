import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { FeaturePlaceholderScreen } from "@/screens/customer/FeaturePlaceholderScreen";
import { HomeScreen } from "@/screens/customer/HomeScreen";
import { CartScreen } from "@/screens/customer/CartScreen";
import { ProfileScreen } from "@/screens/customer/ProfileScreen";
import { useCart } from "@/context/CartContext";
import type { CustomerTabParamList } from "@/navigation/types";
import { colors, radii, spacing, typography } from "@/theme";

const Tab = createBottomTabNavigator<CustomerTabParamList>();

const tabIcons = {
  Home: "home",
  Orders: "receipt-outline",
  Cart: "bag-handle-outline",
  Profile: "person-outline",
} as const;

function OrdersScreen() {
  return (
    <FeaturePlaceholderScreen
      title="Your orders"
      message="Your order history will appear here."
    />
  );
}

export function CustomerTabs() {
  const { itemCount } = useCart();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: typography.caption,
          fontWeight: typography.weightMedium,
        },
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
            name={route.name === "Home" && focused ? "home" : tabIcons[route.name]}
            color={color}
            size={size}
          />
        ),
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: { borderRadius: radii.md },
        ...(route.name === "Cart" && itemCount > 0
          ? {
              tabBarBadge: itemCount > 99 ? "99+" : itemCount,
              tabBarBadgeStyle: {
                backgroundColor: colors.accent,
                color: colors.white,
                fontSize: typography.caption,
              },
            }
          : {}),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
