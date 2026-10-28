"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/project";

export interface DeleteProjectDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** The project to delete */
  project: Project | null;
  /** Close the dialog (cancel/submit) */
  onClose: () => void;
  /** Confirm the delete action (called on Confirm button click) */
  onConfirm: () => Promise<void>;
  /** Whether the delete action is currently submitting */
  isSubmitting?: boolean;
}

/**
 * Delete Project dialog. Controlled via `open`; no text input — Confirm is a
 * destructive confirmation. Cancel/Close only closes; Confirm calls onClose.
 */
export const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({
  open,
  project,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <div className="flex flex-col gap-2">
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>{`Are you sure you want to delete "${project.name}"? This cannot be undone.`}</DialogDescription>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
