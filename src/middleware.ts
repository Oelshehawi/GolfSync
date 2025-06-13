import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isMemberRoute = createRouteMatcher(["/members(.*)"]);
const isRootRoute = createRouteMatcher(["/"]);

export default clerkMiddleware(async (auth, req) => {
  try {
    const { sessionClaims } = await auth();

    // Check user types using metadata
    const isAdmin = (sessionClaims as any)?.publicMetadata?.isAdmin === true;
    const isMember = (sessionClaims as any)?.publicMetadata?.isMember === true;

    // Redirect root path based on user role
    if (isRootRoute(req)) {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      if (isMember) {
        return NextResponse.redirect(new URL("/members", req.url));
      }
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // If trying to access admin route without admin permission, redirect to sign-in
    if (isAdminRoute(req) && !isAdmin) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // If trying to access member route as admin, redirect to admin
    if (isMemberRoute(req) && isAdmin) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // If trying to access member route without member permission and not admin, redirect to sign-in
    if (isMemberRoute(req) && !isMember && !isAdmin) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // If not a public route, require authentication
    if (!isPublicRoute(req)) {
      await auth.protect();
    }

    return NextResponse.next();
  } catch (error) {
    // If there's an error with authentication, redirect to sign-in
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
