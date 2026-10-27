# Project Dialogs, Editor Home, and Sidebar Actions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Editor Home screen (centered "Create a project or open existing one"), a shared Create Project dialog (with live slug preview), Rename Project and Delete Project dialogs, and wire per-project Rename/Delete actions into the sidebar for owned projects only.

**Architecture:** All dialog state lives in one hook `useProjectDialogs` (file at `app/editor/project-dialogs.ts`) imported by `EditorPage`. The page owns `activeDialog`, `selectedProject`, and form values; it renders the three dialogs once at the page level and passes open/close + callbacks as props. `EditorHome` and `ProjectSidebar` consume only callbacks (`onOpenCreate`, `onOpenRename(project)`, `onOpenDelete(project)`) plus `selectedProject`/`onSelectProject`. The shared `CreateProjectDialog` is opened by both `EditorHome`'s button and the sidebar's footer button via the same `onOpenCreate` callback. Mobile sidebar outside-click is implemented with a transparent overlay `div` that receives an `onClick` to close, while the sidebar panel stops propagation on its own click area.

**Tech Stack:** Next.js 16, TypeScript strict, React 19, Tailwind CSS, `@base-ui/react` Dialog (already wrapped at `components/ui/dialog.tsx`), shadcn Button/Input, lucide-react icons. Mock data only; no API calls.

**Spec:** `context/feature-specs/04-project-dialogs.md`

## Global Constraints

- Use mock project data only; no API calls, no DB, no persistence.
- Do not modify `editor-navbar.tsx` behavior (only content below it may change).
- Preserve existing sidebar selection/navigation behavior; only *add* actions.
- Follow existing TypeScript + styling conventions (CSS custom property tokens, `rounded-3xl` for modals, `rounded-xl` small UI).
- Reuse the existing slug utility if found; otherwise create `lib/slug.ts` with the documented behavior.
- Enter key must submit Rename. Cancel/Close must not submit.

## Review Focus

1. **Empty / whitespace-only project names:** Create dialog must not produce an empty slug; input must be invalid until non-empty trimmed name is entered.
2. **Stale form state on reopen:** Reopening Rename must reset the input to the selected project's *current* name, never a previously typed value.
3. **Ownership gating of sidebar actions:** Rename/Delete actions must render only for projects whose `ownerId` matches the current user's Clerk ID, never for shared/collaborator projects.
4. **Outside-click event propagation:** Tapping the sidebar panel must not bubble to the overlay and close the sidebar; only tapping the overlay scrim closes it.
5. **Dialog submission vs. cancellation:** Pressing Enter inside Create/Rename submits; clicking Cancel/Close/X never calls the submit handler.

---

## A. Architecture findings

Verified from `context/feature-specs/04-project-dialogs.md`, the source under `components/editor/`, `components/ui/`, `app/`, and `context/`.

