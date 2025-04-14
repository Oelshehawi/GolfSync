import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isMemberRoute = createRouteMatcher(["/"]);

export default clerkMiddleware(async (auth, req) => {
  // Check if user is an admin (has course manager permission)
  const isAdmin = await auth
    .protect((has) => {
      return has({ permission: "org:coursemanager:allow" });
    })
    .catch(() => false);

  // If trying to access admin route without admin permission
  if (isAdminRoute(req) && !isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If trying to access member route with admin permission
  if (isMemberRoute(req) && isAdmin) {
    console.log("Redirecting to member route");

    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // If not a public route, require authentication
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
