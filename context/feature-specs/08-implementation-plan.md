# Implementation Plan: Editor Workspace Shell with Server-Side Project Access Control

**Date**: 2026-01-20
**Spec**: context/feature-specs/08-editor-workspace.md
**Approach**: Route segmentation (keep home page, add dynamic workspace route)

---

## 1. Overview

Build the `/editor/[roomId]` workspace shell with server-side project access control. The feature adds a new dynamic route that verifies project ownership or collaboration before rendering the workspace layout. All access logic is centralized in `lib/project-access.ts`, keeping the page component clean.

---

## 2. Files to Create

### 2.1 `lib/project-access.ts`

New helper module containing:

```typescript
/**
 * Retrieve the current Clerk identity.
 * Returns both user ID and primary email.
 */
export async function getCurrentClerkIdentity(): Promise<{
  userId: string;
  email: string;
}>;

/**
 * Check whether a user has access to a specific project.
 * Returns true if the user is the owner or a collaborator.
 */
export async function hasUserAccessToProject(
  userId: string,
  projectId: string
): Promise<boolean>;

/**
 * Retrieve a project if the user has access to it.
 * Returns null if the project doesn't exist or the user has no access.
 */
export async function getAccessibleProject(
  userId: string,
  projectId: string
): Promise<{
  id: string;
  name: string;
  slug: string;
  ownerId: string;
} | null>;
```

**Implementation details:**

- `getCurrentClerkIdentity()`: Uses Clerk's `auth()` from `@clerk/nextjs/server` to get `userId`, then retrieves the user's primary email via `auth().user?.primaryEmail`.
- `hasUserAccessToProject(userId, projectId)`: Queries Prisma for both `Project.ownerId === userId` and `ProjectCollaborator.projectId === projectId && ProjectCollaborator.collaboratorEmail === userId`.
- `getAccessibleProject(userId, projectId)`: Retrieves the project, verifies access, and returns the transformed `Project` type (matching the existing `Project` interface with `id`, `name`, `slug`, `ownerId`).

**Reuse considerations:**
- Reuse `slugFromName()` from `lib/slug.ts`.
- Reuse Prisma client from `lib/prisma.ts`.
- Do not duplicate existing `getProjectsForUser()` — it fetches all projects for a user, not a single project.

---

### 2.2 `components/editor/access-denied.tsx`

New client component:

```typescript
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center h-screen text-center px-6">
    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
    <p className="text-muted-foreground mb-6 max-w-sm">
      You do not have permission to access this project.
    </p>
    <Button variant="outline" className="gap-2">
      <ArrowLeft className="h-4 w-4" />
      Back to Projects
    </Button>
  </div>
);
```

**Design notes:**
- Centered layout (flex-col, items-center, justify-center).
- Lock icon from lucide-react (stroke-based, `h-12 w-12`).
- Short explanatory message.
- Link back to `/editor` via a button.
- Uses existing design tokens: `text-muted-foreground`, `bg-background`.

---

## 3. Files to Modify

### 3.1 `app/editor/[roomId]/page.tsx` (NEW route)

Dynamic route for the workspace shell:

```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentClerkIdentity, getAccessibleProject } from "@/lib/project-access";
import { WorkspaceLayout } from "@/components/editor/workspace-layout";
import { AccessDenied } from "@/components/editor/access-denied";

export default async function EditorWorkspacePage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  // Step 1: Authenticate
  const { userId, email } = await getCurrentClerkIdentity();
  if (!userId) {
    redirect("/sign-in");
  }

  // Step 2: Verify access
  const project = await getAccessibleProject(userId, roomId);
  if (!project) {
    return <AccessDenied />;
  }

  // Step 3: Render workspace
  return <WorkspaceLayout project={project} userId={userId} />;
}
```

**Access control flow:**
1. Authenticate via Clerk's `auth()`. Unauthenticated → redirect to `/sign-in`.
2. Verify project access via `getAccessibleProject()`. No access → render `AccessDenied`.
3. Render the workspace layout with the accessible project.

