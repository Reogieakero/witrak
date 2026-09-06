import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Kill-switch: defaults to DOWN so the deployed site stays in recovery mode
// until MAINTENANCE_MODE="false" is set explicitly (e.g. in Vercel env vars).
// When active, NOBODY (student, admin, guest, API) can use the system —
// everyone sees the data-recovery notice instead.
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE !== "false";

const MAINTENANCE_BYPASS_PREFIXES = [
  "/maintenance",
  "/_next",
  "/favicon.ico",
  "/logo-favicon.png",
];

const PUBLIC_PREFIXES = [
  "/logo-favicon.png",
  "/login",
  "/auth",
  "/api/auth",
  "/api/mobile",
  "/api/openapi",
  "/docs",
  "/_next",
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

/**
 * Next.js 16 "Proxy" (formerly Middleware). Performs an optimistic auth check
 * against the Supabase session cookie and redirects unauthenticated users to
 * /login/officers. Authoritative authorization still happens per-route via `auth()`.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── MAINTENANCE MODE: system is down for data recovery ──────────────
  // Block students, admins, and guests from every page + API. Only the
  // /maintenance notice (and static assets) stays reachable.
  if (MAINTENANCE_MODE) {
    const isBypassed = MAINTENANCE_BYPASS_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    );
    if (!isBypassed) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            error:
              "System is down for data recovery due to data loss. Please try again later.",
          },
          { status: 503 },
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      url.search = "";
      return NextResponse.redirect(url, 307);
    }
    return NextResponse.next();
  }

  if (isPublic(pathname)) return NextResponse.next();

  // Misconfigured auth env: fail open rather than locking everyone out, but
  // this should never happen in a real deployment.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login/officers";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
