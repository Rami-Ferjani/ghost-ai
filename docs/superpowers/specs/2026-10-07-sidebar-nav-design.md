# Sidebar and Nav Bar Design Spec

## Date: 2026-10-07

## Overview

This spec describes the design for a sidebar and nav bar integration in Ghost AI's workspace. The sidebar will slide from the nav bar, contain project selection, templates, and workspace tools, and adapt behavior for mobile vs desktop layouts.

## Requirements

- Nav bar contains sidebar toggle and project title
- Sidebar slides from nav bar toggle on desktop
- Sidebar replaces nav bar entirely on mobile when open
- Sidebar contains My Projects, Templates, and Workspace Tools tabs
- Project selection highlights and navigates to project workspace
- State managed in component useState (no persistence)
- Collapsible/expandable with animations
- Responsive: hamburger menu on mobile

## Design Sections

### 1. Layout Structure

**Desktop:**
- Nav bar: fixed height ~56px at top
  - Left: sidebar toggle button (PanelLeftOpen/PanelLeftClose)
  - Center: project title/name (when selected)
  - Right: UserButton (Clerk)
- Sidebar: fixed width 320px on left
  - Slides in/out from nav bar toggle
  - Content area adjusts: `w-[calc(100%-320px)]` when open, `w-full` when closed
- Layout: `<nav>` top, `<aside>` left, `<main>` rest

**Mobile (< 768px):**
- Nav bar hides completely when sidebar open
- Sidebar becomes full-screen overlay (`w-full`)
- Sidebar header shows PanelLeftClose (hamburger)
- Content area full width (sidebar overlaps)
- On close, nav bar reappears

### 2. Sidebar Content & Sections

**Header:**
- Project name/title (when a project is selected)
- Close button (desktop: PanelLeftClose, mobile: PanelLeftClose)
- Collapsible with animation

**My Projects (default active tab):**
- List of projects with name, last edited date, and "Select" button
- Selected project gets highlight (background color change)
- Empty state: "No projects yet"

**Templates (tab):**
- Grid/list of template cards with name and description
- Clicking triggers import into current canvas
- Empty state: "No templates available yet"

**Workspace Tools (tab):**
- "View Spec" button (navigates to `/specs/[projectId]`)
- "Export Canvas" placeholder
- Empty state: "No tools available yet"

**Footer:**
- "Create New Project" button

Each tab is scrollable independently within sidebar.

### 3. Mobile Behavior

**Breakpoint:** 768px (`md` class in Tailwind)

**Sidebar CLOSED on mobile:**
- Nav bar fully visible: hamburger toggle, project title placeholder, UserButton
- Content area full width

**Sidebar OPEN on mobile:**
- Nav bar hidden (`hidden` class)
- Sidebar full-screen overlay (`w-full`)
- Header shows PanelLeftClose
- Content area full width
- Close → nav bar reappears

**Animation:** 300ms, ease-in-out (consistent with desktop)

### 4. State Management

All state in component `useState`:

```typescript
const [isSidebarOpen, setIsSidebarOpen] = useState(false)
const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
const [activeTab, setActiveTab] = useState<"my-projects" | "templates" | "workspace-tools">("my-projects")
```

**Interactions:**
- Nav bar toggle → flips `isSidebarOpen`
- Clicking project → sets `selectedProjectId` and highlights it
- Clicking template → triggers import action
- Tab clicks → switches `activeTab`
- Mobile close → sets `isSidebarOpen = false`

### 5. Navigation Flow

**New routes created:**
- `/editor/[projectId]` — project workspace page
- `/specs/[projectId]` — spec view page
- `/projects/new` — new project creation page

**Sidebar actions:**
- Click project in "My Projects" → navigate to `/editor/[projectId]`
- Click template → trigger import action
- Click "View Spec" → navigate to `/specs/[projectId]`
- "Create New Project" → navigate to `/projects/new`

### 6. Files to Create/Modify

**Modify:**
- `app/layout.tsx` — add navigation wrapper
- `app/page.tsx` — update redirect logic
- `app/editor/page.tsx` — integrate navbar and sidebar
- `components/editor/editor-navbar.tsx` — enhance with project title and sidebar toggle
- `components/editor/project-sidebar.tsx` — enhance with tabs, project selection, and sections

**Create:**
- `app/editor/[projectId]/page.tsx` — project-specific workspace
- `app/specs/[projectId]/page.tsx` — spec viewer
- `app/projects/new/page.tsx` — new project creation

### 7. Invariants

1. All state managed in component useState (no localStorage persistence)
2. Nav bar never overlaps sidebar on desktop
3. Sidebar replaces nav bar entirely on mobile when open
4. Template import uses same canvas schema as user-created content
5. Auth (Clerk) preserved on all new routes

## Success Criteria

1. User can toggle sidebar open/closed on desktop
2. Sidebar shows My Projects, Templates, and Workspace Tools tabs
3. Clicking a project navigates to its workspace page
4. Mobile layout: nav bar hides when sidebar open, sidebar becomes full-screen
5. Project selection is highlighted in sidebar
6. All new routes are accessible with Clerk auth
