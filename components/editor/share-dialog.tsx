"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckCircle2Icon } from "lucide-react";
import type { Project } from "@/types/project";
import type { CollaboratorEnrichment } from "@/lib/share-dialog-helpers";

export interface ShareDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Close the dialog */
  onClose: () => void;
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

/**
 * Share dialog. Controlled via `open`; ownership-aware read-only enforcement:
 * the owner sees the invite form and remove buttons, while collaborators see
 * only the read-only collaborator list (no invite/remove UI). Copy-link
 * surfaces `Copied!` feedback. The current user's role for the project is
 * derived from the ownership/collaborator data passed by the composition —
 * no local user table, no Clerk identity replaced.
 */
export const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  project,
  role,
  currentEmail,
  collaborators,
  inviteEmail,
  setInviteEmail,
  isInviting = false,
  onInvite,
  onRemove,
  copyUrl,
  isCopied = false,
  onCopyLink,
}) => {
  const isOwner = role === "owner";
  const [localInviteError, setLocalInviteError] = useState<string | null>(null);

  // Show only collaborators other than the current user (the owner's own row
  // is not a collaborator of their own project).
  const visibleCollaborators = useMemo(
    () =>
      currentEmail
        ? collaborators.filter((c) => c.email !== currentEmail)
        : collaborators,
    [collaborators, currentEmail],
  );

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inviteEmail.trim() || isInviting) return;
    setLocalInviteError(null);
    await onInvite();
    // Remove post-invite write-back to avoid overwriting parent's field state
    // after onInvite resolves; preserve clear/reset behavior.
  };

  const handleRemove = async (email: string) => {
    await onRemove(email);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(copyUrl);
      await onCopyLink();
    } catch {
      // Write failure: leave feedback unset; do not overwrite parent state.
    }
  };

  if (!project || !role) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleInvite}>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            {isOwner
              ? `Invite collaborators for "${project.name}" to collaborate.`
              : `You have access to "${project.name}". Collaborators can view it read-only.`}
          </DialogDescription>

          {/* Invite form — owner only */}
          {isOwner && (
            <div className="flex flex-col gap-2">
              <Input
                aria-label="Invite collaborator email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="Collaborator email"
                autoFocus
              />
              <Button
                type="submit"
                variant="default"
                disabled={!inviteEmail.trim() || isInviting}
              >
                Invite collaborator
              </Button>
              {localInviteError && (
                <p className="text-destructive text-sm">{localInviteError}</p>
              )}
            </div>
          )}

          {/* Collaborator list — read-only for non-owners (no remove UI) */}
          <div className="flex flex-col gap-2">
            {visibleCollaborators.length === 0 ? (
              <p className="text-muted-foreground text-sm">No collaborators yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {visibleCollaborators.map((collaborator) => (
                  <li
                    key={collaborator.email}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{collaborator.name}</span>
                      {collaborator.avatarUrl && (
                        <img
                          src={collaborator.avatarUrl}
                          alt={collaborator.name}
                          className="h-6 w-6 rounded-full"
                        />
                      )}
                      <span className="text-muted-foreground">{collaborator.email}</span>
                    </div>
                    {isOwner && (
                      <Button variant="outline" size="sm" onClick={() => handleRemove(collaborator.email)}>
                        Remove
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!isOwner && (
              <p className="text-muted-foreground text-sm">Collaborator list is read-only.</p>
            )}
          </div>

          {/* Copy-link — visible for all roles; surfaces Copied! feedback */}
          <div className="flex flex-col gap-2">
            <Button
              variant="default"
              onClick={handleCopyLink}
              aria-label="Copy project link"
            >
              <CopyIcon className="h-4 w-4" />
              Copy link
            </Button>
            {isCopied && (
              <p className="flex items-center gap-1 text-sm font-medium">
                <CheckCircle2Icon className="h-4 w-4 text-muted-foreground" />
                Copied!
              </p>
            )}
            {!isCopied && copyUrl && (
              <p className="text-muted-foreground text-sm">{copyUrl}</p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};