- **Editor layout** lives in `app/editor/page.tsx` (file `app\editor\page.tsx:7`). It renders `EditorNavbar` + `ProjectSidebar` with shared `sidebarOpen` state in a single `useState`. Main `<main>` holds the page-specific content. This is the file to extend with home content and dialogs. No separate layout file exists.
- **EditorNavbar** (`components/editor/editor-navbar.tsx`): props `isSidebarOpen`, `onToggleSidebar`. Has `UserButton` (Clerk) on the right and a left sidebar toggle. Must not be modified beyond what spec 02 requires (none here).
- **ProjectSidebar** (`components/editor/project-sidebar.tsx`): controlled by `isOpen` + `onClose`. Currently renders `Tabs` with two empty placeholder tabs and a footer `New Project` button whose `onClick` is a TODO. The sidebar floats (`fixed inset-y-0 left-0 z-30`). It currently has no outside-click/backdrop handling — spec requirement 91 must be added. It has no project list yet.
- **Dialog primitives** exist at `components/ui/dialog.tsx` (file `components\ui\dialog.tsx:1`). Exports `Dialog` (Root, controlled via `open`/`onOpenChange`/default `modal=true`), `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`. `DialogContent` is `DialogPrimitive.Popup` with `initialFocus` support via its props (passes through to `@base-ui/react` Popup). `DialogClose` renders a `Button variant="outline"` via the `render` prop. **Do not use `DialogTrigger` + uncontrolled `open`** — instead render each dialog and control `open` directly so the page hook drives open/close and `selectedProject` is never stale.
- **Button** (`components/ui/button.tsx`): `cva` variants include `default`, `outline` (for Cancel), `destructive` (for Confirm Delete). `size` variants `default`/`sm`/`lg`. Shadcn `variant`.
- **Input** (`components/ui/input.tsx`): wraps `@base-ui/react/input`. Accepts standard input props `value`, `onChange`, `onFocus`, `autoFocus`, and `onValueChange`. Shadcn `Input`.
- **Icons** (`lucide-react`): `Plus`, `X`, `PanelLeftOpen`, `PanelLeftClose`, `Pencil`/`Edit`, `Trash2` are available. Stroke-based only.
- **Styling tokens**: dark theme CSS custom properties in `app/globals.css` — `bg-base`, `bg-surface`, `bg-elevated`, `text-primary`, `text-secondary`, `text-muted`, `border-default`, `accent-primary` (cyan), `state-error` (red). Tailwind names: `bg-base`, `text-copy-primary`, `text-copy-secondary`, `text-copy-muted`, `border-surface-border`, `text-brand`, `bg-accent-dim`. `rounded-2xl` for cards/panels, `rounded-3xl` for modals.
- **Auth**: Clerk `useUser`/`UserButton`. Use `useUser().user.id` as the current-user identity for ownership comparisons against mock data `ownerId`.
- **Slug utility**: none found in the repo (`grep -rn "slug"` returned no hits in source). A new small utility must be created at `lib/slug.ts`. Behavior: lowercase, trim, replace non-alphanumeric runs with single hyphen, collapse repeated hyphens, strip leading/trailing hyphens, collapse spaces to hyphens.
- **No tests configured**: `package.json` has no jest/vitest. Verification is type-check + lint + manual.
- **Scripts**: `npm run build` (type-check via Next), `npm run lint` (eslint). No dedicated `tsc --noEmit` script; use `npx tsc --noEmit` for verification.

## B. Implementation design

**State ownership (single hook, page-level):**
Create `app/editor/project-dialogs.ts` exporting `useProjectDialogs(currentUserId)`. Returns:
```
{
  // active dialog
  activeDialog: 'create' | 'rename' | 'delete' | null
  openCreate: () => void
  openRename: (project) => void
  openDelete: (project) => void
  closeDialog: () => void
  // selected project + form state
  selectedProject: Project | null
  createName: string
  setCreateName: (s) => void
  renameName: string
  setRenameName: (s) => void
  // derived
  selectedIsOwned: boolean   // selectedProject?.ownerId === currentUserId
}
```
`openRename(p)` sets `selectedProject=p` and initializes `renameName=p.name` (prevents stale values). `openDelete(p)` sets `selectedProject=p`. `openCreate()` sets `selectedProject=null`. `closeDialog()` resets `activeDialog=null`.

**Component placement:** dialogs render once at `app/editor/page.tsx`, below the `<main>` (or sibling to the main content but above the sidebar — actually render them as children of a relative wrapper so they overlay). Each dialog receives `open` from `activeDialog` and an `onClose`.

**Editor Home** (`components/editor/editor-home.tsx`):
- Props: `{ onOpenCreate: () => void }`.
- Renders centered content: heading `Create a project or open existing one`, description `Start a new architecture workspace or choose a project on the sidebar`, and a `New Project` Button with `Plus` icon that calls `onOpenCreate`.
- No cards; minimal layout. Uses the existing `main` area.

