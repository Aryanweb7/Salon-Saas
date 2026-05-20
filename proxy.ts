import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/", "/pricing", "/sign-in", "/sign-up", "/login", "/register", "/forgot-password", "/reset-password"];
const PUBLIC_PREFIXES = ["/_next", "/api/health", "/api/webhooks/razorpay", "/api/cron"];
const AUTH_API_PREFIXES = ["/api/auth", "/api/login"];
const PROTECTED_PATHS = ["/dashboard", "/customers", "/appointments", "/visits", "/marketing", "/staff", "/reports", "/billing", "/settings"];

function isPublicRoute(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PATHS.some((path) => pathname.startsWith(`${path}/`)) ||
    PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

function isProtectedRoute(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname) || AUTH_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.next();
  }

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  const token =
    (await getToken({
      req: request,
      secret,
      cookieName: "__Secure-next-auth.session-token",
    })) ??
    (await getToken({
      req: request,
      secret,
      cookieName: "next-auth.session-token",
    }));

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
