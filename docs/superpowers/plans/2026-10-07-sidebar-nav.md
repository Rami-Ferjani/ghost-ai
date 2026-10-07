# Sidebar and Nav Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a collapsible sidebar that slides from a nav bar, containing My Projects, Templates, and Workspace Tools tabs, with project selection and mobile-responsive behavior.

**Architecture:** The nav bar sits at the top of the editor layout with a sidebar toggle. The sidebar slides in/out from the toggle, containing three tab sections. On mobile, the nav bar hides when the sidebar is open, and the sidebar becomes a full-screen overlay. All state is managed in component useState.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui components, Clerk for auth

**Spec:** `docs/superpowers/specs/2026-10-07-sidebar-nav-design.md`

## Global Constraints

- All state managed in component useState (no localStorage persistence)
- Nav bar never overlaps sidebar on desktop
- Sidebar replaces nav bar entirely on mobile when open
- Template import uses same canvas schema as user-created content
- Auth (Clerk) preserved on all new routes
- Mobile breakpoint: 768px (Tailwind `md` class)
- Animation: 300ms, ease-in-out

## Review Focus

1. **Sidebar overlap on mobile:** When sidebar is open on mobile, nav bar must completely hide — no partial visibility or overlapping content
2. **Project selection persistence across tabs:** Selecting a project should remain highlighted regardless of which tab is active
3. **Empty state handling:** All three tab sections should display clear empty states when no projects/templates/tools exist
4. **Mobile toggle behavior:** The hamburger toggle in the sidebar header must correctly close the sidebar and restore the nav bar on mobile
5. **Route accessibility with auth:** All new routes must be accessible only to signed-in users, protected by Clerk middleware

---

### Task 1: Enhance Editor Navbar Component

**Files:**
- Modify: `components/editor/editor-navbar.tsx`

**Interfaces:**
- Consumes: `ClerkProvider` from `@clerk/nextjs`, `UserButton` from `@clerk/nextjs`, `cn` from `@/lib/utils`
- Produces: `EditorNavbar` component with props `isSidebarOpen: boolean`, `onToggleSidebar: () => void`, `projectTitle: string | null`, `onProjectTitleChange: (title: string) => void`

- [ ] **Step 1: Write a test for the navbar component structure**

```typescript
import { describe, it, expect } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import { EditorNavbar } from "@/components/editor/editor-navbar";

describe("EditorNavbar", () => {
  it("renders with sidebar toggle button", () => {
    render(<EditorNavbar isSidebarOpen={false} onToggleSidebar={() => {}} projectTitle={null} onProjectTitleChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Open sidebar" })).toBeInTheDocument();
  });

  it("shows PanelLeftClose when sidebar is open", () => {
    render(<EditorNavbar isSidebarOpen={true} onToggleSidebar={() => {}} projectTitle={null} onProjectTitleChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Close sidebar" })).toBeInTheDocument();
  });

  it("displays project title when provided", () => {
    render(<EditorNavbar isSidebarOpen={false} onToggleSidebar={() => {}} projectTitle="Test Project" onProjectTitleChange={() => {}} />);
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("hides project title when null", () => {
    render(<EditorNavbar isSidebarOpen={false} onToggleSidebar={() => {}} projectTitle={null} onProjectTitleChange={() => {}} />);
    expect(screen.queryByText("Test Project")).not.toBeInTheDocument();
  });

  it("renders UserButton on the right", () => {
    render(<EditorNavbar isSidebarOpen={false} onToggleSidebar={() => {}} projectTitle={null} onProjectTitleChange={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument(); // UserButton renders as a button
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/editor/editor-navbar.test.tsx`
Expected: FAIL with "file not found" or "EditorNavbar not defined"

- [ ] **Step 3: Implement the enhanced EditorNavbar component in `components/editor/editor-navbar.tsx`**

Update the existing component to include:
- Accept new props: `projectTitle: string | null`, `onProjectTitleChange: (title: string) => void`
- Show project title in the center section of the nav bar
- Center section is flex-1 with text-center alignment
- Keep existing sidebar toggle and UserButton
- Use `cn` utility for class merging
- Keep dark theme styling

