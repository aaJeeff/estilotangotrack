// Edge proxy (formerly "middleware"): refreshes the Supabase session cookie on
// every request and gates routes by role. Role is read from `app_metadata`
// (no DB call here).

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { homePathForRole, readRole } from "@/shared/lib/auth/roles";

// Paths reachable without authentication.
const PUBLIC_PAGE_PREFIXES = ["/login", "/invite", "/reset-password", "/auth"];
// API routes with their own authentication (provider signature / cron secret).
const PUBLIC_API_PREFIXES = ["/api/webhooks", "/api/cron", "/api/health"];

function isPublic(pathname: string): boolean {
  return (
    PUBLIC_PAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))
  );
}

export async function proxy(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Resolve the user defensively: a Supabase outage/misconfig must not 500 the app.
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    user = null;
  }

  const { pathname } = request.nextUrl;

  // Authenticated users hitting an auth page go to their home.
  if (user && PUBLIC_PAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = homePathForRole(readRole(user));
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isPublic(pathname)) return response;

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  const role = readRole(user);

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = homePathForRole(role);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = "/portal/orders";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/portal") && role !== "CLIENT") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
