import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

// Lightweight cookie-presence check. Full DB session validation happens per-page.
// Role guards are enforced here to prevent cross-role page renders.
export function middleware(req: NextRequest) {
  const sid = req.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = req.nextUrl;

  if (!sid) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // /teacher/[id] is the public profile page — do NOT protect it.
    // All other /teacher/* sub-paths are authenticated portal pages.
    "/teacher/dashboard",
    "/teacher/dashboard/:path*",
    "/teacher/wizard",
    "/teacher/courses/:path*",
    "/teacher/packages/:path*",
    "/teacher/sessions/:path*",
    "/student/:path*",
    "/admin",
    "/admin/:path*",
    "/parent/:path*",
  ],
};
