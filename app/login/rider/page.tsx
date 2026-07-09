import { StaffLoginForm } from "@/components/staff-login-form";
import { PORTALS } from "@/lib/auth/portals";

export const metadata = { title: "Sufra Rider — Sign in" };

export default function RiderLoginPage() {
  const p = PORTALS.rider;
  return (
    <StaffLoginForm
      requiredRole={p.role}
      label={p.label}
      badgeClass={p.badgeClass}
    />
  );
}
