const [laneApi, laneUi] = await runs.all([
  {
    key: "lane-api-route",
    label: "Add Task 5 ProjectCollaborator API route",
    agent: "worker",
    task: `
GOAL: Add the ProjectCollaborator API route (Task 5 of the 2026-11-01-share-dialog plan), enforcing the share-dialog collaborator API contracts per the plan Definition of Done.

Repository/cwd: C:\\Users\\ramif\\orca\\workspaces\\ghost-ai\\feat-editor-access-sharing (branch feat/editor-access-sharing).

EDIT BOUNDARY / AUTHORITY: You own exactly ONE source seam: the new file
  app/api/projects/[projectId]/collaborators/route.ts
(plus only its own validation). You may NOT edit any other file in the repo. Do NOT run git status/commit/staged changes. Only create the route file, then run your own validation commands.

CONTEXT / EVIDENCE (already read):
- Existing auth pattern to copy exactly: app/api/projects/[projectId]/route.ts uses
  \`const { isAuthenticated, userId } = await auth(); if (!isAuthenticated) return Response.json({error:"Unauthorized"},{status:401});\`
  then \`const prisma = getPrismaClient();\` and returns 403 for missing project.
- lib/share-collaborators.ts exports: getCollaborators(projectId, userId, prisma), inviteCollaborator(projectId, userId, email, prisma), removeCollaborator(projectId, userId, email, prisma), CollaboratorServiceError (has \`status\`).
- lib/share-dialog-helpers.tsx exports fetchCollaboratorByEmail(email) -> CollaboratorEnrichment (name, avatarUrl, email).
- The client (Task 4, not yet written) will fetch GET /api/projects/[projectId]/collaborators and expect { collaborators: CollaboratorEnrichment[] }.

IMPLEMENTATION:
Create app/api/projects/[projectId]/collaborators/route.ts with three route handlers following Next.js route conventions:
- GET: auth 401 if not authenticated. Require ownership/access by calling getCollaborators(projectId, userId, getPrismaClient()) — the service enforces 403 if the caller is neither owner nor collaborator or the project is missing. Then enrich every row with fetchCollaboratorByEmail(row.collaboratorEmail) via Promise.all. Return { collaborators: enriched[] }.
- POST (invite): auth 401. Parse JSON body { email }. Call inviteCollaborator(projectId, userId, email, getPrismaClient()) — the service enforces 403 (ownership), 400 (invalid email via EMAIL_PATTERN), 409 (duplicate). Map any CollaboratorServiceError to its \`status\`: return Response.json({error: err.message}, {status: err.status}). On success return { collaborator: { id, projectId, collaboratorEmail } }.
- DELETE (remove): auth 401. Parse JSON body { email }. Call removeCollaborator(projectId, userId, email, getPrismaClient()) — service enforces 403 (ownership), 404 (not found). Map CollaboratorServiceError to its status. On success return { success: true }.

Rules:
- Use auth() and getPrismaClient() from @clerk/nextjs/server and @/lib/prisma exactly as in the existing route.
- Rely on the service's assertCanModifyProject for 403 — do not bypass or reimplement ownership checks.
- Enrichment must use fetchCollaboratorByEmail (Clerk getUserList with emailAddress filter, email-only fallback).
- Route params: \`{ params }: { params: Promise<{ projectId: string }> }\`.

SUCCESS CRITERIA:
- Route file exists and builds/lints cleanly (npm run build, npm run lint).
- GET/POST/DELETE handlers implement the status contracts: GET 401 unauth; POST/DELETE 401 unauth; ownership 403; duplicate email 409; invalid email 400; not-found 404 (remove).
- No other files changed.

VALIDATION: run npm run build and npm run lint in the repo and confirm clean output.

STOP/ESCALATION: If the build/lint fails, fix only within your seam (the route file) and re-run. If you cannot resolve, report the exact failure and stop — do not edit other files.

Expected OUTPUT: a concise report with the created file path, the three handler contracts, the validation commands run and their clean results, and the list of files you touched (should be exactly one file).
`,
  },
  {
    key: "lane-ui-wiring",
    label: "Wire ShareDialog into editor layers",
    agent: "worker",
    task: `
GOAL: Wire the ShareDialog into the editor layers (Task 4 of the 2026-11-01-share-dialog plan) and pass share context from the editor layers and the room page, per the handoff and plan §10/§13.

Repository/cwd: C:\\Users\\ramif\\orca\\workspaces\\ghost-ai\\feat-editor-access-sharing (branch feat/editor-access-sharing).

EDIT BOUNDARY / AUTHORITY: You own exactly these files (exclusive):
  components/editor/editor-navbar.tsx
  components/editor/editor-client.tsx
  components/editor/workspace-toggle-client.tsx
  components/editor/workspace-layout.tsx
  app/editor/page.tsx
  app/editor/[roomId]/page.tsx
You may NOT edit any other file (proxy, lib, share-dialog, existing dialogs, other pages, or any file owned by Lane 1). Do NOT run git status/commit/staged changes. Only edit the listed files, then run your own validation commands.

CONTEXT / EVIDENCE (already read):
- components/editor/share-dialog.tsx exports ShareDialog with props: open, onClose, project(Project|null), role("owner"|"collaborator"|null), currentEmail, collaborators(CollaboratorEnrichment[]), inviteEmail, setInviteEmail, isInviting?, onInvite, onRemove(email), copyUrl, isCopied?, onCopyLink. Ownership-aware: owner sees invite form + remove; collaborator sees read-only list.
- lib/share-dialog-helpers.tsx exports CollaboratorEnrichment and fetchCollaboratorByEmail(email).
- lib/share-collaborators.ts exports getCollaborators(projectId,userId,prisma), removeCollaborator(...), CollaboratorServiceError.
- app/api/projects/[projectId]/route.ts exists (PATCH/DELETE). The new Task-5 collaborator route (app/api/projects/[projectId]/collaborators/route.ts) is being added by an independent lane (Lane 1) and will exist by the time you run validation. Its contract (for your client fetch): GET returns { collaborators: CollaboratorEnrichment[] }; POST accepts { email } and returns success; DELETE accepts { email } and returns success. It enforces auth 401, ownership 403, duplicate 409, invalid email 400.
- app/editor/page.tsx renders EditorClient with ownedProjects, sharedProjects, currentUserId.
- app/editor/[roomId]/page.tsx is a server component: getCurrentClerkIdentity() -> {userId,email}; getAccessibleProject(userId, roomId) -> {id,name,slug,ownerId} or null (AccessDenied). Renders WorkspaceLayout project={project} userId={userId}.
- lib/project-access.ts getCurrentClerkIdentity returns {userId,email}; getAccessibleProject returns the subset shape.

IMPLEMENTATION (follow the plan §10 files and the share-model design below):
1. editor-navbar.tsx: Add exported interface EditorNavbarShareProps (the share model object): { open, onClose, onOpenShare, project: Project|null, role, currentEmail, collaborators, inviteEmail, setInviteEmail, isInviting, onInvite, onRemove, copyUrl, isCopied, onCopyLink }. Extend EditorNavbarProps with optional \`share?: EditorNavbarShareProps\`. Import ShareDialog (from @/components/editor/share-dialog), type CollaboratorEnrichment (from @/lib/share-dialog-helpers), type Project (from @/types/project). Wire the existing Share button: onClick = if share?.open then share.onClose() else share?.onOpenShare(). When share is provided, render <ShareDialog ...> with all share props. Do not change the existing sidebar/AI/UserButton behavior.
2. editor-client.tsx: Add \`currentEmail?: string\` to EditorClientProps. Own state: shareOpen, inviteEmail, isInviting, isCopied, collaborators (CollaboratorEnrichment[]). Add refreshCollaborators(): fetch GET /api/projects/\${selectedProjectId}/collaborators; on ok set collaborators to data.collaborators (fall back [] if not an array). Wire a useEffect that calls refreshCollaborators when selectedProjectId changes. Derive selectedProject = allProjects.find(p=>p.id===selectedProjectId) ?? null, copyUrl = selectedProject ? \`/editor/\${selectedProject.slug}\` : "", role = owner if selectedProject.ownerId===currentUserId else collaborator if (currentEmail && collaborators.some(c=>c.email===currentEmail)) else null. Handlers (use useCallback): onInvite -> POST /api/projects/\${selectedProjectId}/collaborators {email:inviteEmail; on ok clear inviteEmail, finally set isInviting false. onRemove(email) -> DELETE ... {email}; on ok clear inviteEmail. onCopyLink -> setIsCopied(true), after ~1500ms setIsCopied(false). onOpenShare/onClose -> setShareOpen true/false. Build the share model object with all the fields above (project=selectedProject, role, currentEmail=currentEmail ?? "", collaborators, inviteEmail, setInviteEmail, isInviting, onInvite, onRemove, copyUrl, isCopied, onCopyLink, open=shareOpen, onClose, onOpenShare). Pass share={share} to <EditorNavbar ...> (alongside existing props).
3. workspace-toggle-client.tsx: Extend WorkspaceToggleClientProps with role: "owner"|"collaborator"|null, currentEmail: string, collaborators: CollaboratorEnrichment[]. Own share state: shareOpen, inviteEmail, isInviting, isCopied. Build share model with handlers using fetch to /api/projects/\${project.id}/collaborators: onInvite -> POST {email:inviteEmail}; onRemove(email) -> DELETE {email}; onCopyLink -> setIsCopied(true) + 1500ms reset. copyUrl = \`/editor/\${project.slug}\`. Pass share={share} to <EditorNavbar ...> (alongside existing props). Do not add new project/userId data from props.
4. workspace-layout.tsx: Extend WorkspaceLayoutProps with role, currentEmail, collaborators. Pass these (plus project, userId) to <WorkspaceToggleClient ...>. No new state here.
5. app/editor/page.tsx: change auth to \`const { isAuthenticated, userId, email } = await auth();\`, and pass \`currentEmail={email}\` to <EditorClient ...>.
6. app/editor/[roomId]/page.tsx: after getAccessibleProject, fetch collaborators server-side: \`const collaborators = await getCollaborators(project.id, userId, getPrismaClient()); const enriched = await Promise.all(collaborators.map(c => fetchCollaboratorByEmail(c.collaboratorEmail)));\` derive role = project.ownerId === userId ? "owner" : (enriched.some(c => c.email === userId) ? "collaborator" : null). Pass role, currentEmail={email}, collaborators to <WorkspaceLayout ... role={role} currentEmail={email} collaborators={enriched} />. Keep existing redirect/AccessDenied behavior. Add the needed imports (getCollaborators, fetchCollaboratorByEmail, getPrismaClient).

Rules:
- Client components may only fetch the API route; do NOT call getCollaborators/inviteCollaborator directly (those need prisma, server-only).
- Enrichment uses fetchCollaboratorByEmail (email-only fallback built in).
- The share model passed to EditorNavbar must match ShareDialogProps exactly (all fields).
- Do not break existing editor behavior (sidebar, AI, dialogs).

SUCCESS CRITERIA:
- All six files edited as specified; ShareDialog is composed in editor-navbar (via share prop), editor-client, and workspace-toggle-client (via share prop), with share state owned by editor-client and workspace-toggle-client.
- app/editor/page.tsx passes currentEmail; app/editor/[roomId]/page.tsx passes role/currentEmail/collaborators.
- Build/lint clean (npm run build, npm run lint).

VALIDATION: run npm run build and npm run lint in the repo and confirm clean output.

STOP/ESCALATION: If build/lint fails, fix only within your files (editor-navbar, editor-client, workspace-toggle-client, workspace-layout, app/editor/page.tsx, app/editor/[roomId]/page.tsx). Do not edit files from Lane 1. If you cannot resolve, report the exact failure and stop.

Expected OUTPUT: a concise report with the files changed, the share-model wiring summary, and the validation commands run and their clean results.
`,
  }
]);
return [laneApi.output, laneUi.output];
