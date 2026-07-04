import type { UserRole } from "@/types";

/** Where each role lands after login. */
export const ROLE_HOME: Record<UserRole, string> = {
  customer: "/",
  vendor: "/vendor",
  rider: "/rider",
  admin: "/admin",
};

/** Route prefixes that require a specific role. */
export const PROTECTED_PREFIXES: Array<{ prefix: string; role: UserRole }> = [
  { prefix: "/vendor", role: "vendor" },
  { prefix: "/rider", role: "rider" },
  { prefix: "/admin", role: "admin" },
];

export function homePathForRole(role: UserRole | null | undefined): string {
  return role ? ROLE_HOME[role] : "/";
}
