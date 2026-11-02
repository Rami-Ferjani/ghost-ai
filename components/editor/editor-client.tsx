"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types/project";
import type { CollaboratorEnrichment } from "@/lib/share-dialog-helpers";
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
  /** Current user email (from the server component) */
  currentEmail?: string;
}

/**
 * Client shell for the editor page. Receives server-fetched projects and
 * `currentUserId`/`currentEmail`, owns the sidebar open state, active selection
 * state, and the share dialog state (open, invite form, collaborator list), and
 * wires the custom `useProjectAction` hook to the three dialog components.
 */
export const EditorClient: React.FC<EditorClientProps> = ({
  ownedProjects,
  sharedProjects,
  currentUserId,
  currentEmail,
}) => {
  const router = useRouter();
  const allProjects = [...ownedProjects, ...sharedProjects];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorEnrichment[]>([]);
  const action = useProjectAction({ currentUserId, activeProjectId: selectedProjectId });

  // Navigate to workspace when a project is selected
  useEffect(() => {
    if (selectedProjectId) {
      router.push(`/editor/${selectedProjectId}`);
      router.refresh();
    }
  }, [selectedProjectId, router]);

  // Refresh collaborator data when the share dialog is opened for the selected project.
  // The room page (server component) already fetches collaborators for workspaces;
  // this keeps the home-page share model in sync when the share dialog opens.
  const refreshCollaborators = useCallback(async () => {
    if (!selectedProjectId) {
      setCollaborators([]);
      return;
    }
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/collaborators`);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      const list = data.collaborators;
      setCollaborators(Array.isArray(list) ? list : []);
    } catch {
      // Network/API errors: keep the existing collaborator list.
    }
  }, [selectedProjectId]);

  const selectedProject = allProjects.find((p) => p.id === selectedProjectId) ?? null;
  const copyUrl = selectedProject ? `/editor/${selectedProject.slug}` : "";

  // Derive the current user's role for the selected project.
  const isOwner =
    selectedProject !== null && selectedProject.ownerId === currentUserId;
  const isCollaborator =
    currentEmail !== undefined &&
    currentEmail !== "" &&
    collaborators.some((c) => c.email === currentEmail);
  const role: "owner" | "collaborator" | null =
    isOwner ? "owner" : isCollaborator ? "collaborator" : null;

  const handleOnOpenShare = useCallback(() => {
    refreshCollaborators();
    setShareOpen(true);
  }, [refreshCollaborators]);
  const handleOnClose = useCallback(() => setShareOpen(false), []);

  const handleInvite = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (res.ok) {
        setInviteEmail("");
      }
    } catch {
      // Invite failed: keep the invite email for retry.
    } finally {
      setIsInviting(false);
    }
  }, [selectedProjectId, inviteEmail]);

  const handleRemove = useCallback(
    async (email: string) => {
      if (!selectedProjectId) return;
      try {
        const res = await fetch(`/api/projects/${selectedProjectId}/collaborators`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (res.ok) {
          setInviteEmail("");
        }
      } catch {
        // Remove failed: leave the email as-is for retry.
      }
    },
    [selectedProjectId]
  );

  const handleCopyLink = useCallback(async () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  }, []);

  const share = {
    open: shareOpen,
    onClose: handleOnClose,
    onOpenShare: handleOnOpenShare,
    project: selectedProject,
    role,
    currentEmail: currentEmail ?? "",
    collaborators,
    inviteEmail,
    setInviteEmail,
    isInviting,
    onInvite: handleInvite,
    onRemove: handleRemove,
    copyUrl,
    isCopied,
    onCopyLink: handleCopyLink,
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <EditorNavbar
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        projectId={selectedProjectId ?? ""}
        projectName={selectedProjectId ? "Selected Project" : "Editor Home"}
        userId={currentUserId ?? ""}
        share={share}
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
