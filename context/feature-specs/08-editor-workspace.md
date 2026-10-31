# Task: Build the Editor Workspace Shell with Server-Side Project Access Control

You are a senior full-stack engineer working directly in an existing Next.js repository.

Your task is to investigate the existing architecture, understand the relevant components and data models, create an implementation plan.

Do not start coding before completing the repository investigation and establishing a clear implementation plan.

## 1. Feature Requirements

Build the `/editor/[roomId]` workspace shell with server-side project access checks.

### Access control

The `/editor/[roomId]` route must be a Next.js Server Component.

Before rendering the workspace:

- Unauthenticated users must be redirected to `/sign-in`.
- Authenticated users without access to the requested project must see `AccessDenied`.
- Non-existent projects must also show `AccessDenied`.
- Project access must be verified server-side. Never rely on client-side checks for authorization.

### Access helpers

Create `lib/project-access.ts` containing reusable helpers for:

- Retrieving the current Clerk identity:
  - User ID.
  - Primary email address.
- Checking whether a user has access to a project:
  - Project owner.
  - Project collaborator.

Reuse existing authentication, database, and project-related utilities wherever possible.

Do not duplicate existing functionality.

### Access denied component

Create `components/editor/access-denied.tsx` with:

- Centered layout.
- Lock icon.
- Short explanatory message.
- Link back to `/editor`.

### Workspace layout

Build a full-viewport editor workspace containing:

**Top navbar**

- Current project name.
- Share button (visual placeholder only).
- AI sidebar toggle (visual placeholder only).

**Left sidebar**

- Reuse the existing `ProjectSidebar`.
- Highlight the currently opened room/project.

**Central workspace**

- Dark canvas placeholder.
- Centered placeholder message.
- Occupies all remaining available space.

**Right sidebar**

- Placeholder for future AI chat functionality.

The workspace must use the current project's context.

### Scope restrictions

Do NOT implement:

- Canvas functionality.
- Liveblocks integration.
- AI chat functionality.
- Real sharing behavior.
- Unnecessary API endpoints or database changes.

Only implement the workspace shell and server-side access control.

## 2. Repository Investigation

Before implementation, investigate the repository thoroughly.

Inspect:

1. Project directory structure and existing routing conventions.
2. Existing `/editor` pages and layouts.
3. Existing `ProjectSidebar` implementation and its props.
4. Existing navbar components and reusable UI components.
5. Clerk authentication configuration and existing authentication helpers.
6. Database schema, especially projects, owners, collaborators, and relationships.
7. Existing project-fetching utilities and server-side data-access patterns.
8. Existing authorization checks and permission helpers.
9. Existing design system, styling conventions, icons, and layout patterns.
10. Relevant TypeScript types and component boundaries.

Use GitNexus for code exploration and impact analysis if available. Do not rely exclusively on grep when more precise code intelligence is available.

Verify actual implementations and dependencies before deciding how to integrate them.

## 3. Architectural Constraints

- `/editor/[roomId]` must remain a Server Component.
- Authentication and authorization must happen server-side before rendering protected project content.
- Keep project-access logic outside the page component.
- Reuse existing database queries and project types.
- Avoid unnecessary Client Components.
- Only introduce Client Components where interactive UI actually requires them.
- If the AI sidebar toggle requires client-side state, isolate it in a small Client Component rather than converting the entire workspace into a Client Component.
- Do not expose sensitive project information to unauthorized users.
- Follow existing Next.js conventions for dynamic route parameters and redirects.
- Handle missing projects and unauthorized access consistently.
- Preserve existing functionality and avoid unrelated refactoring.

## 4. Implementation Plan

After investigating the repository, establish an implementation plan before making changes.

The plan should identify:

- Existing components and utilities to reuse.
- Files to create and modify.
- Component hierarchy and data flow.
- Server/Client Component boundaries.
- Authentication and authorization flow.
- Implementation sequence.
- Potential integration problems.

Keep the plan aligned with the actual repository rather than assuming particular file structures or APIs.

## 5. Implementation

Once the investigation and plan are complete, implement the feature.

Implementation requirements:

- Follow existing coding conventions and architecture.
- Make small, logically grouped changes.
- Reuse existing components, helpers, types, and styling patterns.
- Avoid unnecessary dependencies.
- Do not introduce abstractions that are not needed.
- Keep the implementation limited to the requested scope.
- Ensure all imports, types, props, and component boundaries are correct.
- Do not leave incomplete placeholders for functionality that is explicitly required.

Do not stop after producing the plan. You are responsible for completing the implementation.

## 6. Verification

After implementation:

1. Run the relevant TypeScript checks.
2. Run the production build.
3. Fix errors introduced by your changes.
4. Verify the authentication and authorization flow.
5. Verify that owners and collaborators can access their projects.
6. Verify that missing and unauthorized projects render `AccessDenied`.
7. Verify that the workspace renders with the correct project context.
8. Verify that the existing `ProjectSidebar` highlights the current room.
9. Verify that the layout fills the viewport correctly.
10. Confirm that no canvas, Liveblocks, AI chat, or real sharing functionality was introduced.

Do not claim a check passed unless you actually ran it.

## 7. Final Report

When finished, provide:

- Summary of the implementation.
- Files created and modified.
- Architectural decisions made.
- Authentication and authorization behavior.
- Verification commands executed and their results.
- Any remaining issues or limitations.

## Final Instruction

You are responsible for the entire task: repository investigation, architectural planning,creationf of the implementation plan.

Prioritize correctness, consistency with the existing codebase, and minimal changes over unnecessary complexity.