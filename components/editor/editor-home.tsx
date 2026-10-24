"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EditorHomeProps {
  /** Callback to open the Create Project dialog */
  onOpenCreate: () => void;
}

/**
 * Editor Home screen — centered "Create a project or open existing one"
 * entry point. No cards; minimal layout over the page background.
 */
export const EditorHome: React.FC<EditorHomeProps> = ({ onOpenCreate }) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
      <h1 className="text-2xl font-bold mb-4">Create a project or open existing one</h1>
      <p className="text-muted-foreground mb-8 max-w-xs">
        Start a new architecture workspace or choose a project on the sidebar
      </p>
      <Button
        type="button"
        variant="default"
        onClick={onOpenCreate}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        New Project
      </Button>
    </div>
  );
};
