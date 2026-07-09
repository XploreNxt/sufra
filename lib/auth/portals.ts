import type { UserRole } from "@/types";

export type PortalKey = "vendor" | "rider" | "admin";

export interface Portal {
  key: PortalKey;
  role: UserRole;
  /** Internal filesystem base these clean URLs rewrite to. */
  base: string;
  /** Internal login route for this portal. */
  loginPath: string;
  /** Badge text shown next to the Sufra logo. */
  label: string;
  /** Tailwind classes for the badge chip. */
  badgeClass: string;
}

export const PORTALS: Record<PortalKey, Portal> = {
  vendor: {
    key: "vendor",
    role: "vendor",
    base: "/vendor",
    loginPath: "/login/vendor",
    label: "Vendor",
    badgeClass: "bg-amber-500 text-amber-950",
  },
  rider: {
    key: "rider",
    role: "rider",
    base: "/rider",
    loginPath: "/login/rider",
    label: "Rider",
    badgeClass: "bg-sky-500 text-sky-950",
  },
  admin: {
    key: "admin",
    role: "admin",
    base: "/admin",
    loginPath: "/login/admin",
    label: "Admin",
    badgeClass: "bg-stone-800 text-white",
  },
};

const PORTAL_KEYS = Object.keys(PORTALS) as PortalKey[];

/**
 * Which portal a request belongs to, from the Host header's first label.
 *  vendor.sufra.com / vendor.localhost:3000 → vendor portal
 *  sufra.com / www.sufra.com / localhost     → null (customer app)
 */
export function portalFromHost(host: string | null | undefined): Portal | null {
  if (!host) return null;
  const label = host.split(":")[0].split(".")[0].toLowerCase();
  return (PORTAL_KEYS as string[]).includes(label)
    ? PORTALS[label as PortalKey]
    : null;
}
