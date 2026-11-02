"use client";
import { useState, useCallback } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { CanvasPlaceholder } from "@/components/editor/canvas-placeholder";
import { AISidebarPlaceholder } from "@/components/editor/ai-sidebar-placeholder";
import type { CollaboratorEnrichment } from "@/lib/share-dialog-helpers";

export interface WorkspaceToggleClientProps {
  project: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
  };
  userId: string;
  role: "owner" | "collaborator" | null;
  currentEmail: string;
  collaborators: CollaboratorEnrichment[];
}

export const WorkspaceToggleClient: React.FC<WorkspaceToggleClientProps> = ({
  project,
  userId,
  role,
  currentEmail,
  collaborators,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleToggleSidebar = useCallback(
    () => setSidebarOpen((open) => !open),
    []
  );

  const handleOnOpenShare = useCallback(() => setShareOpen(true), []);
  const handleOnClose = useCallback(() => setShareOpen(false), []);

  const handleInvite = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/collaborators`, {
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
  }, [inviteEmail, project.id]);

  const handleRemove = useCallback(async (email: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/collaborators`, {
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
  }, [project.id]);

  const handleCopyLink = useCallback(async () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  }, []);

  const share = {
    open: shareOpen,
    onClose: handleOnClose,
    onOpenShare: handleOnOpenShare,
    project,
    role,
    currentEmail,
    collaborators,
    inviteEmail,
    setInviteEmail,
    isInviting,
    onInvite: handleInvite,
    onRemove: handleRemove,
    copyUrl: `/editor/${project.slug}`,
    isCopied,
    onCopyLink: handleCopyLink,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top navbar */}
      <EditorNavbar
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        projectId={project.id}
        projectName={project.name}
        userId={userId}
        share={share}
      />
      {/* Body: left sidebar, right AI sidebar, central canvas */}
      <div className="flex h-full overflow-hidden">
        {/* Left sidebar */}
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          projects={[project]}
          currentUserId={userId}
          selectedProjectId={project.id}
          onSelectProject={() => setSidebarOpen(true)}
          onOpenCreate={() => {}}
          onOpenRename={() => {}}
          onOpenDelete={() => {}}
        />
        {/* Central canvas placeholder */}
        <main className="flex-1 overflow-hidden">
          <CanvasPlaceholder />
        </main>
        {/* Right AI sidebar */}
        <AISidebarPlaceholder />
      </div>
    </div>
  );
};
