
const isPublicRoute = createRouteMatcher([
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in(.*)",
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes that aren't explicitly public
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip static files and internal Next.js routes
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|webmanifest|ico|png|jpg|jpeg|gif|svg|ttf|woff2?|csv|docx?|xlsx?|zip)).*)",
    // Include API routes
    "/(api|trpc)(.*)",
  ],
};
