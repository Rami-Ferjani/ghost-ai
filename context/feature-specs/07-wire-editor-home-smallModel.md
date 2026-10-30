# Implementation Plan: Wiring Editor Home & Sidebar to Project API

This document provides a precise, step-by-step implementation plan for wiring the Editor Home page, sidebar, and dialogs to the existing Prisma project API. It is designed to be executed independently by a local coding model.

---

## A. Verified Architecture

### 1. Server & Client Component Boundaries
- **`app/editor/page.tsx` (Server Component)**:
  - Asynchronous React Server Component (`async function EditorPage()`).
  - Uses `await auth()` from `@clerk/nextjs/server` to enforce server-side authentication.
  - Fetches owned and shared projects directly on the server via `getProjectsForUser(userId)` in `lib/projects.ts`.
  - Passes `ownedProjects`, `sharedProjects`, and `currentUserId` as props to `EditorClient`.
  - Performs no client-side fetching for the initial page load.

- **`components/editor/editor-client.tsx` (Client Shell)**:
  - Marked with `"use client"`.
  - Receives server-fetched projects and `currentUserId`.
  - Owns sidebar open/close state (`sidebarOpen`) and active selection state (`selectedProjectId`).
  - Uses the custom hook `useProjectAction` (`hooks/use-project-action.ts`) to manage dialog visibility, form inputs, loading/error states, and API mutations.
  - Renders `EditorNavbar`, `ProjectSidebar`, `EditorHome`, and the three dialog components (`CreateProjectDialog`, `RenameProjectDialog`, `DeleteProjectDialog`).

### 2. Project ID & Liveblocks Room ID Consistency
- **Origin of Project ID**: Generated server-side by PostgreSQL / Prisma as a standard UUID (`@default(uuid()) @id`) during `POST /api/projects`.
- **Liveblocks Room ID Relationship**: The Liveblocks room ID is identical to the created project's database `id` (or uses the deterministic format `room:${project.id}`).
- **Preview & Creation**: The Create Project dialog generates a slug preview using `slugFromName(createName)` and displays a Liveblocks room ID preview (`room-${slug}`). When the project is created via `POST /api/projects`, the returned `id` is used as the workspace identifier.

### 3. API Contracts
- **`POST /api/projects`**:
  - Request: `{ name: string }`
  - Response: `201 Created` with `Project` JSON object.
- **`PATCH /api/projects/[projectId]`**:
  - Request: `{ name: string }`
  - Response: `200 OK` with updated `Project` JSON object (`403` if not owner).
- **`DELETE /api/projects/[projectId]`**:
  - Response: `200 OK` with `{ success: true }` (`403` if not owner).

---

## B. Implementation Tasks

### Task 1: Create Server-Side Project Data Helper
- **Objective**: Implement `lib/projects.ts` to query owned and shared projects from PostgreSQL using Prisma on the server.
- **Files to inspect**:
  - `lib/prisma.ts`
  - `app/api/project/route.ts`
  - `types/project.ts`
  - `prisma/schema.prisma`
- **Files to modify/create**:
  - Create `lib/projects.ts`
- **Implementation instructions**:
  1. Create `lib/projects.ts` with function `getProjectsForUser(userId: string)`.
  2. Obtain the Prisma client using `getPrismaClient()`.
  3. Fetch owned projects: `prisma.project.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "desc" } })`.
  4. Fetch shared projects: `prisma.projectCollaborator.findMany` (or query projects where the user is listed as collaborator). If no collaborators exist yet, return `[]`.
  5. Transform database project records into the `Project` interface shape (`id`, `name`, `slug: slugFromName(p.name)`, `ownerId`).
  6. Return `{ ownedProjects: Project[], sharedProjects: Project[] }`.
- **Dependencies**: None.
- **Acceptance criteria**: `getProjectsForUser(userId)` returns typed lists of owned and shared projects.
- **Verification**: Run `npx tsc --noEmit` to verify type safety.

---