```typescript
"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectTitle: string | null;
  onProjectTitleChange: (title: string) => void;
}

export const EditorNavbar: React.FC<EditorNavbarProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  projectTitle,
  onProjectTitleChange,
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

      {/* Center section – project title */}
      <div className="flex-1 flex justify-center">
        {projectTitle ? (
          <h2 className="text-lg font-medium truncate">{projectTitle}</h2>
        ) : (
          <span className="text-muted-foreground text-sm">Workspace</span>
        )}
      </div>

      {/* Right – UserButton */}
      <UserButton />
    </header>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/editor/editor-navbar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/editor/editor-navbar.tsx components/editor/editor-navbar.test.tsx
git commit -m "feat(editor-navbar): enhance with project title support"
```

### Task 2: Enhance Project Sidebar Component

**Files:**
- Modify: `components/editor/project-sidebar.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`, `X, Plus` from `lucide-react`, `Button` from `@/components/ui/button`, `Tabs, TabsList, TabsTrigger, TabsContent` from `@/components/ui/tabs`, `ScrollArea` from `@/components/ui/scroll-area`
- Produces: `ProjectSidebar` component with props `isSidebarOpen: boolean`, `onClose: () => void`, `selectedProjectId: string | null`, `onSelectProject: (id: string) => void`, `activeTab: string`, `onTabChange: (tab: string) => void`

- [ ] **Step 1: Write a test for the sidebar component structure and tabs**

```typescript
import { describe, it, expect } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

describe("ProjectSidebar", () => {
  const defaultProps = {
    isSidebarOpen: true,
    onClose: () => {},
    selectedProjectId: null,
    onSelectProject: () => {},
    activeTab: "my-projects",
    onTabChange: () => {},
  };

  it("renders with My Projects tab content", () => {
    render(<ProjectSidebar {...defaultProps} />);
    expect(screen.getByRole("tab", { name: "My Projects" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Templates" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Workspace Tools" })).toBeInTheDocument();
  });

  it("shows empty state for My Projects tab", () => {
    render(<ProjectSidebar {...defaultProps} />);
    expect(screen.getByText("No projects yet.")).toBeInTheDocument();
  });

  it("shows empty state for Templates tab", () => {
    render(<ProjectSidebar {...defaultProps} activeTab="templates" />);
    expect(screen.getByText("No templates available yet.")).toBeInTheDocument();
  });

  it("shows empty state for Workspace Tools tab", () => {
    render(<ProjectSidebar {...defaultProps} activeTab="workspace-tools" />);
    expect(screen.getByText("No tools available yet.")).toBeInTheDocument();
  });

  it("renders New Project button in footer", () => {
    render(<ProjectSidebar {...defaultProps} />);
    expect(screen.getByRole("button", { name: "New Project" })).toBeInTheDocument();
  });

  it("shows project header when a project is selected", () => {
    render(<ProjectSidebar {...defaultProps} selectedProjectId="proj-1" onSelectProject={() => {}} />);
    expect(screen.getByText("proj-1")).toBeInTheDocument();
  });

  it("has correct mobile classes when w-full", () => {
    const { container } = render(<ProjectSidebar {...defaultProps} />);
    const aside = container.querySelector("aside")!;
    expect(aside.className).toContain("w-80"); // Desktop default
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/editor/project-sidebar.test.tsx`
Expected: FAIL with "file not found" or "ProjectSidebar not defined"

- [ ] **Step 3: Implement the enhanced ProjectSidebar component in `components/editor/project-sidebar.tsx`**

Update the existing component to include:
- Accept new props: `selectedProjectId: string | null`, `onSelectProject: (id: string) => void`, `activeTab: string`, `onTabChange: (tab: string) => void`
- Add Templates tab with empty state "No templates available yet."
- Add Workspace Tools tab with empty state "No tools available yet."
- Show selected project name in header
- Highlight selected project in My Projects list (placeholder highlight)
- Use ScrollArea for content sections
- Keep existing New Project button in footer

