import "react-native-gesture-handler";

import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SplashOverlay } from "@/components/common/SplashOverlay";
import { CartProvider } from "@/context/CartContext";
import { OrderProvider } from "@/context/OrderContext";
import { VendorProvider } from "@/context/VendorContext";
import { RootNavigator } from "@/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <CartProvider>
          <OrderProvider>
            <VendorProvider>
              <RootNavigator />
            </VendorProvider>
          </OrderProvider>
        </CartProvider>
      </NavigationContainer>
      <SplashOverlay />
    </SafeAreaProvider>
  );
}
