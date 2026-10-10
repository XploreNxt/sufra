import type { NavigatorScreenParams } from "@react-navigation/native";
import type { FoodItem } from "@/types";

export type CustomerTabParamList = {
  Home: undefined;
  Orders: undefined;
  Cart: undefined;
  Profile: undefined;
};

export type VendorTabParamList = {
  Dashboard: undefined;
  Menu: undefined;
  Orders: undefined;
  Earnings: undefined;
};

export type RiderTabParamList = {
  Jobs: undefined;
  Delivery: undefined;
  Earnings: undefined;
  Performance: undefined;
};

export type RootStackParamList = {
  CustomerTabs: NavigatorScreenParams<CustomerTabParamList> | undefined;
  VendorTabs: NavigatorScreenParams<VendorTabParamList> | undefined;
  RiderTabs: NavigatorScreenParams<RiderTabParamList> | undefined;
  ProductDetails: { food: FoodItem };
};