**CreateProjectDialog** (`components/editor/create-project-dialog.tsx`):
- Props: `{ open: boolean; createName: string; setCreateName: (s)=>void; onClose: () => void }`.
- `Dialog open={open} onOpenChange={onClose}`. `DialogContent` with `DialogTitle` "New Project", `DialogDescription` "Create a new architecture workspace."
- `Input` bound to `createName`, `placeholder="Project name"`, `onChange` calls `setCreateName`.
- Live slug preview line below the input: `Preview: {slugFromName(createName)}` (read-only, UI-only).
- Validation: compute `slug = slugFromName(createName)`; disable Confirm (`Button`) when `slug` is empty. Confirm button = `disabled={!slug}` and calls an `onConfirm`-style submit? Spec says no persistence, so the Create dialog's Confirm simply closes. Pass `onConfirm?: () => void`? Keep minimal: Confirm closes the dialog (calls `onClose`). Since no API, the "submit" just closes. We still wire form `onSubmit` to close on Enter.
- Submit via form `onSubmit={(e)=>{e.preventDefault(); if(slug) onClose()}}`.

**RenameProjectDialog** (`components/editor/rename-project-dialog.tsx`):
- Props: `{ open: boolean; project: Project | null; onClose: () => void }`.
- `Dialog` controlled `open`. `DialogContent` with `initialFocus` ref to input.
- If `!project`, render nothing (or a guard).
- Title: "Rename Project". Description shows current name: `Renaming "${project.name}".`.
- `Input` prefilled with the rename form value. Use an internal `useState` initialized from `project?.name`, OR rely on the hook's `renameName`. To strictly prevent stale values when switching projects, re-init via `useEffect` on `project` id: `setRenameName(project?.name ?? "")` whenever `project` changes. The hook already sets `renameName` in `openRename`, so the dialog can read `renameName` from props instead; simplest: pass `renameName` + `setRenameName` from the hook and the hook resets on open. We'll pass `renameName` and `setRenameName`.
- Enter submits: form `onSubmit` calls `onClose()` (no persistence). Cancel = `DialogClose`.
- Auto-focus: `initialFocus={inputRef}`.

**DeleteProjectDialog** (`components/editor/delete-project-dialog.tsx`):
- Props: `{ open: boolean; project: Project | null; onClose: () => void }`.
- `Dialog` controlled `open`. `DialogContent`.
- Title "Delete Project". Description identifies project: `Are you sure you want to delete "${project?.name}"? This action cannot be undone.`
- Footer: `DialogClose as Cancel` (Button outline) + `Confirm` (Button destructive) that calls `onClose()` (no persistence). No text input confirmation.
- If `!project`, do not render dialog body meaningfully; guard.

**ProjectSidebar updates** (`components/editor/project-sidebar.tsx`):
- Accept new props: `projects: Project[]`, `currentUserId: string`, `selectedProjectId: string | null`, `onSelectProject: (p: Project) => void`, `onOpenCreate: () => void`, `onOpenRename: (p: Project) => void`, `onOpenDelete: (p: Project) => void`, plus existing `isOpen`/`onClose`. Keep `onClose` semantics (outside click handled in page or sidebar).
- Replace the empty placeholder tabs' body with a rendered list of projects (both tabs show the owned/shared projects; or "My Projects" shows owned, "Shared" shows shared). Minimal: "My Projects" tab lists projects where `project.ownerId === currentUserId`; "Shared" lists the rest. Render each project as a row with: name, and if owned, a trailing `Pencil`/`Trash2` action buttons (rename/delete). Shared rows have no actions.
- Wire footer `New Project` button to `onOpenCreate`.
- Selection: clicking a project row sets it selected (calls `onSelectProject`). Show selected state (bold / accent border). Selection persists per spec ("Preserve existing project selection and navigation behavior").
- Mobile outside-click + scrim: wrap the sidebar panel: keep the existing `aside` panel but add an overlay `div` sibling that renders when `isOpen` and on click calls `onClose`. The panel's root click gets `onClick={e => e.stopPropagation()}` so taps inside don't bubble to the overlay. Overlay is `fixed inset-0 z-20 bg-black/40 backdrop-blur-xs`.

