import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProductDetailsScreen } from "@/screens/customer/ProductDetailsScreen";
import { CustomerTabs } from "@/navigation/CustomerTabs";
import { VendorTabs } from "@/navigation/VendorTabs";
import { APP_MODE } from "@/config/app";
import type { RootStackParamList } from "@/navigation/types";
import { colors, typography } from "@/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={APP_MODE === "vendor" ? "VendorTabs" : "CustomerTabs"}
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
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: "Product Details" }}
      />
    </Stack.Navigator>
  );
}
