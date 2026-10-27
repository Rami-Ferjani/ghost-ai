"use client";

import { useRef } from "react";
import type { Project } from "@/types/project";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface RenameProjectDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** The project being renamed */
  project: Project | null;
  /** Current rename-form value (mirrors the selected project's current name) */
  renameName: string;
  setRenameName: (name: string) => void;
  /** Close the dialog (cancel/submit) */
  onClose: () => void;
}

/**
 * Rename Project dialog. Controlled via `open`; the page hook drives open/close and
 * the rename form is initialized to the selected project's CURRENT name. Enter
 * submits; Cancel/Close never submit.
 */
export const RenameProjectDialog: React.FC<RenameProjectDialogProps> = ({
  open,
  project,
  renameName,
  setRenameName,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  if (!project) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onClose();
  };

  const handleConfirm = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent initialFocus={inputRef}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Rename Project</DialogTitle>
          <DialogDescription>{`Renaming "${project.name}".`}</DialogDescription>

          <div className="flex flex-col gap-2">
            <Input
              aria-label="New project name"
              ref={inputRef}
              value={renameName}
              onChange={(event) => setRenameName(event.target.value)}
              placeholder={project.name}
              autoFocus
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button variant="default" onClick={handleConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
