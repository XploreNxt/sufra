import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProductDetailsScreen } from "@/screens/customer/ProductDetailsScreen";
import { CustomerTabs } from "@/navigation/CustomerTabs";
import { VendorTabs } from "@/navigation/VendorTabs";
import { RiderTabs } from "@/navigation/RiderTabs";
import { APP_MODE } from "@/config/app";
import type { RootStackParamList } from "@/navigation/types";
import { colors, typography } from "@/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

const HOME_ROUTES = {
  customer: "CustomerTabs",
  vendor: "VendorTabs",
  rider: "RiderTabs",
} as const;

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={HOME_ROUTES[APP_MODE]}
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontSize: typography.bodyLarge,
          fontWeight: typography.weightSemibold,
        },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="CustomerTabs"
        component={CustomerTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VendorTabs"
        component={VendorTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RiderTabs"
        component={RiderTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: "Product Details" }}
      />
    </Stack.Navigator>
  );
}