**Key constraints:**
- Server component (no `"use client"` directive).
- All access checks happen server-side before rendering.
- Never exposes project information to unauthorized users.
- Uses existing routing conventions for dynamic routes.

### 3.2 `components/editor/workspace-layout.tsx` (NEW)

Full-viewport workspace layout (server component):

```typescript
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { CanvasPlaceholder } from "@/components/editor/canvas-placeholder";
import { AISidebarPlaceholder } from "@/components/editor/ai-sidebar-placeholder";
import { WorkspaceToggleClient } from "@/components/editor/workspace-toggle-client";

export interface WorkspaceLayoutProps {
  project: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
  };
  userId: string;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  project,
  userId,
}) => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <EditorNavbar
        projectId={project.id}
        projectName={project.name}
        userId={userId}
      />
      <div className="flex-1 overflow-hidden">
        <WorkspaceToggleClient
          project={project}
          userId={userId}
        />
      </div>
    </div>
  );
};
```

**Component composition:**
- `EditorNavbar` (Client Component) — top bar with project name, share/AI toggles.
- `WorkspaceToggleClient` (Client Component) — orchestrates the sidebar layout, manages toggle state, and renders:
  - `ProjectSidebar` (left) — highlights current room/project.
  - `CanvasPlaceholder` (center) — dark canvas placeholder.
  - `AISidebarPlaceholder` (right) — AI chat placeholder.

### 3.3 `components/editor/editor-navbar.tsx` (MODIFIED)

Add project name display, share button placeholder, and AI sidebar toggle placeholder:

```typescript
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { PanelLeftOpen, PanelLeftClose, Share2, PanelRightOpen, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";

export interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectId: string;
  projectName: string;
  userId: string;
}

export const EditorNavbar: React.FC<EditorNavbarProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  projectId,
  projectName,
  userId,
}) => {
  const handleToggle = useCallback(() => {
    onToggleSidebar();
  }, [onToggleSidebar]);

  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between bg-base border-b border-surface-border px-4",
        "shadow-sm"
      )}
    >
      {/* Left section – sidebar toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        className="p-2 hover:bg-surface-hover rounded"
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarOpen ? (
          <PanelLeftClose className="h-5 w-5" />
        ) : (
          <PanelLeftOpen className="h-5 w-5" />
        )}
      </button>

      {/* Center section – project name */}
      <div className="flex-1 flex justify-center">
        <span className="text-lg font-medium">{projectName}</span>
      </div>

      {/* Right section – share and AI toggles */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button variant="ghost" size="sm" className="gap-1">
          <PanelRightOpen className="h-4 w-4" />
          AI
        </Button>
        <UserButton />
      </div>
    </header>
  );
};
```

**Changes:**
- Added `projectId`, `projectName`, and `userId` props.
- Added project name display in the center section.
- Added Share button placeholder (`Share2` icon from lucide-react).
- Added AI sidebar toggle placeholder (`PanelRightOpen` icon).
- Kept existing sidebar toggle and UserButton.

### 3.4 `app/editor/page.tsx` (MODIFIED)

Update to navigate to `/editor/[roomId]` when a project is selected:

```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProjectsForUser } from "@/lib/projects";
import { EditorClient } from "@/components/editor/editor-client";

export default async function EditorPage() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) {
    redirect("/sign-in");
  }

  const { ownedProjects, sharedProjects } = await getProjectsForUser(userId);

  return (
    <EditorClient
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
      currentUserId={userId}
    />
  );
}
```

**Change**: The existing `EditorClient` already has a `selectedProjectId` state. When a project is selected in the sidebar, `onSelectProject` fires. The `EditorClient` currently navigates to the home page. We need to update the navigation in the `EditorClient` or the sidebar to go to `/editor/[selectedProjectId]`.

Actually, looking more carefully at `EditorClient` and `ProjectSidebar`, the `onSelectProject` callback just sets `selectedProjectId` in `EditorClient`. It doesn't navigate. So the change should be made in `EditorClient` — when `selectedProjectId` changes, navigate to `/editor/[projectId]`.

