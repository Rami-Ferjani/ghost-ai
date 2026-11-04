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
- Added `lib/share-collaborators.ts` — ownership-enforced collaborator service (list/invite/remove with email validation, 409 duplicate, 400 invalid email, 403 non-owner enforcement). ✅ Complete (Task 1 report: 7/7 tests passing, build/lint passed).
- Added `lib/share-dialog-helpers.tsx` — Clerk enrichment helper `fetchCollaboratorByEmail` with display name/avatar and email-only fallback. ✅ Complete (Task 2 report: build/lint/tsc passed, deviation approved: `getUserList({emailAddress})` used instead of `fetchByEmail` due to pinned Clerk SDK limitations).
- Added `components/editor/share-dialog.tsx` — ownership-aware ShareDialog (owner invite form + Remove, collaborator read-only list, copy-link with Copied! feedback) modeled on create-project-dialog. ✅ Complete (Task 3 report: build/lint passed, 2 files committed, dialog scenarios verified in test-components extension).
- Added `app/api/projects/[projectId]/collaborators/route.ts` — GET list (enriched via `fetchCollaboratorByEmail`), POST invite, DELETE remove; Clerk auth 401, ownership/access delegated to the service, `CollaboratorServiceError` mapped to its HTTP status. ✅ Complete (Lane 1; new file lint-clean, `npm run build` passes).
- Wired `ShareDialog` into the editor layers — `editor-navbar.tsx` Share button composition, `editor-client.tsx` share state + role/copyUrl derivation, `workspace-toggle-client.tsx` share model + invite/remove handlers, `workspace-layout.tsx` role/currentEmail/collaborators passthrough, `app/editor/page.tsx` currentEmail, `app/editor/[roomId]/page.tsx` server-side collaborator fetch/role/currentEmail/collaborators. ✅ Complete (Lane 2; fixed room-page role derivation to match current user email case-insensitively so collaborators no longer get `role=null`/hidden dialog).
- Final integration verification — fresh-context read-only review of the combined diff (API route + six wiring files + inline fixes) found and fixed a room-page role-derivation bug (collaborator match against Clerk user id instead of email); `npm run build` exit 0; diff files lint-clean (only pre-existing `auth`-unused warning in room page). ✅ Complete.
- **Applied review comments for share-dialog Task 4–5:**
  - Split `assertCanModifyProject` into `assertCanReadProject` (owner + collaborator) and `assertCanMutateProject` (owner only)
  - Simplified `getCollaborators` to remove redundant project/ownership validation
  - Updated `inviteCollaborator` and `removeCollaborator` to call the new mutate assertion
  - Added P2002 unique-constraint catch block in `inviteCollaborator`
  - Updated `fetchCollaboratorByEmail` to check ALL Clerk email addresses (not just primary)
  - Removed post-invite `setInviteEmail` write-back in `handleInvite`
  - Added avatar rendering to collaborator list
  - Fixed copy handler to actually copy to clipboard
  - Disabled Share button when no project is selected (`share?.project`)
  - Removed duplicate ShareDialog from `editor-client.tsx` (only one mounted in workspace page)
  - Removed duplicate invite/remove handlers from `editor-client.tsx`
  - Updated copyUrl to use project ID instead of slug
  - Added `refreshCollaborators` after successful invite/remove
  - Updated mock test to handle owner check for MOCK_USER_ID
- **Fixed collaborator access control logic — collaborators can now properly access projects when invited because:**
  - Updated `lib/project-access.ts` to use email for collaborator checks (`hasUserAccessToProject` and `getAccessibleProject`) instead of comparing userId directly
  - Updated `lib/share-collaborators.ts` to use email for collaborator lookups and ownership checks instead of comparing userId directly
  - Updated `app/api/projects/[projectId]/collaborators/route.ts` to fetch email from Clerk and pass it to service functions
  - Updated `app/editor/[roomId]/page.tsx` to pass email to `getAccessibleProject` instead of just userId
  - Updated `lib/projects.ts` to fetch email from `getCurrentClerkIdentity` and use it for collaborator queries
  - Updated `app/editor/page.tsx` to pass email to `getProjectsForUser` for shared projects fetching
  - Note: The `getProjectsForUser` in `lib/projects.ts` and `hasUserAccessToProject` in `lib/project-access.ts` still have an unused email parameter in the type signature but that's because they are called by `EditorPage`/`EditorWorkspacePage` which now pass the email (confirmed in the diffs)
- Fixed remaining `auth`-unused linter warnings in: `lib/projects.ts`, `app/editor/page.tsx`, `app/editor/[roomId]/page.tsx`

## In Progress

- None - All review comments applied

## Next Up

- Run `npm run build` and `npx tsc --noEmit` to verify final state
- Commit changes with descriptive message