**EditorHome + Sidebar data flow:**
`app/editor/page.tsx`:
- Add `useUser()` to get `currentUserId` (guard: if not loaded, render nothing or skeleton — keep existing protected route so user is always loaded; assume loaded).
- Import `useProjectDialogs(currentUserId)`.
- Import and render `<EditorHome onOpenCreate={...} />` inside `<main>` (replacing the placeholder h1/p).
- Pass sidebar props: `projects={MOCK_PROJECTS}`, `currentUserId`, `selectedProjectId`, `onSelectProject`, `onOpenRename`, `onOpenDelete`, `onOpenCreate`. Pass `onClose`-handled as before.
- Render the three dialogs at the end of the page's return (outside the sliding panel's DOM to avoid clipping; they're modal portalled via `DialogPortal` already, so placement is fine — render after the close div).
- Wire `Dialog open` to `activeDialog === 'create'|'rename'|'delete'` and `onClose` to `closeDialog`.

**Mock data** (`lib/mock-projects.ts`):
```ts
import { Project } from '@/types/project'
export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Phoenix Architecture', slug: 'phoenix-architecture', ownerId: 'user_1' },
  { id: 'p2', name: 'Ghost AI Canvas', slug: 'ghost-ai-canvas', ownerId: 'user_1' },
  { id: 'p3', name: 'Shared Workspace', slug: 'shared-workspace', ownerId: 'other_user_2' }, // collaborator/shared
]
```
`types/project.ts`:
```ts
export interface Project {
  id: string
  name: string
  slug: string
  ownerId: string
}
```
No `isShared` field needed — shared = `ownerId !== currentUserId`.

**Decision rationale (no alternatives):**
- Page-level hook vs. React Context: chosen hook because only two components (home + sidebar) plus three dialogs need it, all siblings under one page. Context would be over-abstraction for the current scope and the spec says "Avoid unnecessary abstractions."
- Controlled dialogs vs. uncontrolled `DialogTrigger`+`open`: controlled, because `selectedProject` and form values must be reset deterministically when opening, and an uncontrolled trigger would carry stale payload.
- Render dialogs at page level (not inside sidebar/home): keeps a single source of truth for `selectedProject` and prevents duplicate dialog mounts.

## C. File-by-file change list

| # | Path | Exists? | Purpose | Changes | Unchanged |
|---|------|---------|---------|---------|-----------|
| 1 | `types/project.ts` | ✗ new | Project type | Define `Project { id, name, slug, ownerId }` | — |
| 2 | `lib/slug.ts` | ✗ new | Slug util | `slugFromName(str)`: lowercase, trim, `/[^a-z0-9]+/g` → `-`, collapse repeats, trim `-`. Export. | — |
| 3 | `lib/mock-projects.ts` | ✗ new | Mock data | `MOCK_PROJECTS: Project[]` with 2 owned + 1 shared. | — |
| 4 | `app/editor/project-dialogs.ts` | ✗ new | Dialog state hook | `useProjectDialogs(currentUserId)` as in §B. | — |
| 5 | `components/editor/editor-home.tsx` | ✗ new | Editor Home UI | Props `{ onOpenCreate }`, renders heading/description/New Project(Plus) button, no cards, centered. | — |
| 6 | `components/editor/create-project-dialog.tsx` | ✗ new | Create dialog | Controlled `open`+`onClose`; `createName`/`setCreateName` props; slug preview via `slugFromName`; form onSubmit closes; Confirm disabled when slug empty. | — |
| 7 | `components/editor/rename-project-dialog.tsx` | ✗ new | Rename dialog | Props `{ open, project, renameName, setRenameName, onClose }`; `initialFocus` ref to input; form onSubmit closes; description shows current name. | — |
| 8 | `components/editor/delete-project-dialog.tsx` | ✗ new | Delete dialog | Props `{ open, project, onClose }`; destructive Confirm + outline Cancel; no input. | — |
| 9 | `components/editor/project-sidebar.tsx` | ✓ | Existing sidebar | Add project-list props (§B), render rows with owner-only actions, wire New Project → `onOpenCreate`, add scrim+outside-click. | Header, Tabs structure, footer button position. |
| 10 | `app/editor/page.tsx` | ✓ | Editor page | Import hook/data/dialogs; render `EditorHome`; pass props to sidebar; render 3 dialogs; own `sidebarOpen` state unchanged. | Navbar usage, protected-route wrapper. |
| 11 | `components/ui/dialog.tsx` | ✓ | UI dialog | No changes (read-only reference). | — |