### Task 2: Create Custom Action Hook (`hooks/use-project-action.ts`)
- **Objective**: Build a custom React hook to manage project dialog states, form values, and API mutations (`POST`, `PATCH`, `DELETE`).
- **Files to inspect**:
  - `app/editor/project-dialogs.ts`
  - `app/api/projects/route.ts`
  - `app/api/projects/[projectId]/route.ts`
  - `types/project.ts`
- **Files to modify/create**:
  - Create `hooks/use-project-action.ts`
- **Implementation instructions**:
  1. Create `"use client"` hook `useProjectAction({ currentUserId, activeProjectId }: { currentUserId?: string; activeProjectId?: string | null })`.
  2. Import `useRouter` from `next/navigation`.
  3. Define state:
     - `activeDialog`: `"create" | "rename" | "delete" | null`
     - `selectedProject`: `Project | null`
     - `createName`: `string`
     - `renameName`: `string`
     - `isSubmitting`: `boolean`
     - `error`: `string | null`
  4. Define methods:
     - `openCreate()`: resets `createName = ""`, `error = null`, sets `activeDialog = "create"`.
     - `openRename(project)`: sets `selectedProject = project`, `renameName = project.name`, `error = null`, sets `activeDialog = "rename"`.
     - `openDelete(project)`: sets `selectedProject = project`, `error = null`, sets `activeDialog = "delete"`.
     - `closeDialog()`: sets `activeDialog = null`, `error = null`.
  5. Define mutation handlers:
     - `handleCreate()`:
       - Set `isSubmitting = true`.
       - `fetch('/api/projects', { method: 'POST', body: JSON.stringify({ name: createName }) })`.
       - If `!res.ok`, throw error, set `error`, and keep dialog open.
       - On success: parse `newProject`, call `closeDialog()`, call `router.refresh()`.
     - `handleRename()`:
       - If `!selectedProject`, return.
       - `fetch(\`/api/projects/\${selectedProject.id}\`, { method: 'PATCH', body: JSON.stringify({ name: renameName }) })`.
       - If `!res.ok`, set `error` and do not close dialog.
       - On success: call `closeDialog()`, call `router.refresh()`.
     - `handleDelete()`:
       - If `!selectedProject`, return.
       - `fetch(\`/api/projects/\${selectedProject.id}\`, { method: 'DELETE' })`.
       - If `!res.ok`, set `error` and do not close dialog.
       - On success: call `closeDialog()`. If `selectedProject.id === activeProjectId`, call `router.push('/editor')`; call `router.refresh()`.
- **Dependencies**: Task 1.
- **Acceptance criteria**: Hook exposes dialog triggers, state, and mutation handlers with robust error checks and `router.refresh()` integration.
- **Verification**: Run `npx tsc --noEmit`.

---

### Task 3: Wire Dialog Components with Submit Handlers & Room ID Preview
- **Objective**: Update Create, Rename, and Delete dialogs to accept submit handlers and render Liveblocks room ID previews.
- **Files to inspect**:
  - `components/editor/create-project-dialog.tsx`
  - `components/editor/rename-project-dialog.tsx`
  - `components/editor/delete-project-dialog.tsx`
- **Files to modify/create**:
  - Modify `components/editor/create-project-dialog.tsx`
  - Modify `components/editor/rename-project-dialog.tsx`
  - Modify `components/editor/delete-project-dialog.tsx`
- **Implementation instructions**:
  1. **`CreateProjectDialog`**:
     - Add `onSubmit: () => Promise<void>` and `isSubmitting?: boolean` to props.
     - Add Liveblocks room ID preview text alongside slug preview: `<p>Room ID preview: room-${slug}</p>`.
     - Trigger `onSubmit` on form submission or Confirm button click. Disable Confirm when `!slug` or `isSubmitting`.
  2. **`RenameProjectDialog`**:
     - Add `onSubmit: () => Promise<void>` and `isSubmitting?: boolean` to props.
     - Trigger `onSubmit` on form submission or Confirm button click.
  3. **`DeleteProjectDialog`**:
     - Add `onConfirm: () => Promise<void>` and `isSubmitting?: boolean` to props.
     - Display target project name: `Are you sure you want to delete "${project.name}"?`.
     - Trigger `onConfirm` on Confirm button click.
