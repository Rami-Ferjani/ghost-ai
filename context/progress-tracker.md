# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Project API Integration

## Current Goal

- Implement and wire up project API routes, editor client, and project action hook for full project CRUD workflow

## Completed

- Fixed Clerk logout redirect by adding `afterSignOutUrl="/sign-in"` to the `ClerkProvider` in `app/layout.tsx` (logout-fix plan; lint + build verified, reviewed OK with notes — manual behavioral tests not exercised in headless pipeline)
- Installed shadcn/ui with Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea components
- Set up lib/utils.ts with cn() helper
- Ensured dark theme compatibility
- Implemented Editor Navbar component (components/editor/editor-navbar.tsx)
- Implemented Project Sidebar component (components/editor/project-sidebar.tsx)
- Configured ClerkProvider and added proxy.ts
- Added Sign‑In and Sign‑Up pages
- Added UserButton to editor navbar
- Protected routes except sign‑in and sign‑up
- Implemented project dialogs feature (Create, Rename, Delete) plus editor home and sidebar actions/selection/outside‑click scrim (spec 04-project-dialogs)
- Implemented Prisma ORM (spec 05-prisma):
  - Created `Project` model with ownerId, name, status enum, canvasJsonPath, timestamps, and indexes on ownerId/createdAt
  - Created `ProjectCollaborator` model with project cascade delete, email, timestamp, unique project/email constraint, and indexes on email and project/date
  - Created `lib/prisma.ts` cached singleton with branch-by-connection logic (Accelerate vs direct adapter)
  - Migration `init_projects_collaborators` applied successfully
  - Prisma Client generated

## In Progress

- Project API routes validation and error handling
- Editor client wiring with dialog error propagation
- Shared projects fetching via collaborator relation

## Next Up

- Testing the full project CRUD workflow
- Headless behavioral verification of dialog error states

## Open Questions

- Build check: `npm run build` has a pre-existing Turbopack issue with the sign-in catch-all route (unrelated to Prisma implementation)

## Architecture Decisions

- Editor chrome components are client components (they need interactivity for toggle/open state).
- Sidebar floats over the canvas (fixed positioning) so it never pushes page content.
- Prisma 7 requires the adapter to be specified in `prisma.config.ts`, not the schema file.
- Database is Prisma Postgres hosted instance (pooled.db.prisma.io).

## Session Notes

- Fixed logout redirect: added `afterSignOutUrl="/sign-in"` to `<ClerkProvider>` in `app/layout.tsx` (logout-fix plan), executed via subagent worker-per-step + fresh-context review; lint/tsc/build passed, review verdict OK with notes (manual behavioral E items 4–6 not exercised headless)
- Setting up design system as specified in context/feature-specs/01-design-system.md
- Installing shadcn/ui components: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea
- Also installing lucide-react for icons
- Implemented editor chrome as specified in context/feature-specs/02-editor.md
- Implemented Prisma ORM (spec 05-prisma): models, cached singleton client, and migration applied successfully

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Editor chrome components are client components (they need interactivity for toggle/open state).
- Sidebar floats over the canvas (fixed positioning) so it never pushes page content.

## Session Notes

- Fixed logout redirect: added `afterSignOutUrl="/sign-in"` to `<ClerkProvider>` in `app/layout.tsx` (logout-fix plan), executed via subagent worker-per-step + fresh-context review; lint/tsc/build passed, review verdict OK with notes (manual behavioral E items 4–6 not exercised headless)
- Setting up design system as specified in context/feature-specs/01-design-system.md
- Installing shadcn/ui components: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea
- Also installing lucide-react for icons
- Implemented editor chrome as specified in context/feature-specs/02-editor.md
- Fixed editor workspace page client-component prop invariant ("Event handlers cannot be passed to Client Component props"): moved sidebar-toggle state + EditorNavbar rendering into `WorkspaceToggleClient` (which now owns `sidebarOpen` and renders `EditorNavbar` with `onToggleSidebar`), and simplified `WorkspaceLayout` to a Server Component rendering only `WorkspaceToggleClient`. Removes the no-op `onToggleSidebar={() => {}}` function prop passed from the server component to the client `EditorNavbar`. Verified: lint (no issues in changed files), `npm run build` passes.