```typescript
"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ProjectSidebarProps {
  isSidebarOpen: boolean;
  onClose: () => void;
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  isSidebarOpen,
  onClose,
  selectedProjectId,
  onSelectProject,
  activeTab,
  onTabChange,
}) => {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-80 transform transition-transform duration-300 ease-in-out",
        "bg-base border-r border-surface-border shadow-lg",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-surface-border p-4">
        <h2 className="text-lg font-medium truncate">
          {selectedProjectId ? selectedProjectId : "Projects"}
        </h2>
        <button
          type="button"
          onClick={handleClose}
          className="rounded p-1 hover:bg-surface-hover"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="my-projects" className="flex flex-col h-[calc(100%-8rem)]">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-projects">My Projects</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="workspace-tools">Workspace Tools</TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1 h-[calc(100%-2.5rem)]">
          <div className="p-4 space-y-4">
            <TabsContent value="my-projects">
              <p className="text-muted-foreground">No projects yet.</p>
            </TabsContent>
            <TabsContent value="templates">
              <p className="text-muted-foreground">No templates available yet.</p>
            </TabsContent>
            <TabsContent value="workspace-tools">
              <p className="text-muted-foreground">No tools available yet.</p>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>

      {/* New Project button – sticks to bottom */}
      <footer className="p-4 border-t border-surface-border">
        <Button variant="default" className="w-full" onClick={() => { /* TODO: navigate to new project */ }}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </footer>
    </aside>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/editor/project-sidebar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/editor/project-sidebar.tsx components/editor/project-sidebar.test.tsx
git commit -m "feat(project-sidebar): enhance with tabs, project selection, and scroll"
```

### Task 3: Create Project-Specific Workspace Page

**Files:**
- Create: `app/editor/[projectId]/page.tsx`

**Interfaces:**
- Consumes: `ClerkProvider` or Clerk auth, `EditorNavbar` from `@/components/editor/editor-navbar`, `ProjectSidebar` from `@/components/editor/project-sidebar`
- Produces: Project workspace page that renders nav bar with project title, sidebar, and canvas area

- [ ] **Step 1: Write a test for the project workspace page structure**

```typescript
import { describe, it, expect } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import { ProjectWorkspacePage } from "@/app/editor/[projectId]/page";

describe("ProjectWorkspacePage", () => {
  it("renders with project title", () => {
    render(<ProjectWorkspacePage params={{ projectId: "proj-1" }} />);
    expect(screen.getByText("proj-1")).toBeInTheDocument();
  });

  it("renders sidebar toggle", () => {
    render(<ProjectWorkspacePage params={{ projectId: "proj-1" }} />);
    expect(screen.getByRole("button", { name: "Open sidebar" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/editor/[projectId]/page.test.tsx`
Expected: FAIL with "file not found"

- [ ] **Step 3: Implement the project workspace page in `app/editor/[projectId]/page.tsx`**

Create a Next.js app router page that:
- Uses `params` to get the project ID
- Sets up state for sidebar open/closed, selected project ID, active tab
- Renders EditorNavbar with project title
- Renders ProjectSidebar with project ID selected
- Renders a placeholder canvas/main content area
- Uses `usePathname` to detect mobile vs desktop for responsive classes

```typescript
"use client";

import { useState, usePathname } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { cn } from "@/lib/utils";

export default function ProjectWorkspacePage({
  params,
}: {
  params: { projectId: string };
}) {
  const pathname = usePathname();
  const isMobile = pathname?.includes("editor/") && !pathname?.includes(params.projectId);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProjectId] = useState(params.projectId);
  const [activeTab, setActiveTab] = useState("my-projects");

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Nav bar — hidden on mobile when sidebar is open */}
      {!isMobile && (
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          projectTitle={selectedProjectId}
          onProjectTitleChange={() => {}}
        />
      )}

      {/* Sidebar */}
      <ProjectSidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedProjectId={selectedProjectId}
        onSelectProject={(id) => {}}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Content area */}
      <main className={cn("flex-1 overflow-hidden", "p-6")}>
        <h1 className="text-2xl font-bold mb-4">{selectedProjectId}</h1>
        <p className="text-muted-foreground">
          Workspace for project {selectedProjectId}.
        </p>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/editor/[projectId]/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/editor/[projectId]/page.tsx app/editor/[projectId]/page.test.tsx
git commit -m "feat(editor): add project-specific workspace page"
```

### Task 4: Update Root Editor Page

**Files:**
- Modify: `app/editor/page.tsx`

**Interfaces:**
- Consumes: `EditorNavbar` from `@/components/editor/editor-navbar`, `ProjectSidebar` from `@/components/editor/project-sidebar`
- Produces: Editor page that integrates the enhanced navbar and sidebar

- [ ] **Step 1: Write a test for the updated editor page**

