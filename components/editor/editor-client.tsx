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
  /** Projects owned by the current user */
  ownedProjects: Project[];
  /** Projects shared with the current user (collaborators) */
  sharedProjects: Project[];
  /** Current user id (from the server component) */
  currentUserId?: string;
}

/**
 * Client shell for the editor page. Receives server-fetched projects and
 * `currentUserId`, owns the sidebar open state and active selection state, and
 * wires the custom `useProjectAction` hook to the three dialog components.
 */
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
        projectId={selectedProjectId ?? ""}
        projectName={selectedProjectId ? "Selected Project" : "Editor Home"}
        userId={currentUserId ?? ""}
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

      {/* Dialogs render once at the page level, driven by the activeDialog state */}
      <CreateProjectDialog
        open={action.activeDialog === "create"}
        createName={action.createName}
        setCreateName={action.setCreateName}
        onClose={action.closeDialog}
        onSubmit={action.handleCreate}
        error={action.error}
        isSubmitting={action.isSubmitting}
      />
      <RenameProjectDialog
        open={action.activeDialog === "rename"}
        project={action.selectedProject}
        renameName={action.renameName}
        setRenameName={action.setRenameName}
        onClose={action.closeDialog}
        onSubmit={action.handleRename}
        error={action.error}
        isSubmitting={action.isSubmitting}
      />
      <DeleteProjectDialog
        open={action.activeDialog === "delete"}
        project={action.selectedProject}
        onClose={action.closeDialog}
        onConfirm={action.handleDelete}
        isSubmitting={action.isSubmitting}
      />
    </div>
  );
};