- **Dependencies**: Task 2.
- **Acceptance criteria**: Dialogs display appropriate previews and call action handlers without closing prematurely on failure.
- **Verification**: Run `npx tsc --noEmit`.

---

### Task 4: Create Client Wrapper Component (`components/editor/editor-client.tsx`)
- **Objective**: Build the client shell component that manages layout state, sidebar visibility, and dialog rendering.
- **Files to inspect**:
  - `components/editor/editor-navbar.tsx`
  - `components/editor/project-sidebar.tsx`
  - `components/editor/editor-home.tsx`
- **Files to modify/create**:
  - Create `components/editor/editor-client.tsx`
- **Implementation instructions**:
  1. Create `"use client"` component `EditorClient`.
  2. Props: `{ ownedProjects: Project[]; sharedProjects: Project[]; currentUserId?: string }`.
  3. Combine projects into a single list: `const allProjects = [...ownedProjects, ...sharedProjects]`.
  4. Manage state: `sidebarOpen` (`boolean`), `selectedProjectId` (`string | null`).
  5. Initialize `useProjectAction({ currentUserId, activeProjectId: selectedProjectId })`.
  6. Render `EditorNavbar` (with toggle callback), `ProjectSidebar` (with projects, selection, and action handlers), `EditorHome`, and the three dialogs (`CreateProjectDialog`, `RenameProjectDialog`, `DeleteProjectDialog`).
- **Dependencies**: Task 2, Task 3.
- **Acceptance criteria**: `EditorClient` seamlessly integrates all editor components and dialogs.
- **Verification**: Run `npx tsc --noEmit`.

---

### Task 5: Wire `/editor/page.tsx` as a Server Component
- **Objective**: Convert `/editor/page.tsx` into a Server Component that fetches project data using Prisma and passes it to `EditorClient`.
- **Files to inspect**:
  - `app/editor/page.tsx`
  - `lib/projects.ts`
  - `components/editor/editor-client.tsx`
- **Files to modify/create**:
  - Modify `app/editor/page.tsx`
- **Implementation instructions**:
  1. Remove `"use client"` directive from `app/editor/page.tsx`.
  2. Export default async function `EditorPage()`.
  3. Get user authentication state using `await auth()` from `@clerk/nextjs/server`. If unauthenticated, redirect to `/sign-in`.
  4. Fetch project data using `await getProjectsForUser(userId)`.
  5. Render `<EditorClient ownedProjects={ownedProjects} sharedProjects={sharedProjects} currentUserId={userId} />`.
- **Dependencies**: Task 1, Task 4.
- **Acceptance criteria**: `/editor` performs server-side data fetching and passes real projects to the client shell.
- **Verification**: Run `npm run build`.

---

## C. Integration and Risk Notes

1. **Server Component & Auth Boundaries**: `app/editor/page.tsx` must be an async Server Component using `await auth()`. Client interactivity is delegated to `EditorClient`.
2. **Revalidation**: After mutations, calling `router.refresh()` in `useProjectAction` causes Server Components to re-fetch database records automatically.
3. **Active Workspace Navigation**: Deleting an active project redirects to `/editor` and resets selection.
4. **Error Handling**: API errors leave dialogs open to display feedback.

---

## D. Final Verification Checklist

- [ ] `/editor` remains a Server Component with server-side Prisma data fetching.
- [ ] Both owned and shared projects are passed to the sidebar.
- [ ] Creating a project calls `POST /api/projects` and refreshes/navigates.
- [ ] Rename dialog pre-fills name and calls `PATCH /api/projects/[id]`.
- [ ] Delete dialog shows project name and calls `DELETE /api/projects/[id]`.
- [ ] Active project deletion redirects to `/editor`.
- [ ] `npm run build` succeeds without errors.
