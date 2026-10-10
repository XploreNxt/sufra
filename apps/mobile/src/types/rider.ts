export interface RiderJobLine {
  name: string;
  quantity: number;
}

/** A delivery offer the rider can accept or decline. */
export interface RiderJob {
  id: string;
  restaurantName: string;
  pickupAddress: string;
  customerName: string;
  dropoffAddress: string;
  distanceKm: number;
  etaMinutes: number;
  basePay: number;
  tipEstimate: number;
  paymentMethod: "cash" | "card";
  orderTotal: number;
  items: RiderJobLine[];
}

export type DeliveryStage = "to_pickup" | "to_dropoff";

export interface ActiveDelivery {
  job: RiderJob;
  stage: DeliveryStage;
}

/** A finished delivery, used for earnings and weekly stats. */
export interface RiderTrip {
  id: string;
  deliveredAt: string; // ISO
  restaurantName: string;
  dropoffAddress: string;
  distanceKm: number;
  basePay: number;
  tip: number;
}

export type RiderEarningsRange = "today" | "7d";
