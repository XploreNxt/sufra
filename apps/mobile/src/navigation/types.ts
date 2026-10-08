import type { NavigatorScreenParams } from "@react-navigation/native";
import type { FoodItem } from "@/types";

export type CustomerTabParamList = {
  Home: undefined;
  Orders: undefined;
  Cart: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  CustomerTabs: NavigatorScreenParams<CustomerTabParamList> | undefined;
  ProductDetails: { food: FoodItem };
};
