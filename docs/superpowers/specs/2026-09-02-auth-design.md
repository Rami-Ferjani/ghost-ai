# Auth Feature Design

**Scope:** Implement Clerk‑based authentication for Ghost AI.

## Files Added / Updated
- `app/layout.tsx` – wrap root with `ClerkProvider` using Clerk’s dark theme.
- `app/page.tsx` – root redirect logic based on Clerk auth state.
- `app/sign-in/page.tsx` and `app/sign-up/page.tsx` – Clerk form pages.
- `proxy.ts` – Clerk proxy route.
- `app/editor/components/editor-navbar.tsx` – add Clerk `UserButton`.
- `app/editor/layout.tsx` (if exists) – protect all editor routes.
- `app/_app.tsx` or route‑wrapper – optional middleware replacement.

## Routing
- Public:
  - `/sign-in` (custom layout with two‑panel or single form). 
  - `/sign-up`.
- Protected:
  - All other routes, including `/editor`.

## Auth Flow
- The root layout provides Clerk provider globally.
- `proxy.ts` ensures redirects to Clerk for sign‑in/up.
- `/` page checks `useUser()` or `redirectTo` from Clerk and redirects.
- `UserButton` displays profile menu in the editor navbar.

## Styling
- Use Clerk’s dark theme tokens, override via CSS variables if needed. No hard‑coded colors.
- Form layout: left panel (logo, tagline, short list) on large screens; right panel centered; only Clerk form on small screens.

## Testing
- Verify that unauthenticated users see sign‑in/up.
- Verify that authenticated users are redirected to `/editor` from `/`.
- Verify that `/editor` is protected and shows the `UserButton`.
- Verify that Clerk proxy routes work.

**Note:** Do not alter existing Clerk UI beyond switching the theme.
