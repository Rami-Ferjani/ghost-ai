"use client";

import { useUser } from "@clerk/nextjs";
import { useProjectAction } from "@/hooks/use-project-action"
import { MOCK_PROJECTS } from "@/lib/mock-projects"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useState } from "react"
import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"

export default function TestEditorChrome() {
  const { user } = useUser();
  const currentUserId = user?.id;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const action = useProjectAction({ currentUserId, activeProjectId: selectedProjectId });

  return (
    <div className="flex flex-col h-screen bg-background">
      <EditorNavbar
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        projectId={selectedProjectId ?? "test-project"}
        projectName={selectedProjectId ? "Test Project" : "Demo"}
        userId={currentUserId ?? "test-user"}
      />
      <div className="flex-1 overflow-hidden">
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          projects={MOCK_PROJECTS}
          currentUserId={currentUserId}
          selectedProjectId={selectedProjectId}
          onSelectProject={(project) => setSelectedProjectId(project.id)}
          onOpenCreate={action.openCreate}
          onOpenRename={(project) => action.openRename(project)}
          onOpenDelete={(project) => action.openDelete(project)}
        />
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-4">Editor Chrome Demo</h1>
          <p className="text-muted-foreground">
            Toggle the sidebar using the button in the top-left corner.
          </p>
        </main>
      </div>

      {/* Dialogs render once at the page level, driven by the activeDialog state */}
      <CreateProjectDialog
        open={action.activeDialog === "create"}
        createName={action.createName}
        setCreateName={action.setCreateName}
        onClose={action.closeDialog}
        onSubmit={action.handleCreate}
      />
      <RenameProjectDialog
        open={action.activeDialog === "rename"}
        project={action.selectedProject}
        renameName={action.renameName}
        setRenameName={action.setRenameName}
        onClose={action.closeDialog}
        onSubmit={action.handleRename}
      />
      <DeleteProjectDialog
        open={action.activeDialog === "delete"}
        project={action.selectedProject}
        onClose={action.closeDialog}
        onConfirm={action.handleDelete}
      />
    </div>
  )
}

// Add to app/layout.tsx's metadata to make this page accessible
// You can test by visiting /test-components
