import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { homePathForRole, PROTECTED_PREFIXES } from "@/lib/auth/roles";
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

  const { pathname } = request.nextUrl;
  const guard = PROTECTED_PREFIXES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (guard) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = (profile?.role ?? null) as UserRole | null;

    if (role !== guard.role && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = homePathForRole(role);
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
