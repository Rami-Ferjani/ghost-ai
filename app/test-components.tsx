"use client";

import { useUser } from "@clerk/nextjs";
import { useProjectDialogs } from "@/app/editor/project-dialogs"
import { MOCK_PROJECTS } from "@/lib/mock-projects"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useState } from "react"

export default function TestEditorChrome() {
  const { user } = useUser();
  const currentUserId = user?.id;
  const dialogs = useProjectDialogs(currentUserId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const selectedProjectId = dialogs.selectedProject?.id ?? null;

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
          projects={MOCK_PROJECTS}
          currentUserId={currentUserId}
          selectedProjectId={selectedProjectId}
          onSelectProject={(project) => dialogs.openRename(project)}
          onOpenCreate={dialogs.openCreate}
          onOpenRename={(project) => dialogs.openRename(project)}
          onOpenDelete={(project) => dialogs.openDelete(project)}
        />
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-4">Editor Chrome Demo</h1>
          <p className="text-muted-foreground">
            Toggle the sidebar using the button in the top-left corner.
          </p>
        </main>
      </div>
    </div>
  )
}

// Add to app/layout.tsx's metadata to make this page accessible
// You can test by visiting /test-components