Let me revise this in the plan.

### 3.5 `components/editor/editor-client.tsx` (MODIFIED)

Update the `EditorClient` to navigate to the workspace page when a project is selected:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types/project";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { EditorHome } from "@/components/editor/editor-home";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { useProjectAction } from "@/hooks/use-project-action";

export interface EditorClientProps {
  ownedProjects: Project[];
  sharedProjects: Project[];
  currentUserId?: string;
}

export const EditorClient: React.FC<EditorClientProps> = ({
  ownedProjects,
  sharedProjects,
  currentUserId,
}) => {
  const router = useRouter();
  const allProjects = [...ownedProjects, ...sharedProjects];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const action = useProjectAction({ currentUserId, activeProjectId: selectedProjectId });

  // Navigate to workspace when a project is selected
  useEffect(() => {
    if (selectedProjectId) {
      router.push(`/editor/${selectedProjectId}`);
      router.refresh();
    }
  }, [selectedProjectId, router]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <EditorNavbar
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 overflow-hidden">
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          projects={allProjects}
          currentUserId={currentUserId}
          selectedProjectId={selectedProjectId}
          onSelectProject={(project) => setSelectedProjectId(project.id)}
          onOpenCreate={action.openCreate}
          onOpenRename={(project) => action.openRename(project)}
          onOpenDelete={(project) => action.openDelete(project)}
        />
        <main className="p-6">
          <EditorHome onOpenCreate={action.openCreate} />
        </main>
      </div>

      {/* Dialogs render once at the page level */}
      <CreateProjectDialog ... />
      <RenameProjectDialog ... />
      <DeleteProjectDialog ... />
    </div>
  );
};
```

**Change**: Added `useEffect` to navigate to `/editor/[selectedProjectId]` when a project is selected in the sidebar. The route refresh triggers the workspace page's access control.

---

## 4. Additional New Components (Placeholders)

### 4.1 `components/editor/canvas-placeholder.tsx`

Dark central workspace area with centered message:

```typescript
export const CanvasPlaceholder = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
    <h2 className="text-xl font-medium text-muted-foreground mb-2">
      Workspace Canvas
    </h2>
    <p className="text-faint">
      Canvas functionality will appear here once implemented.
    </p>
  </div>
);
```

### 4.2 `components/editor/ai-sidebar-placeholder.tsx`

Right sidebar placeholder for future AI chat:

```typescript
export const AISidebarPlaceholder = () => (
  <aside className="w-80 border-l border-surface-border bg-base flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-medium text-muted-foreground">AI Assistant</h3>
    <p className="text-faint text-sm mt-2">AI chat functionality will appear here.</p>
  </aside>
);
```

### 4.3 `components/editor/workspace-toggle-client.tsx`

Client component that manages workspace layout state and composes the sidebar/canvas/AI layout:

```typescript
"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { CanvasPlaceholder } from "@/components/editor/canvas-placeholder";
import { AISidebarPlaceholder } from "@/components/editor/ai-sidebar-placeholder";

export interface WorkspaceToggleClientProps {
  project: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
  };
  userId: string;
}

