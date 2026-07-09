import { StaffLoginForm } from "@/components/staff-login-form";
import { PORTALS } from "@/lib/auth/portals";

export const metadata = { title: "Sufra Admin — Sign in" };

export default function AdminLoginPage() {
  const p = PORTALS.admin;
  return (
    <StaffLoginForm
      requiredRole={p.role}
      label={p.label}
      badgeClass={p.badgeClass}
    />
  );
}
