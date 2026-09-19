Clerk is already installed and connected.Wire it into the Next.js app: provider,auth pages,redirects,route protection, and user menu.

## design

User Clerk's dark theme from @clerk/ui/themes as the base.

Override Clerk appearance variables using the app's existing CSS variables.Do not hardcode colors.

Sign-in and sign-up pages:

-large screens:simple two-panel layout
-left:compact logo,tagline,short text-only feature list
-right:centered Clerk form
-small screen:form only
-no gradients
-no oversized hero section
-no feature cards
-no scroll-heavy layouts

keep the layout minimal and professional

wrap the root layout with clerkProvider using clerk's dark theme.

Create sign-in and sign-up using clerk components.

Use proxy.ts at the project root,not middleware.ts.

Define public routes using the existing sign-in and sign-up env vars.Protect everything else by default.

Update '/' :
-authenticated users redirect to /editor
-unauthenticated users redirect to /sign-in

Add clerk's built'in UserButton to the editor navbar right section for profile settings and logout.

Keep Clerk's default user menu and profile flow intact.Do not rebuild or heavily customize Clerk internals.

Use existing Clerk env vars.Do not rename or invent new ones.

## Dependencies

Install:@clerk/ui

## Check when done

-proxy.ts exists at the root
-all routes are protected except public auth paths
-auth pages use css variables with no hardcoded colors

- ClerkProvider wraps the root layout
  -npm run build passes