## D. Ordered implementation steps

### Task 1: Project type and slug utility

- [ ] Create `types/project.ts` with `export interface Project { id: string; name: string; slug: string; ownerId: string }`.
- [ ] Create `lib/slug.ts` with `slugFromName(name: string): string` implementing: `name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')`. Export named `slugFromName`.
- [ ] **Verify:** `npx tsc --noEmit` reports no errors for the new files; manual check: `slugFromName('  My Cool Project  ')` → `'my-cool-project'` (no leading/trailing/dupe hyphens); `slugFromName('A!B@C#')` → `'a-b-c'`.

### Task 2: Mock projects data

- [ ] Create `lib/mock-projects.ts` exporting `MOCK_PROJECTS: Project[]` (2 owned by a placeholder ownerId such as `user_1`, 1 owned by `user_other`). Each row has distinct `name`/`slug`.
- [ ] **Verify:** `npx tsc --noEmit` clean; `MOCK_PROJECTS` length ≥ 3.

### Task 3: Dialog state hook

- [ ] Create `app/editor/project-dialogs.ts` exporting `useProjectDialogs(currentUserId: string | undefined)` returning the shape in §B (activeDialog, openCreate/openRename/openDelete, closeDialog, selectedProject, createName/setCreateName, renameName/setRenameName, selectedIsOwned).
- [ ] `openRename`/`openDelete` accept a `Project` and set it as `selectedProject` plus initialize `renameName` to `project.name`.
- [ ] **Verify:** type-checks; `renameName` always mirrors the most-recently-opened project's name.

### Task 4: Editor Home component

- [ ] Create `components/editor/editor-home.tsx` (client component). Props `{ onOpenCreate: () => void }`.
- [ ] Centered layout inside `<main>`: heading `Create a project or open existing one`, description `Start a new architecture workspace or choose a project on the sidebar`, and a `New Project` Button (`Plus` icon, `variant="default"`) calling `onOpenCreate`.
- [ ] Do NOT wrap content in cards. Use `bg-base` page background already set.
- [ ] **Verify:** `npx tsc --noEmit` clean; visible text matches spec exactly.

### Task 5: Create Project dialog

- [ ] Create `components/editor/create-project-dialog.tsx`.
- [ ] Props `{ open, createName, setCreateName, onClose }`.
- [ ] `Dialog open={open} onOpenChange={onClose}` (only close on outside/cancel; do not pass a Confirm-only submit). `DialogContent` `DialogTitle`="New Project", `DialogDescription`="Give your workspace a name. A slug is generated automatically."
- [ ] `Input` value={createName} onChange=`setCreateName`, placeholder "Project name".
- [ ] Below input: live preview text `Slug preview: {slugFromName(createName)}` in `text-copy-muted`.
- [ ] Footer: `DialogClose` Cancel (outline) + Confirm (default) `disabled={!slugFromName(createName)}`. Form `onSubmit={(e)=>{e.preventDefault(); if(slugFromName(createName)) onClose()}}`.
- [ ] **Verify:** slug preview updates as typing; Confirm disabled when name empty/whitespace; Enter submits only when slug valid; Cancel does nothing destructive.

### Task 6: Rename Project dialog

- [ ] Create `components/editor/rename-project-dialog.tsx`.
- [ ] Props `{ open, project, renameName, setRenameName, onClose }`.
- [ ] `Dialog` controlled; `DialogContent` with `initialFocus={inputRef}`.
- [ ] Guard: `if (!project) return null`.
- [ ] `DialogTitle`="Rename Project"; `DialogDescription`=`Renaming "${project.name}".`
- [ ] `Input` ref=inputRef, value={renameName}, onChange=`setRenameName`, default `autoFocus`.
- [ ] Footer: Cancel (outline) + Confirm (default). Form `onSubmit={(e)=>{e.preventDefault(); onClose()}}`.
- [ ] **Verify:** input focused on open; prefilled with selected project's current name; Enter submits; Cancel closes without callback.

