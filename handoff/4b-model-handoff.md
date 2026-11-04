# 4B Model Handoff — Share Dialog Feature

## Overall Objective
Complete the Share dialog and collaborator management feature by wiring the existing ShareDialog component into the editor client layers and adding the API collaborator route. The core service (Task 1) and enrichment helper (Task 2) and ShareDialog UI (Task 3) are all verified complete with build/lint passing.

## Verified Repository State
- **Branch:** feat/editor-access-sharing (3 commits ahead of origin)
- **Completed Tasks (verified):**
  - Task 1: `lib/share-collaborators.ts` — ownership-enforced collaborator service (list/invite/remove). 7/7 service contract tests pass. Build/lint clean. ✅
  - Task 2: `lib/share-dialog-helpers.tsx` — `fetchCollaboratorByEmail` with Clerk enrichment + email-only fallback. Uses `getUserList` instead of `fetchByEmail` (approved deviation due to pinned Clerk SDK 7.5.7/3.8.2). Build/lint/tsc clean. ✅
  - Task 3: `components/editor/share-dialog.tsx` — ownership-aware ShareDialog (owner invite/remove, collaborator read-only list, copy-link Copied! feedback). `app/test-components.tsx` extended. Build/lint clean (0 new issues). ✅

## Current State — What Remains

### Task 4: Wire ShareDialog into editor layers
**Status:** Incomplete — requires composing ShareDialog into editor-navbar.tsx, editor-client.tsx, and workspace-toggle-client.tsx, plus passing share context from app/editor/[roomId]/page.tsx.

**Prerequisites:** 
- Tasks 1-3 fully complete (verified)

**Files to modify:**
- `components/editor/editor-navbar.tsx` — Add onClick handler to Share button to open ShareDialog; pass projectId, role, currentEmail, collaborators props
- `components/editor/editor-client.tsx` — Compose ShareDialog and pass project/collaborator data from owned/shared Projects
- `components/editor/workspace-toggle-client.tsx` — Ensure EditorNavbar receives proper props for ShareDialog wiring
- `app/editor/[roomId]/page.tsx` — Fetch collaborators via enrichment, pass project, role, currentEmail, collaborators to EditorClient
- `app/editor/page.tsx` — May need minor update to pass collaborator/share state

**Expected outputs:** Share button opens ShareDialog; owner sees invite form + remove; collaborator sees read-only list; copy-link shows Copied! feedback.

### Task 5: Add API collaborator route
**Status:** Incomplete — requires `app/api/projects/[projectId]/collaborators/route.ts` with GET/POST/DELETE.

**Prerequisites:** 
- Task 1 service (`lib/share-collaborators.ts`) exists and is tested
- clerkMiddleware already protects /api routes (verified in proxy.ts)

**Files to create:**
- `app/api/projects/[projectId]/collaborators/route.ts` — 
  - `GET` list collaborators (auth 401, ownership 403 via service)
  - `POST` invite collaborator by email (auth 401, ownership 403, duplicate 409, invalid 400)
  - `DELETE` remove collaborator by email (auth 401, ownership 403, 404 if not found)

**Expected outputs:** Route handles all code scenarios from Task 1 test file; build/lint passes.

### Task 6: Final verification + DoD walk
**Status:** Pending after Tasks 4-5

**Validation:**
- `npm run build` — must pass
- `npm run lint` — must pass (no new errors in changed files)
- DoD walk against acceptance criteria (all 9 criteria met)

## Critical Architectural Constraints
- No local user table — collaborators keyed by email in ProjectCollaborator (unique projectId+collaboratorEmail)
- Ownership enforcement server-side via `assertCanModifyProject` in service layer
- Clerk enrichment via `fetchCollaboratorByEmail` (email-only fallback on fetch failure)
- Role derived from ownership/collaborator data passed from composition — no Clerk identity replacement
- ShareDialog is a client component (`tsx`); role prop comes from parent composition
- Existing `clerkMiddleware` protects `/api` and `/trpc`

## First Task for 4B Model
**Run:** Start Task 4 by wiring ShareDialog into `editor-navbar.tsx` — add onClick handler to the Share button that opens the ShareDialog with proper props.

**Exact command (no-op preflight):**
```bash
# Verify current state files exist and are valid
ls -la components/editor/editor-navbar.tsx components/editor/editor-client.tsx components/editor/workspace-toggle-client.tsx app/editor/page.tsx app/editor/[roomId]/page.tsx
```

**Success criteria for Task 4 first step:** Share button in editor-navbar has an onClick that calls a state setter to open ShareDialog (initially with minimal props); no build errors.

## Preflight Validation (run before model starts)
1. Confirm `lib/share-collaborators.ts` exists and exports `getCollaborators`, `inviteCollaborator`, `removeCollaborator`
2. Confirm `lib/share-dialog-helpers.tsx` exports `fetchCollaboratorByEmail`, `CollaboratorEnrichment`
3. Confirm `components/editor/share-dialog.tsx` is a valid React component
4. Confirm `npm run build` currently passes on clean tree (baseline)
5. Confirm `npm run lint` currently passes on clean tree (baseline)

## Failure Behavior
- If any prerequisite file is missing: stop and report exact missing path
- If `npm run build` fails on known pre-existing errors (5 lint errors in untouched files): note them, proceed — Task changes must not add new errors
- If ownership enforcement logic seems ambiguous: refer to `lib/share-collaborators.ts` `assertCanModifyProject` and existing route patterns