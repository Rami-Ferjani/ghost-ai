# GitNexus Engineering Plan

> Task: Add Share dialog and collaborator management to the editor — owner invites/removes collaborators by email, collaborator read-only list, copy-link with `Copied!` feedback — backed by ownership-enforced list/invite/remove API and Clerk enrichment.
> Evidence verified at commit 6f758f48d94e56e7d9746b7f399ce37dbf0ff9fe; GitNexus index 7 commits behind HEAD, refresh skipped (feature category accepts stale graph; source-weighted). FTS extension unavailable (load-only policy); PDG layer unavailable in this session (slice skipped).
> Evidence provenance schema 2; global dirty digest sha256:68ca4a2b0f4b356db2fae2dcff284606b6604425b54bbe8e16ea5c5f2615f9f0; cited-path manifest 19 sorted entries; exact generated plan path excluded.

## Objective (§1)

Add a Share button-driven share dialog to the editor navbar; owners can invite/remove collaborators by email, view the collaborator list, and copy a link with `Copied!` feedback; collaborators see only a read-only collaborator list; collaborators are persisted by email in `ProjectCollaborator`; the list is enriched with Clerk display name/avatar with an email-only fallback; add list/invite/remove collaborator API with server-side ownership enforcement (no local user table); done check `npm run build` passes.

## Current Behaviour (§2–3)

- The editor navbar already renders a Share button composed into `EditorClient`; no share dialog exists yet ([verified] `components/editor/editor-navbar.tsx`).
- `EditorClient` composes `EditorNavbar`, `ProjectSidebar`, `EditorHome` and dialogs, and `EditorPage` (server component) fetches `ownedProjects`/`sharedProjects` via `getProjectsForUser` and passes `currentUserId` ([verified] `app/editor/page.tsx`, `components/editor/editor-client.tsx`).
- `ProjectCollaborator` (unique `projectId`+`collaboratorEmail`, email indexes) and `Project` (`ownerId`, indexes) exist; access helpers `getCurrentClerkIdentity`/`hasUserAccessToProject`/`getAccessibleProject` and `getProjectsForUser` are in place ([verified] `prisma/schema.prisma`, `lib/project-access.ts`, `lib/projects.ts`).
- Existing project API routes enforce ownership (`403`) with auth (`401`); `clerkMiddleware` protects `/api` and `/trpc` ([verified] `app/api/projects/route.ts`, `app/api/projects/[projectId]/route.ts`, `proxy.ts`).
- No collaborator list/invite/remove API, no share dialog, no collaborator enrichment helper, no local user table ([inferred] from spec `09-share-dialog.md` absence).

## Findings (§4–5)

- Feature spec `09-share-dialog.md` defines the deliverable requirements: share dialog, invite/remove by email, collaborator list, `Copied!` feedback, Clerk enrichment, ownership enforcement, `npm run build` check ([verified] spec read).
- GitNexus graph contains no existing share/collaborator process; the change is additive over existing access helpers and API routes ([graph]; [verified] source).
- PDG layer unavailable in this session (no `pdg_query` tool exposed) — statement-level PDG findings skipped; recommend `analyze --index-only --pdg` via `.gitnexus/run.cjs`.
- GitNexus index is 7 commits behind HEAD and the FTS extension failed to load; findings are source-weighted and labelled stale/fallback ([graph], stale-index noted).

## Proposed Changes (§6)

- `lib/share-collaborators.ts` (new): service wrapping `getPrismaClient`; list/invite/remove collaborators with ownership enforcement (owner or collaborator) and email validation. [inferred — spec-backed design]
- `lib/share-dialog-helpers.tsx` (new): Clerk enrichment helper `fetchCollaboratorByEmail` → display name/avatar with email-only fallback. [inferred — spec-backed design]
- `components/editor/share-dialog.tsx` (new): share dialog modeled on `create-project-dialog.tsx`; owner sees invite/remove, collaborator sees read-only list, copy-link with `Copied!` feedback. [inferred — pattern-referenced]
- `components/editor/editor-navbar.tsx` (edit): wire Share button to open `ShareDialog`.
- `components/editor/editor-client.tsx` (edit): compose `ShareDialog` and pass project/collaborator data.
- `app/editor/page.tsx` (edit): pass share context (collaborators, share state) to `EditorClient`.
- `app/editor/[roomId]/page.tsx` (edit): pass share context.
- `app/api/projects/[projectId]/collaborators/route.ts` (new): `GET` list, `POST` invite, `DELETE` remove; auth `401`, ownership `403`, duplicate email `409`, invalid email `400`.
- No local user table; reuse Clerk identity and existing `clerkMiddleware` protection.

