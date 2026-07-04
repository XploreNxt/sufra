import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";

export default async function VendorDashboard() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?next=/vendor");
  if (profile.role !== "vendor" && profile.role !== "admin") redirect("/");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
        <h1 className="text-2xl font-bold text-neutral-900">
          Vendor dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Order queue, menu CRUD and earnings arrive in Phase 4.
        </p>
        <div className="mt-6 space-y-4">
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Signed in as{" "}
            <span className="font-semibold">
              {profile.full_name ?? profile.phone}
            </span>{" "}
            ({profile.role})
          </p>
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