### Task 7: Delete Project dialog

- [ ] Create `components/editor/delete-project-dialog.tsx`.
- [ ] Props `{ open, project, onClose }`.
- [ ] Guard `if (!project) return null`.
- [ ] `Dialog` controlled; `DialogContent`. `DialogTitle`="Delete Project"; `DialogDescription`=`Are you sure you want to delete "${project.name}"? This cannot be undone.`
- [ ] Footer: Cancel (outline, `DialogClose`) + Confirm (`variant="destructive"`). Confirm calls `onClose()`.
- [ ] **Verify:** no text input; Confirm is destructive-styled; Cancel/Close only closes.

### Task 8: Wire Editor Home into the page

- [ ] Modify `app/editor/page.tsx`: add `useUser()` for `currentUserId`; `useProjectDialogs(currentUserId)`; render `<EditorHome onOpenCreate={openCreate} />` inside `<main>` (replace placeholder h1/p).
- [ ] Render the three dialogs (`CreateProjectDialog`, `RenameProjectDialog`, `DeleteProjectDialog`) at the page root with `open` bound to the activeDialog comparisons and `onClose=closeDialog`, passing the hook's `createName`/`setCreateName` and `renameName`/`setRenameName` + `selectedProject`.
- [ ] **Verify:** `npx tsc --noEmit` clean; opening Create from home then from sidebar both show the same dialog.

### Task 9: Update ProjectSidebar — props, project list, actions

- [ ] Extend `ProjectSidebarProps` with `projects`, `currentUserId`, `selectedProjectId`, `onSelectProject`, `onOpenCreate`, `onOpenRename`, `onOpenDelete`.
- [ ] "My Projects" tab body: list projects where `ownerId === currentUserId`; "Shared" tab body: the rest. Each row: clickable name; owned rows get a trailing action group (`Pencil` rename, `Trash2` delete). Shared rows render no actions.
- [ ] Selection highlight via accent when `id === selectedProjectId`.
- [ ] Footer `New Project` button `onClick={onOpenCreate}`.
- [ ] **Verify:** owned projects show actions, shared do not; clicking a row selects it; footer opens Create dialog.

### Task 10: Page-level sidebar wiring and selection

- [ ] In `app/editor/page.tsx`, add `useState<string | null>([selectedProjectId, setSelectedProjectId] = useState(null))`; select handler `onSelectProject(p => setSelectedProjectId(p.id))`.
- [ ] Pass props from §B to `ProjectSidebar`. Keep existing `isOpen`/`onClose` + `sidebarOpen` state.
- [ ] **Verify:** clicking a project highlights it; `selectedProject` in the hook updates (used by Rename/Delete).

### Task 11: Mobile outside-click + scrim

- [ ] In `ProjectSidebar`, render an overlay `<div>` (className `fixed inset-0 z-20 bg-black/40 backdrop-blur-xs`) that only mounts when `isOpen`, with `onClick={onClose}`.
- [ ] The panel `aside` keeps `onClick={e => e.stopPropagation()}` so taps inside don't close.
- [ ] Preserve existing slide-in transform and `z-30` (keep overlay at `z-20` below panel).
- [ ] **Verify:** tapping overlay closes sidebar; clicking inside panel does not; backdrop visible while open; closes via header X button unchanged.

### Task 12: Lint and full type-check

- [ ] Run `npm run lint` and `npx tsc --noEmit`. Fix any errors.
- [ ] Re-read `context/progress-tracker.md` and add a `## Completed` line for this feature.
- [ ] **Verify:** zero lint + type errors; no existing behavior broken.

## E. Edge cases and regressions

