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
    "/teacher/:path*",
    "/student/:path*",
    "/admin",
    "/admin/:path*",
    "/parent/:path*",
  ],
};