## Implementation Sequence (§7)

1. Add `lib/share-collaborators.ts` (list/invite/remove) with ownership + email validation. ✅ Complete — `98b0fe3` (`feat(editor-access-sharing): add ownership-enforced collaborator service and contract tests`). Risk note: unique `(projectId, collaboratorEmail)` → duplicate invite returns `409`.
2. Add `lib/share-dialog-helpers.tsx` enrichment helper (email-only fallback). ✅ Complete — `00869df` (`feat(editor-access-sharing): add share dialog Clerk enrichment helper with email-only fallback`). Risk note: enrichment fetch failure falls back to email-only.
3. Add `components/editor/share-dialog.tsx` modeled on `create-project-dialog.tsx`. ✅ Complete — `225c9b3` (`feat(editor-access-sharing): add ShareDialog component and extend test-components`). Risk note: read-only enforcement for non-owner must be ownership-aware.
4. Wire `ShareDialog` into `editor-navbar.tsx`, `editor-client.tsx`, `workspace-toggle-client.tsx` (using existing EditorClient composition pattern). Incomplete — requires adding ShareDialog composition and passing project/collaborator data from `EditorPage`/`EditorWorkspacePage` to `EditorClient`. Add `app/api/projects/[projectId]/collaborators/route.ts` (GET/POST/DELETE) with auth + ownership enforcement. Part of Task 5 — API route service integration.
6. Verify with `npm run build` and `npm run lint`, DoD walk. Incomplete — pending final wiring verification.

## Test Strategy (§8)

- No automated test suite exists in the repo ([assumed]). Add API contract tests for the collaborator route: `GET` list, `POST` invite owner → `200`, non-owner → `403`, duplicate email → `409`, invalid email → `400`, `DELETE` remove owner → `200`, non-owner → `403`.
- Dialog tests: owner sees invite form, collaborator sees read-only list, copy-link shows `Copied!` feedback.
- Edge cases: duplicate invite, remove non-owner, enrichment fallback, collaborator view read-only.
- Verification commands: `npm run build` and `npm run lint` (exist in `package.json`).

## 9. Risk and Impact Analysis

- Risk: inviting the same collaborator twice collides with the unique `(projectId, collaboratorEmail)` constraint → map to `409 Conflict` ([verified] `prisma/schema.prisma`).
- Risk: non-owner invite/remove is rejected by ownership check → `403 Forbidden` ([verified] existing PATCH/DELETE project-route pattern).
- Risk: collaborator enrichment fetch failure falls back to email-only display ([inferred]).
- Risk: read-only enforcement for collaborators depends on the ownership check flowing through the service layer ([inferred]).
- Impact: additive change over existing access helpers, API auth, and Dialog patterns; no new local user table; no architectural boundary change ([graph], source-weighted).

## 10. Files Expected to Change

- `lib/share-collaborators.ts` (new) — collaborator list/invite/remove service with ownership + email validation.
- `lib/share-dialog-helpers.tsx` (new) — Clerk enrichment helper with email-only fallback.
- `components/editor/share-dialog.tsx` (new) — share dialog with owner/collaborator view and `Copied!` feedback.
- `components/editor/editor-navbar.tsx` (edit) — wire Share button to open ShareDialog.
- `components/editor/editor-client.tsx` (edit) — compose ShareDialog and pass share context.
- `app/editor/page.tsx` (edit) — pass share context to EditorClient.
- `app/editor/[roomId]/page.tsx` (edit) — pass share context.
- `app/api/projects/[projectId]/collaborators/route.ts` (new) — GET list, POST invite, DELETE remove with auth + ownership enforcement.
- Read-only reuse (no new files): `prisma/schema.prisma`, `lib/project-access.ts`, `lib/projects.ts`, `components/editor/create-project-dialog.tsx`.

## Implementation Context (§11)