export const WorkspaceToggleClient: React.FC<WorkspaceToggleClientProps> = ({
  project,
  userId,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar */}
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        projects={[project]}
        currentUserId={userId}
        selectedProjectId={project.id}
        onSelectProject={() => setSidebarOpen(true)}
        onOpenCreate={() => {}}
        onOpenRename={() => {}}
        onOpenDelete={() => {}}
      />
      {/* Right AI sidebar */}
      <AISidebarPlaceholder />
      {/* Central canvas placeholder */}
      <main className="flex-1 overflow-hidden">
        <CanvasPlaceholder />
      </main>
    </div>
  );
};
```

**Note**: The sidebar is always open in the workspace view (no toggle in the workspace layout itself; the toggle is handled by the navbar in `EditorNavbar`). This simplifies the workspace layout.

---

## 5. Component Hierarchy and Data Flow

```
EditorWorkspacePage (Server Component)
  └─ getCurrentClerkIdentity()
  └─ getAccessibleProject(userId, roomId)
  └─ AccessDenied (if no access)
  └─ WorkspaceLayout (if access granted)
        └─ EditorNavbar (Client Component)
              ├─ project name display
              ├─ share button (placeholder)
              ├─ AI toggle button (placeholder)
              └─ UserButton
        └─ WorkspaceToggleClient (Client Component)
              ├─ ProjectSidebar (left)
              │     └─ highlights current room/project
              ├─ CanvasPlaceholder (center)
              └─ AISidebarPlaceholder (right)
