import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProductDetailsScreen } from "@/screens/customer/ProductDetailsScreen";
import { CustomerTabs } from "@/navigation/CustomerTabs";
import type { RootStackParamList } from "@/navigation/types";
import { colors, typography } from "@/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="CustomerTabs"
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primaryDark,
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
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: "Product Details" }}
      />
    </Stack.Navigator>
  );
}