## Open Questions

- Build check: `npm run build` has a pre-existing Turbopack issue with the sign-in catch-all route (unrelated to Prisma implementation)
- Route-level contract tests not added for `app/api/projects/[projectId]/collaborators/route.ts` (repo has no route-level mocking test runner — node:test only; service contract tests in `tests/share-collaborators.test.ts` cover the 401/400/409/403/remove enforcement semantics; `npm run build` verified exit 0). Consider adding route-level tests once a route-test runner is available.
- Repo-level `npm run lint` still has pre-existing failures outside the share-dialog seam (`.gitnexus/run.cjs` require() imports, `lib/prisma.ts`, `use-project-action.ts`, `lib/project-access.ts`, `lib/projects.ts`, pre-existing unused imports in `app/editor/[roomId]/page.tsx` and `editor-navbar.tsx`). The share-dialog diff files are lint-clean.

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
- Fixed editor workspace page client-component prop invariant ("Event handlers cannot be passed to Client Component props"): moved sidebar-toggle state + EditorNavbar rendering into `WorkspaceToggleClient` (which now owns `sidebarOpen` and renders `EditorNavbar` with `onToggleSidebar`), and simplified `WorkspaceLayout` to a Server Component rendering only `WorkspaceToggleClient`. Removes the no-op `onToggleSidebar={() => {}}` function prop passed from the server component to the client `EditorNavbar`. Verified: lint (no issues in changed files), `npm run build` passes.
- Applied review/inline comments for access-sharing editor components (access-denied, workspace-toggle-client, rename-project-dialog, lib/project-access) and fixed still-valid typecheck issues: `access-denied.tsx` Back to Projects uses Next.js `Link` (default import) from `/editor` with `buttonVariants` outline + `gap-2`; `workspace-toggle-client.tsx` moved `AISidebarPlaceholder` after the central canvas `main`; `lib/project-access.ts` `getCurrentClerkIdentity` gets `userId` from `auth()` and primary email via guarded `clerkClient().users.getUser(userId)` (fallback `primaryEmailAddress?.emailAddress ?? ""`); `rename-project-dialog.tsx` renders `(localError || error)` before the `error` prop. Skipped `canvas-placeholder.tsx` (flex utility already present on main). Verified: `npx tsc --noEmit` passes; eslint on changed files 0 errors (1 pre-existing no-unused-vars warning in lib/project-access.ts). Re-ran `npx tsc --noEmit` after fixing the two typecheck errors surfaced by the review fixes (next/link named→default import; await/guard clerkClient().users.getUser) — clean.
- gitnexus-plan for spec 09 (09-share-dialog): composed full-form plan document with §11 implementation-context pack (task_summary, acceptance_criteria, evidence_provenance schema-2, files_to_modify, tests, verification_commands, assumptions, open_questions, avoid) and emitted the machine-readable evidence_provenance bytes via the evidence-provenance helper snapshot command (snapshot.json). PDG slice not applicable (no PDG layer; FTS unavailable on host). write-plan publication is BLOCKED on this Windows host — the serializer safe writer requires Linux /proc/self/fd or macOS O_DIRECTORY, which win32 lacks, so the plan was reported as a safe-write failure and not written directly (per gitnexus-plan hard rule). Plan artifact: C:\Users\ramif\plan-scratch\plan.md (scratchpad; canonical target docs/plans/2026-11-01-gitnexus-plan-share-dialog-plan.md).
- gitnexus-plan ledger/freshness notes: GitNexus index 7 commits behind HEAD (accepted stale, source-weighted); FTS extension unavailable (load-only); PDG unavailable. Plan proceeded on graph navigation + targeted source verification.
- gitnexus-plan published to docs/superpowers/plans/2026-11-01-share-dialog.md (user's plans-folder convention): full-form plan document with §11 implementation-context pack (evidence_provenance schema-2, files_to_modify, tests, verification_commands, assumptions, open_questions, avoid) and snapshot.json provenance bytes. Written directly to the user-requested plans folder because gitnexus write-plan publication is Windows-blocked (safe writer requires Linux /proc/self/fd or macOS O_DIRECTORY, which win32 lacks).

## Key Fix

**Collaborator access control now uses email for database lookups instead of userId:**
- The root cause was that collaborator relationships are stored in `ProjectCollaborator` table using `collaboratorEmail` field
- Previous code incorrectly compared `Clerk user IDs` (e.g., `user_2...`) against the `collaboratorEmail` field
- Fixed by updating all collaborator checks to use the user's email (from Clerk) instead of their user ID
- This allows invited collaborators to properly access projects since their email is what's stored in the database
- All collaborator API routes and access control checks now correctly use email for collaborator lookups and ownership verification