import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { MOCK_JOBS, MOCK_TRIPS, WEEKLY_STATS } from "@/data/mockRider";
import type { ActiveDelivery, RiderJob, RiderTrip } from "@/types/rider";

interface RiderContextValue {
  online: boolean;
  setOnline: (online: boolean) => void;
  jobs: RiderJob[];
  active: ActiveDelivery | null;
  trips: RiderTrip[];
  offers: { accepted: number; declined: number };
  acceptJob: (id: string) => void;
  declineJob: (id: string) => void;
  confirmPickup: () => void;
  /** Finishes the active delivery and returns the trip that was recorded. */
  confirmDelivery: () => RiderTrip | null;
}

const RiderContext = createContext<RiderContextValue | null>(null);

export function RiderProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [jobs, setJobs] = useState<RiderJob[]>(MOCK_JOBS);
  const [active, setActive] = useState<ActiveDelivery | null>(null);
  const [trips, setTrips] = useState<RiderTrip[]>(MOCK_TRIPS);
  const [offers, setOffers] = useState({
    accepted: WEEKLY_STATS.offersAccepted,
    declined: WEEKLY_STATS.offersDeclined,
  });

  // One delivery at a time: accepting is ignored while another is in progress.
  const acceptJob = useCallback(
    (id: string) => {
      const job = jobs.find((j) => j.id === id);
      if (!job || active) return;
      setActive({ job, stage: "to_pickup" });
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setOffers((prev) => ({ ...prev, accepted: prev.accepted + 1 }));
    },
    [jobs, active]
  );

  const declineJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setOffers((prev) => ({ ...prev, declined: prev.declined + 1 }));
  }, []);

  const confirmPickup = useCallback(() => {
    setActive((prev) => (prev ? { ...prev, stage: "to_dropoff" } : prev));
  }, []);

  const confirmDelivery = useCallback(() => {
    if (!active || active.stage !== "to_dropoff") return null;
    const { job } = active;
    const trip: RiderTrip = {
      id: job.id,
      deliveredAt: new Date().toISOString(),
      restaurantName: job.restaurantName,
      dropoffAddress: job.dropoffAddress,
      distanceKm: job.distanceKm,
      basePay: job.basePay,
      tip: job.tipEstimate,
    };
    setTrips((prev) => [trip, ...prev]);
    setActive(null);
    return trip;
  }, [active]);

  const value = useMemo(
    () => ({ online, setOnline, jobs, active, trips, offers, acceptJob, declineJob, confirmPickup, confirmDelivery }),
    [online, jobs, active, trips, offers, acceptJob, declineJob, confirmPickup, confirmDelivery]
  );

  return <RiderContext.Provider value={value}>{children}</RiderContext.Provider>;
}

export function useRider() {
  const ctx = useContext(RiderContext);
  if (!ctx) throw new Error("useRider must be used inside RiderProvider");
  return ctx;
}
