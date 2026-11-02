"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { PanelLeftOpen, PanelLeftClose, Share2, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import type { Project } from "@/types/project";
import type { CollaboratorEnrichment } from "@/lib/share-dialog-helpers";
import { ShareDialog } from "@/components/editor/share-dialog";

export interface EditorNavbarShareProps {
  /** Whether the share dialog is open */
  open: boolean;
  /** Close the share dialog */
  onClose: () => void;
  /** Open the share dialog */
  onOpenShare: () => void;
  /** The project being shared */
  project: Project | null;
  /** Current user's role for this project, derived from ownership/collaborator data */
  role: "owner" | "collaborator" | null;
  /** Current user's email */
  currentEmail: string;
  /** Enriched collaborator list for the project (already enriched, email keyed) */
  collaborators: CollaboratorEnrichment[];
  /** Invite form email value (owner only) */
  inviteEmail: string;
  setInviteEmail: (email: string) => void;
  /** Invite submit state (owner only) */
  isInviting?: boolean;
  /** Invite handler (owner only) */
  onInvite: () => Promise<void>;
  /** Remove a collaborator by email (owner only) */
  onRemove: (email: string) => Promise<void>;
  /** Project link to copy */
  copyUrl: string;
  /** Whether copy-link is currently copied */
  isCopied?: boolean;
  /** Copy-link handler */
  onCopyLink: () => Promise<void>;
}

export interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectId: string;
  projectName: string;
  userId: string;
  share?: EditorNavbarShareProps;
}

export const EditorNavbar: React.FC<EditorNavbarProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  projectId,
  projectName,
  userId,
  share,
}) => {
  const handleToggle = useCallback(() => {
    onToggleSidebar();
  }, [onToggleSidebar]);

  const handleShareToggle = useCallback(() => {
    if (share?.open) {
      share.onClose();
    } else {
      share?.onOpenShare();
    }
  }, [share]);

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

      {/* Center section – project name */}
      <div className="flex-1 flex justify-center">
        <span className="text-lg font-medium">{projectName}</span>
      </div>

      {/* Right section – share and AI toggles */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={handleShareToggle}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button variant="ghost" size="sm" className="gap-1">
          <PanelRightOpen className="h-4 w-4" />
          AI
        </Button>
        <UserButton />
      </div>

      {/* Share dialog — composed when share context is provided */}
      {share && (
        <ShareDialog
          open={share.open}
          onClose={share.onClose}
          project={share.project}
          role={share.role}
          currentEmail={share.currentEmail}
          collaborators={share.collaborators}
          inviteEmail={share.inviteEmail}
          setInviteEmail={share.setInviteEmail}
          isInviting={share.isInviting}
          onInvite={share.onInvite}
          onRemove={share.onRemove}
          copyUrl={share.copyUrl}
          isCopied={share.isCopied}
          onCopyLink={share.onCopyLink}
        />
      )}
    </header>
  );
};