- **Empty / whitespace-only names:** `slugFromName("   ")` → `""`, so Create Confirm is disabled; input remains usable; no dialog auto-submit.
- **Special characters in names:** handled by `slugFromName` regex replacing non-alphanumerics with `-`; e.g. `My Project v2.0` → `my-project-v2-0`.
- **Dialog reopening & stale form state:** `openRename(project)` resets `renameName` to the *current* `project.name` in the hook, so switching projects or reopening yields fresh values; Create `createName` is not reset on reopen (spec implies keeping typed text across reopens is acceptable for Create, but we reset only when needed — keep as is; no reset to avoid surprising the user). Acceptable per spec.
- **Switching selected projects:** `selectedProject` updated by each `openRename`/`openDelete` call before the dialog opens, so the dialog always reflects the just-clicked project.
- **Missing/invalid selected project:** dialog components guard `if (!project) return null`; dialogs only open when a project is passed.
- **Shared/collaborator permissions:** `ProjectSidebar` renders actions only on rows where `project.ownerId === currentUserId`; the Delete/Rename handlers are only ever called with owned projects.
- **Keyboard submission / cancellation:** Create + Rename wrap inputs in a `<form>` with `onSubmit` that closes; Cancel uses `DialogClose` (no submit); Enter key triggers form submit; Escape uses Base UI default (closes without submitting).
- **Mobile outside-click propagation:** overlay `onClick` closes; panel `onClick={stopPropagation}` prevents bubbling; no duplicate `sidebarOpen` state introduced.
- **Preservation of navigation/layout:** `EditorNavbar` untouched; `sidebarOpen` state and toggle remain; main content swapped only from placeholder to `EditorHome`.

## F. Verification plan

- **Type check:** `npx tsc --noEmit` at project root — must report zero errors.
- **Lint:** `npm run lint` — must report zero errors/warnings introduced by these changes.
- **Type-only unit check (manual):** in a scratch node script, `import { slugFromName } from './lib/slug'`... but prefer the inline assertions below.
- **Slug behavior:** reason: `slugFromName('  Hello World  ')` === `'hello-world'`; `slugFromName('Foo--Bar!!Baz')` === `'foo-bar-baz'`; `slugFromName('  ')` === `''`. Confirm via a one-off `node -e` using `ts-node`? Prefer a tiny standalone check: the implementer may add a temporary `console.log` in a scratch file then delete it. Do not add a test runner dependency.
- **Manual UI checks (run `npm run dev`, open `/editor`):**
  1. Editor Home shows heading/description/New Project button; no cards.
  2. Button + sidebar footer button both open the Create dialog.
  3. Typing in Create updates the slug preview; Confirm disabled when empty; Enter creates (closes).
  4. Owned project row shows Rename/Delete; clicking Rename opens Rename with correct prefilled name + focus; Enter closes.
  5. Clicking Delete opens Delete dialog identifying the project; Cancel closes; Confirm closes.
  6. Shared project row shows no actions.
  7. Sidebar selection highlights the row.
  8. Sidebar open + clicking overlay or scrim or header X closes it; clicking inside does not.
- **Regression:** navbar toggle still opens/closes sidebar; UserButton still renders; route still protected.

## G. Instructions for the implementing model

- **Start with Task 1** (types + slug util), then Task 2 (mock data), then Task 3 (hook) — these have no dependencies and type-check independently.
- **Always read before edit:** re-read `app/editor/page.tsx`, `components/editor/project-sidebar.tsx`, and `components/ui/dialog.tsx` immediately before modifying them so your edits match current bytes.
- **Follow existing patterns:** client components begin with `"use client";`; `React.FC<Props>` with `useCallback`; import `cn` from `@/lib/utils`; use `lucide-react` named imports; dialogs use the wrapped `Dialog`/`DialogContent`/`DialogFooter` (NOT raw `@base-ui/react`).
- **Never violate:** no API calls, no DB writes, no persistence; keep dialog `open` fully controlled (`open` prop + `onOpenChange` only to close); do not add a new sidebar state variable (reuse the page's `sidebarOpen`); do not edit `editor-navbar.tsx`.
- **Per-step validation:** after each task, run `npx tsc --noEmit`; for tasks 8–11 re-read changed files before proceeding.
- **On completion:** run `npm run lint` and `npx tsc --noEmit` once more, then update `context/progress-tracker.md` `## In Progress` → append to `## Completed`.
- **Report:** state each step as DONE with the verifying command output (PASS/FAIL), and flag any deviation from this plan immediately — do not silently proceed.
