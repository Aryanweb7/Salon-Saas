import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/pricing", "/sign-in(.*)", "/sign-up(.*)", "/login(.*)", "/register(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/customers(.*)", "/appointments(.*)", "/visits(.*)", "/staff(.*)", "/reports(.*)", "/billing(.*)", "/settings(.*)", "/admin(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isProtectedRoute(request) || isPublicRoute(request)) {
    return NextResponse.next();
  }

  await auth.protect();

  if (isAdminRoute(request)) {
    const { sessionClaims } = await auth();
    const metadata = sessionClaims?.metadata;
    const role = metadata && typeof metadata === "object" && "role" in metadata ? (metadata as { role?: string }).role : undefined;

    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"],
};
