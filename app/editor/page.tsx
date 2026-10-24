"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { EditorHome } from "@/components/editor/editor-home"
import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"
import { useProjectDialogs } from "@/app/editor/project-dialogs"
import { MOCK_PROJECTS } from "@/lib/mock-projects"

export default function EditorPage() {
  const { user } = useUser();
  const currentUserId = user?.id;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const dialogs = useProjectDialogs(currentUserId);

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
          onSelectProject={(project) => setSelectedProjectId(project.id)}
          onOpenCreate={dialogs.openCreate}
          onOpenRename={(project) => dialogs.openRename(project)}
          onOpenDelete={(project) => dialogs.openDelete(project)}
        />
        <main className="p-6">
          <EditorHome onOpenCreate={dialogs.openCreate} />
        </main>
      </div>

      {/* Dialogs render once at the page level, driven by the activeDialog state */}
      <CreateProjectDialog
        open={dialogs.activeDialog === "create"}
        createName={dialogs.createName}
        setCreateName={dialogs.setCreateName}
        onClose={dialogs.closeDialog}
      />
      <RenameProjectDialog
        open={dialogs.activeDialog === "rename"}
        project={dialogs.selectedProject}
        renameName={dialogs.renameName}
        setRenameName={dialogs.setRenameName}
        onClose={dialogs.closeDialog}
      />
      <DeleteProjectDialog
        open={dialogs.activeDialog === "delete"}
        project={dialogs.selectedProject}
        onClose={dialogs.closeDialog}
      />
    </div>
  );
}
