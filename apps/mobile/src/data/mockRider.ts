import type { RiderJob, RiderTrip } from "@/types/rider";

export const RIDER_NAME = "Bilal Hussain";
export const RIDER_VEHICLE = "Motorbike";

export const MOCK_JOBS: RiderJob[] = [
  {
    id: "SF-3104",
    restaurantName: "The Green Grill",
    pickupAddress: "Block 2, PECHS, Karachi",
    customerName: "Ahmed Khan",
    dropoffAddress: "House 14, Street 6, Bahadurabad, Karachi",
    distanceKm: 3.4,
    etaMinutes: 18,
    basePay: 220,
    tipEstimate: 60,
    paymentMethod: "cash",
    orderTotal: 2300,
    items: [
      { name: "Classic Smash Burger", quantity: 2 },
      { name: "Fresh Mango Cooler", quantity: 1 },
    ],
  },
  {
    id: "SF-3105",
    restaurantName: "Forno Pizzeria",
    pickupAddress: "Main Boulevard, Gulshan-e-Iqbal, Karachi",
    customerName: "Sana Malik",
    dropoffAddress: "Flat 5B, Rufi Heights, Gulistan-e-Johar, Karachi",
    distanceKm: 5.1,
    etaMinutes: 26,
    basePay: 290,
    tipEstimate: 80,
    paymentMethod: "card",
    orderTotal: 2780,
    items: [{ name: "Wood-Fired Margherita", quantity: 2 }],
  },
  {
    id: "SF-3106",
    restaurantName: "Saffron House",
    pickupAddress: "Shop 12, Tariq Road, Karachi",
    customerName: "Usman Tariq",
    dropoffAddress: "Office 302, Shahrah-e-Faisal, Karachi",
    distanceKm: 2.2,
    etaMinutes: 12,
    basePay: 180,
    tipEstimate: 40,
    paymentMethod: "cash",
    orderTotal: 890,
    items: [{ name: "Saffron Chicken Biryani", quantity: 1 }],
  },
];

/** Weekly figures that the mock trips cannot derive (shift time, ratings, offers). */
export const WEEKLY_STATS = {
  onlineHours: 31.5,
  onTimeRate: 96,
  rating: 4.8,
  ratingCount: 212,
  offersAccepted: 46,
  offersDeclined: 4,
};

const DAY_MS = 86_400_000;
const TRIP_RESTAURANTS = ["The Green Grill", "Forno Pizzeria", "Saffron House", "Fresh Table"];
const TRIP_DROPOFFS = ["Bahadurabad", "Gulistan-e-Johar", "Shahrah-e-Faisal", "Clifton", "PECHS"];

/** Seven days of finished deliveries ending now, so "Today" always has data. */
export const MOCK_TRIPS: RiderTrip[] = (() => {
  const now = Date.now();
  const trips: RiderTrip[] = [];
  for (let day = 0; day < 7; day += 1) {
    const count = 4 + ((day * 3) % 4);
    for (let k = 0; k < count; k += 1) {
      trips.push({
        id: `T${day}-${k}`,
        deliveredAt: new Date(now - day * DAY_MS - (k + 1) * 50 * 60_000).toISOString(),
        restaurantName: TRIP_RESTAURANTS[(day + k) % TRIP_RESTAURANTS.length],
        dropoffAddress: TRIP_DROPOFFS[(day * 2 + k) % TRIP_DROPOFFS.length],
        distanceKm: 2 + ((day + k) % 5) * 0.8,
        basePay: 180 + (((day + k) * 37) % 120),
        tip: k % 3 === 0 ? 0 : 30 + ((k * 20) % 70),
      });
    }
  }
  return trips;
})();
