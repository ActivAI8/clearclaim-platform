import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Public routes - no auth required
  const publicRoutes = ["/", "/login", "/api/setup/seed-auth"];
  if (publicRoutes.includes(path) || path.startsWith("/api/")) {
    return supabaseResponse;
  }

  // If not logged in, redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  const role = user.user_metadata?.role as string | undefined;

  // Veterans can only access /veteran/* routes
  if (role === "veteran" && path.startsWith("/staff")) {
    const url = request.nextUrl.clone();
    url.pathname = "/veteran/portal";
    return NextResponse.redirect(url);
  }

  // Staff cannot access /veteran/portal (they use /veteran for the selection view)
  if (role && role !== "veteran" && path.startsWith("/veteran/portal")) {
    const url = request.nextUrl.clone();
    url.pathname = "/staff";
    return NextResponse.redirect(url);
  }

  // Admin routes require org_admin or site_admin
  if (path.startsWith("/admin")) {
    if (role !== "org_admin" && role !== "site_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/staff";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)",
  ],
};
