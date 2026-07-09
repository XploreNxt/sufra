import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { portalFromHost } from "@/lib/auth/portals";
import type { UserRole } from "@/types";

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session if expired — required for Server Components.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  async function getRole(): Promise<UserRole | null> {
    if (!user) return null;
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    return (data?.role ?? null) as UserRole | null;
  }

  // Carry any refreshed-session cookies onto a redirect/rewrite response.
  function redirectTo(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  }
  function rewriteTo(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const res = NextResponse.rewrite(url, { request });
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  }

  const portal = portalFromHost(request.headers.get("host"));
  const { pathname } = request.nextUrl;

  // ---------------- Staff portal subdomains ----------------
  // vendor.sufra.com, rider.sufra.com, admin.sufra.com (and *.localhost).
  // URLs stay clean ("/menu"); we rewrite to the internal base ("/vendor/menu").
  if (portal) {
    // The portal's own login page, served at <sub>/login.
    if (pathname === "/login") {
      if (user && (await getRole()) === portal.role) {
        return redirectTo("/"); // already signed in → dashboard
      }
      return rewriteTo(portal.loginPath);
    }

    // Everything else on the subdomain requires the matching role.
    const role = await getRole();
    if (!user || role !== portal.role) {
      return redirectTo("/login");
    }

    const internal =
      pathname === "/" ? portal.base : `${portal.base}${pathname}`;
    return rewriteTo(internal);
  }

  // ---------------- Apex / customer domain ----------------
  // Staff areas and portal logins are never exposed on the customer domain.
  if (
    pathname === "/vendor" ||
    pathname.startsWith("/vendor/") ||
    pathname === "/rider" ||
    pathname.startsWith("/rider/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/login/")
  ) {
    return redirectTo("/");
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