```json
{
  "implementation_context": {
    "task_summary": "Add Share dialog and collaborator management to the editor: owner invites/removes collaborators by email, collaborator read-only list, copy-link with Copied! feedback; persisted by email in ProjectCollaborator with Clerk enrichment; ownership-enforced list/invite/remove API.",
    "acceptance_criteria": [
      "Editor navbar Share button opens the share dialog.",
      "Owner can invite/remove collaborators by email; collaborator list viewable by owners and collaborators.",
      "Collaborator list is read-only for non-owner.",
      "Copy link produces Copied! feedback.",
      "Collaborators persisted by email in ProjectCollaborator; list enriched with Clerk display name/avatar with email-only fallback.",
      "List/invite/remove collaborator API enforces ownership (403 for non-owner), auth (401), duplicate email (409), invalid email (400).",
      "npm run build passes."
    ],
    "evidence_provenance": {
      "schema_version": 2,
      "head_commit": "6f758f48d94e56e7d9746b7f399ce37dbf0ff9fe",
      "generated_plan_path": "docs/plans/2026-11-01-gitnexus-plan-share-dialog-plan.md",
      "global_dirty_digest": {
        "algorithm": "sha256",
        "canonicalization": "gitnexus-evidence-provenance-v2 NUL-framed UTF-8 records",
        "value": "68ca4a2b0f4b356db2fae2dcff284606b6604425b54bbe8e16ea5c5f2615f9f0"
      },
      "cited_path_manifest": [
        {
          "path": "app/api/projects/[projectId]/route.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:84de6da5e1db50e15f70cd2564e5300f600d962909892ff03de45d0222b1f94e",
          "index_digest": "sha256:84de6da5e1db50e15f70cd2564e5300f600d962909892ff03de45d0222b1f94e",
          "worktree_digest": "sha256:18cce7ab371db3ac13322bec589f1ae103a73160ea148c9a02e78feea1c3953e",
          "untracked_digest": "absent"
        },
        {
          "path": "app/api/projects/route.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:6637e9c88c0b296f878e613e0af22b883f84094adcd3259bd317ff2002974cae",
          "index_digest": "sha256:6637e9c88c0b296f878e613e0af22b883f84094adcd3259bd317ff2002974cae",
          "worktree_digest": "sha256:e983480a5c23eb1d57379a6b51c6717b095077db8e79163a08269c0d5cdd7e1c",
          "untracked_digest": "absent"
        },
        {
          "path": "app/editor/[roomId]/page.tsx",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:6259e5fe9e19b2e81cd7ca509f5ce1066098be49abb6764e5c52c23019c9d810",
          "index_digest": "sha256:6259e5fe9e19b2e81cd7ca509f5ce1066098be49abb6764e5c52c23019c9d810",
          "worktree_digest": "sha256:6259e5fe9e19b2e81cd7ca509f5ce1066098be49abb6764e5c52c23019c9d810",
          "untracked_digest": "absent"
        },
        {
          "path": "app/editor/page.tsx",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:1efa894bdae582cbbb3939d6d53de770fa62945439d1bc6a6bcffbfcab19205a",
          "index_digest": "sha256:1efa894bdae582cbbb3939d6d53de770fa62945439d1bc6a6bcffbfcab19205a",
          "worktree_digest": "sha256:ac191183ebc10b13937dff95761620756aa3703078014a6c064e6e960cc88fe4",
          "untracked_digest": "absent"
        },
        {
          "path": "components/editor/create-project-dialog.tsx",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:fb12c10785e699abb18ae9d7bc5a8b4a3eb64b5c6855b5eac26a0e1f717ddf29",
          "index_digest": "sha256:fb12c10785e699abb18ae9d7bc5a8b4a3eb64b5c6855b5eac26a0e1f717ddf29",
          "worktree_digest": "sha256:15c61bf0cf45e20f5ffc84ed45e13ed021aa0b0f218aac11f9a4b66d321bfb0d",
          "untracked_digest": "absent"
        },
        {
          "path": "components/editor/editor-client.tsx",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:3eda8d6f41c2ebfe8317effa9c74cdbc4354ee1d13bb97bf83f34f838f4865f4",
          "index_digest": "sha256:3eda8d6f41c2ebfe8317effa9c74cdbc4354ee1d13bb97bf83f34f838f4865f4",
          "worktree_digest": "sha256:cbae104a701c9cba79875f962af8e326c10bfd96e4ba5e982f5b45612208050f",
          "untracked_digest": "absent"
        },
        {
          "path": "components/editor/editor-navbar.tsx",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:2d6639774535122f4a0685563c6cf2b1a0042a930e8c99da77b357d5a8e5f81b",
          "index_digest": "sha256:2d6639774535122f4a0685563c6cf2b1a0042a930e8c99da77b357d5a8e5f81b",
          "worktree_digest": "sha256:2d6639774535122f4a0685563c6cf2b1a0042a930e8c99da77b357d5a8e5f81b",
          "untracked_digest": "absent"
        },
        {
          "path": "components/editor/workspace-layout.tsx",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:2f6592d59e11358a9e9ca6930e695728092581d18b9a2a8c950968dbd6fe8621",
          "index_digest": "sha256:2f6592d59e11358a9e9ca6930e695728092581d18b9a2a8c950968dbd6fe8621",
          "worktree_digest": "sha256:2f6592d59e11358a9e9ca6930e695728092581d18b9a2a8c950968dbd6fe8621",
          "untracked_digest": "absent"
        },
        {
          "path": "context/architecture-context.md",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:d7e82614d26b856a791790387f7f55718c7dd9b36f75d4659b0fece36cfb1e17",
          "index_digest": "sha256:d7e82614d26b856a791790387f7f55718c7dd9b36f75d4659b0fece36cfb1e17",
          "worktree_digest": "sha256:e00c015055b17b055865e9ef00ef244b0f8a4aadd906d0c5d1812a28161714ad",
          "untracked_digest": "absent"
        },
        {
          "path": "context/code-standards.md",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:868209fb6e4ed081ab1643f5fd70a83793ebe82ce63e13b139fc70f4a5000bef",
          "index_digest": "sha256:868209fb6e4ed081ab1643f5fd70a83793ebe82ce63e13b139fc70f4a5000bef",
          "worktree_digest": "sha256:ad864d7d36e6758d0ab7f1bf2aa4865296bc60e204912eeed67c8700ab0ad881",
          "untracked_digest": "absent"
        },
        {
          "path": "context/feature-specs/09-share-dialog.md",
          "object_kind": {
            "head": "absent",
            "index": "absent",
            "worktree": "absent",
            "untracked": "regular"
          },
          "state": "untracked",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "absent",
          "index_digest": "absent",
          "worktree_digest": "absent",
          "untracked_digest": "sha256:2f8615b67cd2f877230691733db0b556740251d37f2fd502b570e06f9a3adb04"
        },
        {
          "path": "context/ui-context.md",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:df552656caead8949a2f2b36c51cf4ebcd3d1868863290f48e9c7f8a4961fa69",
          "index_digest": "sha256:df552656caead8949a2f2b36c51cf4ebcd3d1868863290f48e9c7f8a4961fa69",
          "worktree_digest": "sha256:230081f9c5a1fcbf460da85562cc405a3fad2343ad7b92929208a44cb6645eca",
          "untracked_digest": "absent"
        },
        {
          "path": "lib/prisma.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:fe23076da9d0c3077105f75c693b28dc2180ecfd503042327ac17f4056f33145",
          "index_digest": "sha256:fe23076da9d0c3077105f75c693b28dc2180ecfd503042327ac17f4056f33145",
          "worktree_digest": "sha256:6718626b9c57e74a31a0f307fc7e66dd9c03e13ecb21664af217f86a1895328a",
          "untracked_digest": "absent"
        },
        {
          "path": "lib/project-access.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:843611d2fd885408d817ab592617a92c3e16fa1feadca927b58f6629064e2982",
          "index_digest": "sha256:843611d2fd885408d817ab592617a92c3e16fa1feadca927b58f6629064e2982",
          "worktree_digest": "sha256:843611d2fd885408d817ab592617a92c3e16fa1feadca927b58f6629064e2982",
          "untracked_digest": "absent"
        },
        {
          "path": "lib/projects.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:b4da55a2d010098644d66f6f1167bd80d17c3b08a10889a3e4a81ae7a670cd35",
          "index_digest": "sha256:b4da55a2d010098644d66f6f1167bd80d17c3b08a10889a3e4a81ae7a670cd35",
          "worktree_digest": "sha256:4597e8a5e6bfd519b6a16a598a78db8221da16d5634d0f21c8580f9b488928fe",
          "untracked_digest": "absent"
        },
        {
          "path": "lib/slug.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:9c2d4a81812c80e74d799a80dde56351d84f21d92eda91ae328b47ab8df5799a",
          "index_digest": "sha256:9c2d4a81812c80e74d799a80dde56351d84f21d92eda91ae328b47ab8df5799a",
          "worktree_digest": "sha256:debf01517e4cf564ffc87ff8b9d9d4ef60c81583cd42680f0fb5153666b241b7",
          "untracked_digest": "absent"
        },
        {
          "path": "package.json",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:b23d97fd643424672fd59fe75f19d8e993533f1e903220bf68c81d9eee2ead2a",
          "index_digest": "sha256:b23d97fd643424672fd59fe75f19d8e993533f1e903220bf68c81d9eee2ead2a",
          "worktree_digest": "sha256:8cf899c511042dcbb7ce69897d2a069f0f9db14a9707598a25513ec56ed539d5",
          "untracked_digest": "absent"
        },
        {
          "path": "prisma/schema.prisma",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:76fe3d8f97402965b827bb56848713a436bdf15f4f2acaa89065b2814307eeaa",
          "index_digest": "sha256:76fe3d8f97402965b827bb56848713a436bdf15f4f2acaa89065b2814307eeaa",
          "worktree_digest": "sha256:9395dd4825d06e272cb6b07ea413f520cbc36879dd731b1f4d4a1d6bd2a1d65d",
          "untracked_digest": "absent"
        },
        {
          "path": "proxy.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:c8898d261dec2a60ef32c3526aea07b1af11cdd06c718b0c632b11040fbbe38e",
          "index_digest": "sha256:c8898d261dec2a60ef32c3526aea07b1af11cdd06c718b0c632b11040fbbe38e",
          "worktree_digest": "sha256:361f9ec77c520f16f5878b58b9b08df8029ef05e8b7314486a012c83e92f2edf",
          "untracked_digest": "absent"
        }
      ]
    },
    "files_to_modify": [
      {
        "file": "lib/share-collaborators.ts",
        "symbols": [
          "getCollaborators",
          "inviteCollaborator",
          "removeCollaborator"
        ],
        "intended_change": "New service wrapping getPrismaClient; list/invite/remove with ownership enforcement and email validation."
      },
      {
        "file": "lib/share-dialog-helpers.tsx",
        "symbols": [
          "fetchCollaboratorByEmail"
        ],
        "intended_change": "Clerk enrichment helper returning display name/avatar with email-only fallback."
      },
      {
        "file": "components/editor/share-dialog.tsx",
        "symbols": [
          "ShareDialog"
        ],
        "intended_change": "New share dialog modeled on create-project-dialog.tsx; owner invite/remove + read-only list + Copied! copy-link."
      },
      {
        "file": "components/editor/editor-navbar.tsx",
        "symbols": [
          "EditorNavbar"
        ],
        "intended_change": "Wire Share button to open ShareDialog."
      },
      {
        "file": "components/editor/editor-client.tsx",
        "symbols": [
          "EditorClient"
        ],
        "intended_change": "Compose ShareDialog and pass project/collaborator data."
      },
      {
        "file": "app/editor/page.tsx",
        "symbols": [
          "EditorPage"
        ],
        "intended_change": "Pass share context (collaborators, share state) to EditorClient."
      },
      {
        "file": "app/editor/[roomId]/page.tsx",
        "symbols": [
          "EditorWorkspacePage"
        ],
        "intended_change": "Pass share context."
      },
      {
        "file": "app/api/projects/[projectId]/collaborators/route.ts",
        "symbols": [
          "CollaboratorRoute"
        ],
        "intended_change": "GET list, POST invite, DELETE remove; auth 401, ownership 403, duplicate 409, invalid email 400."
      }
    ],
    "tests": [
      {
        "file": "app/api/projects/[projectId]/collaborators/route.ts",
        "scenarios": [
          {
            "input": "GET list as owner",
            "action": "list collaborators",
            "expected": "200 with collaborator list"
          },
          {
            "input": "POST invite as owner",
            "action": "invite collaborator by email",
            "expected": "200, row persisted by email"
          },
          {
            "input": "POST invite as non-owner",
            "action": "invite",
            "expected": "403"
          },
          {
            "input": "POST invite duplicate email",
            "action": "invite same email twice",
            "expected": "409"
          },
          {
            "input": "POST invite invalid email",
            "action": "invite malformed email",
            "expected": "400"
          },
          {
            "input": "DELETE remove as owner",
            "action": "remove collaborator",
            "expected": "200"
          },
          {
            "input": "DELETE remove as non-owner",
            "action": "remove",
            "expected": "403"
          }
        ]
      },
      {
        "file": "components/editor/share-dialog.tsx",
        "scenarios": [
          {
            "input": "owner opens dialog",
            "action": "render",
            "expected": "owner sees invite form and remove buttons"
          },
          {
            "input": "collaborator opens dialog",
            "action": "render",
            "expected": "read-only collaborator list"
          },
          {
            "input": "copy link",
            "action": "copy",
            "expected": "Copied! feedback"
          }
        ]
      }
    ],
    "verification_commands": [
      "npm run build",
      "npm run lint"
    ],
    "assumptions": [
      "No local user table; collaborators keyed by email via ProjectCollaborator.collaboratorEmail.",
      "Enrichment uses Clerk fetchByEmail with email-only fallback on fetch failure.",
      "Share dialog follows the existing create-project-dialog.tsx Dialog pattern.",
      "API auth relies on clerkMiddleware protecting /api (proxy.ts).",
      "All project owners (not only ownerId) may invite/remove; enforced server-side via ownership check.",
      "No existing automated tests; tests added for API contract + dialog behavior."
    ],
    "open_questions": [
      "PDG layer unavailable in this session; recommend node .gitnexus/run.cjs analyze --index-only --pdg to add statement-level PDG findings.",
      "GitNexus FTS extension unavailable on this Windows host (load-only policy); source verification used instead.",
      "GitNexus index 7 commits behind HEAD; refresh skipped per feature-category accept; source-weighted.",
      "Whether to add automated API contract tests (no test suite exists yet) — recommended in §8.",
      "Collaborator email validation format assumed to match Clerk email shape; no spec-defined regex."
    ],
    "avoid": [
      "Do not invent a local user table or replace Clerk identity.",
      "Do not replace the existing create-project-dialog.tsx pattern without evidence.",
      "Do not skip server-side ownership enforcement (spec hard requirement).",
      "Do not reconstruct evidence_provenance bytes ad hoc; use the evidence-provenance.mjs serializer.",
      "Do not modify functions before GitNexus impact analysis (per CLAUDE.md)."
    ]
  }
}
```