```

### Server/Client Boundaries

- **Server Component**: `EditorWorkspacePage`, `WorkspaceLayout`, `CanvasPlaceholder`, `AISidebarPlaceholder`, `AccessDenied`.
- **Client Component**: `EditorNavbar` (needs toggle state), `WorkspaceToggleClient` (needs sidebar state), `ProjectSidebar` (needs interactivity).

The spec says: "If the AI sidebar toggle requires client-side state, isolate it in a small Client Component rather than converting the entire workspace into a Client Component." This is satisfied — the workspace layout is a server component, with only the navbar and workspace toggle being client-side.

---

## 6. Implementation Sequence

### Step 1: Create `lib/project-access.ts`
- Implement `getCurrentClerkIdentity()` using Clerk's `auth()`.
- Implement `hasUserAccessToProject(userId, projectId)` querying both owner and collaborator relations.
- Implement `getAccessibleProject(userId, projectId)` combining access check and project retrieval.
- Verify types match existing `Project` interface.

### Step 2: Create `components/editor/access-denied.tsx`
- Build the centered layout with lock icon, message, and back link.
- Use existing design tokens and Lucide icons.

### Step 3: Create placeholder components
- `CanvasPlaceholder` — dark central area with message.
- `AISidebarPlaceholder` — right sidebar placeholder.

### Step 4: Create `components/editor/workspace-toggle-client.tsx`
- Compose sidebar, canvas, and AI placeholder layout.
- Manage sidebar state (always open in workspace view).

### Step 5: Create `app/editor/[roomId]/page.tsx`
- Add dynamic route for workspace access control.
- Implement authentication redirect.
- Implement access verification and access-denied rendering.

### Step 6: Modify `components/editor/editor-navbar.tsx`
- Add project name, share button, and AI toggle placeholders.
- Update props interface.

### Step 7: Create `components/editor/workspace-layout.tsx`
- Compose navbar and workspace toggle client.
- Pass project and userId props.

### Step 8: Modify `components/editor/editor-client.tsx`
- Add navigation to `/editor/[selectedProjectId]` when a project is selected.
- Add `useEffect` for route change.

### Step 9: Verification
- TypeScript check (`npx tsc --noEmit`).
- Production build (`npm run build`).
- Verify access control flow:
  - Unauthenticated → redirects to `/sign-in`.
  - Authorized user with access → renders workspace layout.
  - Authorized user without access → renders `AccessDenied`.
  - Non-existent project → renders `AccessDenied`.

---

## 7. Potential Integration Problems

### 7.1 Route Conflict with Existing Editor Page
- The existing `/editor/page.tsx` serves as the project home/list page.
- The new `/editor/[roomId]/page.tsx` is a dynamic route.
- Next.js handles this correctly: static route `/editor/page.tsx` takes precedence over dynamic `/editor/[roomId]/page.tsx` when no `roomId` is present.

### 7.2 ProjectSidebar Navigation
- The existing `EditorClient` navigates to `/editor/[roomId]` via `useEffect`.
- The workspace page's `EditorNavbar` will show a sidebar toggle button, but the workspace layout's `WorkspaceToggleClient` doesn't have a toggle — the sidebar is always open in the workspace view.
- **Resolution**: The navbar toggle in the workspace layout is a visual placeholder. Clicking it does nothing in the workspace view (sidebar remains open). Actual sidebar toggle functionality will be implemented later.

### 7.3 Access Control for Shared Projects
- The `hasUserAccessToProject` function must query both `Project.ownerId === userId` and `ProjectCollaborator.collaboratorEmail === userId`.
- The collaborator relation uses `collaboratorEmail` which is the Clerk user ID (email).
- Ensure this matches the existing `getProjectsForUser` pattern.

### 7.4 Clerk Email Retrieval
- Clerk's `auth()` returns `userId` but may not always return the email directly.
- If `auth()` doesn't return email, we may need to fetch it via Clerk's API.
- **Resolution**: Check if `auth()` returns an `email` field. If not, use `auth().user?.primaryEmail` or fetch via Clerk's API.

### 7.5 TypeScript Errors
- Ensure all new components have correct props interfaces.
- Ensure `getCurrentClerkIdentity()` returns the correct type.
- Ensure the workspace layout passes correct props to child components.

---

## 8. Scope Verification

The implementation is limited to:
- ✅ Workspace shell and server-side access control.
- ✅ `lib/project-access.ts` with access helpers.
- ✅ `AccessDenied` component.
- ✅ Workspace layout with navbar, sidebar, canvas placeholder, and AI sidebar placeholder.
- ✅ Navigation from editor home to workspace page.

The implementation does NOT include:
- ❌ Canvas functionality.
- ❌ Liveblocks integration.
- ❌ AI chat functionality.
- ❌ Real sharing behavior.
- ❌ Unnecessary API endpoints or database changes.

---

## 9. Verification Checklist (Post-Implementation)

1. [ ] TypeScript compilation passes (`npx tsc --noEmit`).
2. [ ] Production build succeeds (`npm run build`).
3. [ ] Unauthenticated user accessing `/editor/[roomId]` redirects to `/sign-in`.
4. [ ] Authenticated user without project access sees `AccessDenied` component.
5. [ ] Non-existent project shows `AccessDenied` component.
6. [ ] Owner accesses their project and sees workspace layout.
7. [ ] Collaborator accesses shared project and sees workspace layout.
8. [ ] Workspace layout shows correct project name in navbar.
9. [ ] Sidebar highlights the current room/project.
10. [ ] Layout fills the viewport correctly (full-viewport, no overflow issues).
11. [ ] No canvas, Liveblocks, AI chat, or real sharing functionality was introduced.

---

## 10. Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Clerk API for email retrieval fails | LOW | Graceful fallback: use `auth().user?.primaryEmail` or omit email if not available. |
| Route conflict between home and workspace pages | LOW | Next.js static route precedence handles this correctly. |
| TypeScript type mismatches | MEDIUM | Run `tsc --noEmit` before committing. |
| Sidebar state management in workspace view | LOW | Sidebar is always open in workspace layout; navbar toggle is a visual placeholder. |
| Access control bypass | HIGH | All access checks happen server-side. No client-side authorization. |

---

## 11. Summary of Changes

### Files Created (6):
1. `lib/project-access.ts` — Access helper utilities
2. `components/editor/access-denied.tsx` — Access denied component
3. `components/editor/canvas-placeholder.tsx` — Canvas placeholder
4. `components/editor/ai-sidebar-placeholder.tsx` — AI sidebar placeholder
5. `components/editor/workspace-toggle-client.tsx` — Layout orchestration client
6. `app/editor/[roomId]/page.tsx` — Workspace access control page

### Files Modified (3):
1. `components/editor/editor-navbar.tsx` — Added project name, share/AI toggles
2. `components/editor/workspace-layout.tsx` — Workspace layout composition
3. `components/editor/editor-client.tsx` — Added navigation to workspace page

### Total Changes: 9 files (6 new, 3 modified)

---

*This plan follows the existing codebase architecture, reuses available components and utilities, keeps changes minimal and targeted, and respects the scope restrictions specified in the feature spec.*