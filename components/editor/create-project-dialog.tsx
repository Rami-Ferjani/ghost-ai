"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugFromName } from "@/lib/slug";

export interface CreateProjectDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Current create-form value */
  createName: string;
  setCreateName: (name: string) => void;
  /** Close the dialog (cancel/close/submit) */
  onClose: () => void;
  /** Submit the create action (called on form submit / Confirm) */
  onSubmit: () => Promise<void>;
  /** Whether the create action is currently submitting */
  isSubmitting?: boolean;
  /** Error message from failed submission */
  error?: string | null;
}

/**
 * Create Project dialog. Controlled via `open`; the page hook drives open/close
 * and the selected project is never stale. Confirm is disabled until a non-empty
 * name produces a slug. Enter submits; Cancel/Close never submits.
 */
export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  open,
  createName,
  setCreateName,
  onClose,
  onSubmit,
  isSubmitting = false,
  error,
}) => {
  const slug = useMemo(() => slugFromName(createName), [createName]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!slug || isSubmitting || createName.trim().length === 0) return;
    onSubmit();
  };

  const handleConfirm = () => {
    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Give your workspace a name. A slug is generated automatically.
          </DialogDescription>

          <div className="flex flex-col gap-2">
            <Input
              aria-label="Project name"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              placeholder="Project name"
              autoFocus
            />
            <p className="text-copy-muted text-sm">
              Slug preview: {slug}
            </p>
            {error && (
              <p className="text-destructive text-sm">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button variant="default" disabled={!slug || isSubmitting || createName.trim().length === 0} onClick={handleConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