## Assumptions and Open Questions (§12)

Assumptions:
- No local user table; collaborators keyed by email via `ProjectCollaborator.collaboratorEmail`.
- Enrichment uses Clerk `fetchByEmail` with email-only fallback on fetch failure.
- Share dialog follows the existing `create-project-dialog.tsx` Dialog pattern.
- API auth relies on `clerkMiddleware` protecting `/api` (proxy.ts).
- All project owners (not only `ownerId`) may invite/remove; enforced server-side via ownership check.
- No existing automated tests; tests added for API contract + dialog behavior.

Open questions:
- PDG layer unavailable in this session; recommend `node .gitnexus/run.cjs analyze --index-only --pdg` to add statement-level PDG findings.
- GitNexus FTS extension unavailable on this Windows host (load-only policy); source verification used instead.
- GitNexus index 7 commits behind HEAD; refresh skipped per feature-category accept; source-weighted.
- Whether to add automated API contract tests (no test suite exists yet) — recommended in §8.
- Collaborator email validation format assumed to match Clerk email shape; no spec-defined regex.

## Definition of Done (§13)

- `npm run build` passes; `npm run lint` passes.
- Share dialog opens from navbar Share button; owner sees invite/remove and collaborator list; collaborator sees read-only list.
- API list/invite/remove enforce ownership (`403` for non-owner), auth (`401`), duplicate email (`409`), invalid email (`400`).
- Copy-link shows `Copied!` feedback.
- `ProjectCollaborator` rows persist by email; enrichment falls back to email-only.
- `context/progress-tracker.md` updated for the completed plan.