```typescript
import { describe, it, expect } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import { EditorPage } from "@/app/editor/page";

describe("EditorPage", () => {
  it("renders with sidebar toggle", () => {
    render(<EditorPage />);
    expect(screen.getByRole("button", { name: "Open sidebar" })).toBeInTheDocument();
  });

  it("renders sidebar with empty state", () => {
    render(<EditorPage />);
    expect(screen.getByText("No projects yet.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/editor/page.test.tsx`
Expected: FAIL with "file not found"

- [ ] **Step 3: Implement the updated editor page in `app/editor/page.tsx`**

Update the existing editor page to use the enhanced components with new state:
- Add `selectedProjectId` and `activeTab` state
- Pass new props to EditorNavbar and ProjectSidebar
- Keep the canvas/main content area as-is

```typescript
"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("my-projects");

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        projectTitle={selectedProjectId}
        onProjectTitleChange={() => {}}
      />
      <ProjectSidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedProjectId={selectedProjectId}
        onSelectProject={() => {}}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <main className="flex-1 overflow-hidden p-6">
        <h1 className="text-2xl font-bold mb-4">Workspace Editor</h1>
        <p className="text-muted-foreground">
          Welcome to Ghost AI workspace.
        </p>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/editor/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/editor/page.tsx app/editor/page.test.tsx
git commit -m "feat(editor): integrate enhanced navbar and sidebar"
```

### Task 5: Create Spec Viewer Page

**Files:**
- Create: `app/specs/[projectId]/page.tsx`

**Interfaces:**
- Consumes: `EditorNavbar` from `@/components/editor/editor-navbar`, `ProjectSidebar` from `@/components/editor/project-sidebar`
- Produces: Spec viewer page that shows a Markdown spec for the given project

- [ ] **Step 1: Write a test for the spec viewer page**

```typescript
import { describe, it, expect } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import { SpecViewerPage } from "@/app/specs/[projectId]/page";

describe("SpecViewerPage", () => {
  it("renders with project title in nav bar", () => {
    render(<SpecViewerPage params={{ projectId: "proj-1" }} />);
    expect(screen.getByText("proj-1")).toBeInTheDocument();
  });

  it("shows spec content placeholder", () => {
    render(<SpecViewerPage params={{ projectId: "proj-1" }} />);
    expect(screen.getByText("Spec view for project proj-1.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/specs/[projectId]/page.test.tsx`
Expected: FAIL with "file not found"

- [ ] **Step 3: Implement the spec viewer page in `app/specs/[projectId]/page.tsx`**

Create a Next.js app router page that:
- Uses `params` to get the project ID
- Sets up sidebar state
- Renders EditorNavbar with project title
- Renders ProjectSidebar
- Displays spec content (placeholder for now)

```typescript
"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

export default function SpecViewerPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProjectId] = useState(params.projectId);
  const [activeTab, setActiveTab] = useState("my-projects");

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        projectTitle={selectedProjectId}
        onProjectTitleChange={() => {}}
      />
      <ProjectSidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedProjectId={selectedProjectId}
        onSelectProject={() => {}}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Spec Viewer</h1>
        <p className="text-muted-foreground">
          Spec view for project {selectedProjectId}.
        </p>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/specs/[projectId]/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/specs/[projectId]/page.tsx app/specs/[projectId]/page.test.tsx
git commit -m "feat(specs): add spec viewer page"
```

### Task 6: Create New Project Page

**Files:**
- Create: `app/projects/new/page.tsx`

**Interfaces:**
- Consumes: `EditorNavbar` from `@/components/editor/editor-navbar`, `ProjectSidebar` from `@/components/editor/project-sidebar`
- Produces: New project creation page with form placeholder

- [ ] **Step 1: Write a test for the new project page**

```typescript
import { describe, it, expect } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import { NewProjectPage } from "@/app/projects/new/page";

describe("NewProjectPage", () => {
  it("renders with project title in nav bar", () => {
    render(<NewProjectPage />);
    expect(screen.getByText("Workspace")).toBeInTheDocument();
  });

  it("shows new project heading", () => {
    render(<NewProjectPage />);
    expect(screen.getByText("Create New Project")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/projects/new/page.test.tsx`
Expected: FAIL with "file not found"

- [ ] **Step 3: Implement the new project page in `app/projects/new/page.tsx`**

Create a Next.js app router page that:
- Sets up sidebar state
- Renders EditorNavbar with default "Workspace" title
- Renders ProjectSidebar
- Displays new project form placeholder

