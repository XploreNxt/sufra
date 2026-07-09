import { StaffLoginForm } from "@/components/staff-login-form";
import { PORTALS } from "@/lib/auth/portals";

export const metadata = { title: "Sufra Vendor — Sign in" };

export default function VendorLoginPage() {
  const p = PORTALS.vendor;
  return (
    <StaffLoginForm
      requiredRole={p.role}
      label={p.label}
      badgeClass={p.badgeClass}
    />
  );
}