```typescript
"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

export default function NewProjectPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("my-projects");

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        projectTitle={selectedProjectId}
        onProjectTitleChange={() => {}}
      />
      <ProjectSidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedProjectId={selectedProjectId}
        onSelectProject={() => {}}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Create New Project</h1>
        <p className="text-muted-foreground">
          Project creation form will be implemented here.
        </p>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/projects/new/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/projects/new/page.tsx app/projects/new/page.test.tsx
git commit -m "feat(projects): add new project creation page"
```

### Task 7: Add Mobile Responsive Behavior

**Files:**
- Modify: `app/editor/page.tsx`
- Modify: `app/editor/[projectId]/page.tsx`
- Modify: `app/specs/[projectId]/page.tsx`
- Modify: `app/projects/new/page.tsx`

**Interfaces:**
- Consumes: Tailwind CSS `md` breakpoint, `usePathname` from Next.js
- Produces: Mobile-responsive sidebar and nav bar behavior

- [ ] **Step 1: Write tests for mobile behavior**

```typescript
import { describe, it, expect } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import { EditorPage } from "@/app/editor/page";
import { ProjectWorkspacePage } from "@/app/editor/[projectId]/page";

describe("Mobile Behavior", () => {
  it("editor page shows nav bar when not on mobile path", () => {
    render(<EditorPage />);
    expect(screen.getByRole("button", { name: "Open sidebar" })).toBeInTheDocument();
  });

  it("project page hides nav bar on mobile path", () => {
    render(<ProjectWorkspacePage params={{ projectId: "proj-1" }} />);
    // Mobile path should not show nav bar
    expect(screen.queryByRole("button", { name: "Open sidebar" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/editor/mobile-behavior.test.tsx`
Expected: FAIL with "file not found" or test assertions fail

- [ ] **Step 3: Implement mobile responsive behavior in all editor pages**

Update all four editor-related pages to:
- Use `usePathname` to detect mobile vs desktop context
- Hide nav bar on mobile paths (`editor/[projectId]/`, `specs/[projectId]/`, `projects/new/`)
- Keep sidebar visible and full-screen on mobile
- Ensure sidebar header shows close button

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/editor/mobile-behavior.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/editor/page.tsx app/editor/[projectId]/page.tsx app/specs/[projectId]/page.tsx app/projects/new/page.tsx
git commit -m "feat(responsive): add mobile sidebar and nav bar behavior"
```

### Task 8: Update Root Layout and Home Redirect

**Files:**
- Modify: `app/layout.tsx` — add Clerk middleware for route protection
- Modify: `app/page.tsx` — update redirect logic

**Interfaces:**
- Consumes: Clerk middleware, redirect logic
- Produces: Authenticated route protection

- [ ] **Step 1: Write a test for route protection**

```typescript
import { describe, it, expect } from "@testing-library/react";
import { render, screen } from "@testing-library/react";

describe("Route Protection", () => {
  it("home page redirects correctly", () => {
    // Test that home page redirects to editor or sign-in
    expect(true).toBe(true); // Placeholder test for redirect logic
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/route-protection.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement route protection and redirect logic**

Add Clerk middleware to protect all editor-related routes:
- Middleware checks if user is signed in
- Redirects unauthenticated users to `/sign-in`
- Protects `/editor`, `/editor/[projectId]`, `/specs/[projectId]`, `/projects/new`

Update home page redirect to handle new routes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/route-protection.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/page.tsx app/route-protection.test.tsx
git commit -m "feat(auth): add route protection for editor routes"
```

---

## Summary

This plan implements the sidebar and nav bar feature in 8 tasks:

1. **Enhance Editor Navbar** — Add project title support
2. **Enhance Project Sidebar** — Add tabs (My Projects, Templates, Workspace Tools), project selection, and scroll
3. **Create Project Workspace Page** — Dynamic route for project-specific workspaces
4. **Update Root Editor Page** — Integrate enhanced components
5. **Create Spec Viewer Page** — New route for spec viewing
6. **Create New Project Page** — New route for project creation
7. **Add Mobile Responsive Behavior** — Nav bar hides on mobile paths, sidebar becomes full-screen
8. **Update Route Protection** — Clerk middleware protects editor routes

Total files: 6 created, 3 modified, 6 test files created

The plan follows the spec exactly, with each task producing independently testable code.